"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptionsProcessor = void 0;
const child_process_1 = __importDefault(require("child_process"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
const util_1 = require("util");
const dotenv_1 = __importDefault(require("dotenv"));
const node_cron_1 = __importDefault(require("node-cron"));
const picomatch_1 = __importDefault(require("picomatch"));
const selfsigned_1 = __importDefault(require("selfsigned"));
const helpers_1 = require("../helpers");
const helpers_2 = require("../kv/helpers");
const scripts_1 = require("../scripts");
const wrangler_1 = require("./wrangler");
const index_1 = require("./index");
const noop = () => { };
const matchOptions = { contains: true };
const certGenerate = util_1.promisify(selfsigned_1.default.generate);
const certDefaultRoot = path_1.default.resolve(".mf", "cert");
const certAttrs = [
    { name: "commonName", value: "localhost" },
];
const certDays = 30;
const certOptions = {
    algorithm: "sha256",
    days: certDays,
    keySize: 2048,
    extensions: [
        { name: "basicConstraints", cA: true },
        {
            name: "keyUsage",
            keyCertSign: true,
            digitalSignature: true,
            nonRepudiation: true,
            keyEncipherment: true,
            dataEncipherment: true,
        },
        {
            name: "extKeyUsage",
            serverAuth: true,
            clientAuth: true,
            codeSigning: true,
            timeStamping: true,
        },
        {
            name: "subjectAltName",
            altNames: [
                { type: 2, value: "localhost" },
                ...index_1.getAccessibleHosts().map((ip) => ({ type: 7, ip })),
            ],
        },
    ],
};
class OptionsProcessor {
    constructor(log, initialOptions, defaultCertRoot = certDefaultRoot, clock = helpers_2.defaultClock) {
        var _a, _b;
        this.log = log;
        this.initialOptions = initialOptions;
        this.defaultCertRoot = defaultCertRoot;
        this.clock = clock;
        this._scriptBlueprints = {};
        this._buildMutex = new helpers_2.Mutex();
        if (initialOptions.script)
            initialOptions.scriptPath = index_1.stringScriptPath;
        this.wranglerConfigPath = path_1.default.resolve((_a = initialOptions.wranglerConfigPath) !== null && _a !== void 0 ? _a : "wrangler.toml");
        this.packagePath = path_1.default.resolve((_b = initialOptions.packagePath) !== null && _b !== void 0 ? _b : "package.json");
    }
    _globsToRegexps(globs) {
        const regexps = [];
        for (const glob of globs !== null && globs !== void 0 ? globs : []) {
            const regexp = picomatch_1.default.makeRe(glob, matchOptions);
            // Override toString so we log the glob not the regexp
            regexp.toString = () => glob;
            regexps.push(regexp);
        }
        return regexps;
    }
    async _readFile(filePath, logError = true) {
        try {
            return await fs_1.promises.readFile(filePath, "utf8");
        }
        catch (e) {
            if (logError) {
                this.log.error(`Unable to read ${path_1.default.relative("", filePath)}: ${e} (defaulting to empty string)`);
            }
            return "";
        }
    }
    async addScriptBlueprint(scriptPath) {
        if (scriptPath in this._scriptBlueprints)
            return;
        // Read file contents and create script object
        const code = scriptPath === index_1.stringScriptPath && this.initialOptions.script
            ? this.initialOptions.script
            : await this._readFile(scriptPath);
        this._scriptBlueprints[scriptPath] = new scripts_1.ScriptBlueprint(code, scriptPath);
    }
    runCustomBuild(command, basePath) {
        return this._buildMutex.run(() => new Promise((resolve) => {
            const build = child_process_1.default.spawn(command, {
                cwd: basePath,
                shell: true,
                stdio: "inherit",
            });
            build.on("exit", (code) => {
                const succeeded = code === 0;
                if (succeeded) {
                    this.log.info("Build succeeded");
                }
                else {
                    this.log.error(`Build failed with exit code ${code}`);
                }
                resolve(succeeded);
            });
        }));
    }
    async getWranglerOptions() {
        let wranglerOptions = {};
        const wranglerConfigPathSet = this.initialOptions.wranglerConfigPath !== undefined;
        const input = await this._readFile(this.wranglerConfigPath, wranglerConfigPathSet);
        const inputDir = path_1.default.dirname(this.wranglerConfigPath);
        try {
            wranglerOptions = wrangler_1.getWranglerOptions(input, inputDir, this.initialOptions.wranglerConfigEnv);
        }
        catch (e) {
            this.log.error(`Unable to parse ${path_1.default.relative("", this.wranglerConfigPath)}: ${e} (line: ${e.line}, col: ${e.column}) (ignoring)`);
        }
        return wranglerOptions;
    }
    async getPackageScript(modules) {
        const packagePathSet = this.initialOptions.packagePath !== undefined;
        const input = await this._readFile(this.packagePath, packagePathSet);
        if (input === "")
            return;
        try {
            const pkg = JSON.parse(input);
            const main = modules ? pkg.module : pkg.main;
            // Resolve script path relative to package.json
            if (main)
                return path_1.default.resolve(path_1.default.dirname(this.packagePath), main);
        }
        catch (e) {
            this.log.error(`Unable to parse ${path_1.default.relative("", this.packagePath)}: ${e} (ignoring)`);
        }
    }
    async getScriptPath(options) {
        // Always get the package script so we log an error if the user was
        // expecting it to be loaded
        const pkgScript = await this.getPackageScript(options.modules);
        // Make sure we've got a main script
        if (options.scriptPath === undefined) {
            if (pkgScript === undefined) {
                throw new helpers_1.MiniflareError(`No script defined, either include it explicitly, set build.upload.main in Wrangler configuration, or set ${options.modules ? "module" : "main"} in package.json`);
            }
            // Script is already resolved in getPackageScript
            return pkgScript;
        }
        else {
            // Resolve and load script relative to current directory
            return options.scriptPath !== index_1.stringScriptPath
                ? path_1.default.resolve(options.scriptPath)
                : options.scriptPath;
        }
    }
    getProcessedDurableObjects(options) {
        var _a;
        // Make sure all durable objects are defined as objects and have a
        // scriptPath set
        return Object.entries((_a = options.durableObjects) !== null && _a !== void 0 ? _a : {}).map(([name, details]) => {
            const className = typeof details === "object" ? details.className : details;
            const scriptPath = typeof details === "object" ? details.scriptPath : undefined;
            const resolvedScriptPath = scriptPath
                ? path_1.default.resolve(scriptPath)
                : options.scriptPath;
            return {
                name,
                className,
                scriptPath: resolvedScriptPath,
            };
        });
    }
    getProcessedModulesRules(options) {
        var _a;
        const processedModulesRules = [];
        const finalisedTypes = new Set();
        for (const rule of [
            ...((_a = options.modulesRules) !== null && _a !== void 0 ? _a : []),
            ...index_1.defaultModuleRules,
        ]) {
            if (finalisedTypes.has(rule.type)) {
                // Ignore rule if type didn't enable fallthrough
                continue;
            }
            processedModulesRules.push({
                type: rule.type,
                include: this._globsToRegexps(rule.include),
            });
            if (!rule.fallthrough)
                finalisedTypes.add(rule.type);
        }
        return processedModulesRules;
    }
    async getEnvBindings(options) {
        var _a;
        // Normalise the envPath (defaulting to .env) so we can compare it when
        // watching
        const envPathSet = options.envPath !== undefined;
        const envPath = path_1.default.resolve((_a = options.envPath) !== null && _a !== void 0 ? _a : ".env");
        // Get variable bindings from envPath (only log not found if option was set)
        const envBindings = dotenv_1.default.parse(await this._readFile(envPath, envPathSet));
        return { envPath, envBindings };
    }
    async getWasmBindings(options) {
        var _a;
        const wasmBindings = {};
        for (const [name, wasmPath] of Object.entries((_a = options.wasmBindings) !== null && _a !== void 0 ? _a : {})) {
            try {
                wasmBindings[name] = new WebAssembly.Module(await fs_1.promises.readFile(wasmPath));
            }
            catch (e) {
                this.log.error(`Unable to load WASM module "${name}": ${e} (ignoring)`);
            }
        }
        return wasmBindings;
    }
    getUpstreamUrl(options) {
        try {
            return options.upstream ? new url_1.URL(options.upstream) : undefined;
        }
        catch (e) {
            this.log.error(`Unable to parse upstream: ${e} (defaulting to no upstream)`);
        }
        return undefined;
    }
    getValidatedCrons(options) {
        var _a;
        const validatedCrons = [];
        for (const spec of (_a = options.crons) !== null && _a !== void 0 ? _a : []) {
            try {
                // We don't use cron.validate here since that doesn't tell us why
                // parsing failed
                const task = node_cron_1.default.schedule(spec, noop, { scheduled: false });
                task.destroy();
                // validateCrons is always defined here
                validatedCrons.push(spec);
            }
            catch (e) {
                this.log.error(`Unable to parse cron "${spec}": ${e} (ignoring)`);
            }
        }
        return validatedCrons;
    }
    async getHttpsOptions({ https, }) {
        var _a, _b, _c, _d;
        // If options are falsy, don't use HTTPS
        if (!https)
            return;
        // If options are true, use a self-signed certificate at default location
        if (https === true)
            https = this.defaultCertRoot;
        // If options are now a string, use a self-signed certificate
        if (typeof https === "string") {
            const keyPath = path_1.default.join(https, "key.pem");
            const certPath = path_1.default.join(https, "cert.pem");
            // Determine whether to regenerate self-signed certificate, should do this
            // if doesn't exist or about to expire
            let regenerate = true;
            try {
                const keyStat = await fs_1.promises.stat(keyPath);
                const certStat = await fs_1.promises.stat(certPath);
                const created = Math.max(keyStat.ctimeMs, certStat.ctimeMs);
                regenerate = this.clock() - created > (certDays - 2) * 86400000;
            }
            catch (_e) { }
            // Generate self signed certificate if needed
            if (regenerate) {
                this.log.info("Generating new self-signed certificate...");
                const cert = await certGenerate(certAttrs, certOptions);
                // Write cert so we can reuse it later
                await fs_1.promises.mkdir(https, { recursive: true });
                await fs_1.promises.writeFile(keyPath, cert.private, "utf8");
                await fs_1.promises.writeFile(certPath, cert.cert, "utf8");
            }
            https = { keyPath, certPath };
        }
        // Alias so each option fits onto one line
        const h = https;
        return {
            key: (_a = h.key) !== null && _a !== void 0 ? _a : (h.keyPath && (await this._readFile(h.keyPath))),
            cert: (_b = h.cert) !== null && _b !== void 0 ? _b : (h.certPath && (await this._readFile(h.certPath))),
            ca: (_c = h.ca) !== null && _c !== void 0 ? _c : (h.caPath && (await this._readFile(h.caPath))),
            pfx: (_d = h.pfx) !== null && _d !== void 0 ? _d : (h.pfxPath && (await this._readFile(h.pfxPath))),
            passphrase: h.passphrase,
        };
    }
    async getProcessedOptions(initial) {
        var _a;
        // Get wrangler options first (if set) since initialOptions override these
        const wranglerOptions = await this.getWranglerOptions();
        // Override wrangler options with initialOptions, since these should have
        // higher priority
        const options = {
            ...wranglerOptions,
            ...this.initialOptions,
        };
        // Run custom build command if this is the first time we're getting options
        // to make sure the scripts exist
        if (initial && options.buildCommand) {
            await this.runCustomBuild(options.buildCommand, options.buildBasePath);
        }
        // Resolve and load all scripts (including Durable Objects')
        this._scriptBlueprints = {};
        options.scripts = this._scriptBlueprints;
        // Force modules mode if we're using Durable Objects: we need to be able to
        // access named script exports (do this before getting main script so
        // we know whether to fallback to main or module in package.json)
        if (Object.keys((_a = options.durableObjects) !== null && _a !== void 0 ? _a : {}).length > 0) {
            options.modules = true;
        }
        options.scriptPath = await this.getScriptPath(options);
        await this.addScriptBlueprint(options.scriptPath);
        options.processedDurableObjects = this.getProcessedDurableObjects(options);
        for (const durableObject of options.processedDurableObjects) {
            await this.addScriptBlueprint(durableObject.scriptPath);
        }
        options.processedModulesRules = this.getProcessedModulesRules(options);
        const { envPath, envBindings } = await this.getEnvBindings(options);
        options.envPath = envPath;
        const wasmBindings = await this.getWasmBindings(options);
        // Rebuild bindings object taking into account priorities: envBindings and
        // wasmBindings should override wrangler, and initialOptions should override
        // everything
        options.bindings = {
            ...wranglerOptions.bindings,
            ...envBindings,
            ...wasmBindings,
            ...this.initialOptions.bindings,
        };
        options.upstreamUrl = this.getUpstreamUrl(options);
        options.validatedCrons = this.getValidatedCrons(options);
        options.siteIncludeRegexps = this._globsToRegexps(options.siteInclude);
        options.siteExcludeRegexps = this._globsToRegexps(options.siteExclude);
        options.processedHttps = await this.getHttpsOptions(options);
        return options;
    }
}
exports.OptionsProcessor = OptionsProcessor;
//# sourceMappingURL=processor.js.map