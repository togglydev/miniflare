"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCheck = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const node_fetch_1 = __importDefault(require("@mrbbot/node-fetch"));
const env_paths_1 = __importDefault(require("env-paths"));
const semiver_1 = __importDefault(require("semiver"));
const yargs_1 = __importDefault(require("yargs"));
const index_1 = require("./index");
const defaultPort = 8787;
const numericCompare = new Intl.Collator(undefined, { numeric: true }).compare;
function stripUndefinedOptions(options) {
    return Object.entries(options)
        .filter(([, value]) => value !== undefined)
        .reduce((options, [key, value]) => {
        options[key] = value;
        return options;
    }, {});
}
function asStringArray(arr) {
    return arr === null || arr === void 0 ? void 0 : arr.map((value) => value.toString());
}
function parseObject(arr) {
    return arr === null || arr === void 0 ? void 0 : arr.reduce((obj, entry) => {
        const equalsIndex = entry.indexOf("=");
        obj[entry.substring(0, equalsIndex)] = entry.substring(equalsIndex + 1);
        return obj;
    }, {});
}
function parseModuleRules(arr) {
    const obj = parseObject(arr);
    if (!obj)
        return undefined;
    return Object.entries(obj).map(([type, glob]) => ({
        type: type,
        include: [glob],
        fallthrough: true,
    }));
}
function parseArgv(raw) {
    var _a;
    const argv = yargs_1.default
        .strict()
        .alias({ version: "v", help: "h" })
        .usage("Usage: miniflare [script] [options]")
        .demandCommand(0, 1) // <script>
        .options({
        host: {
            type: "string",
            description: "HTTP server host to listen on (all by default)",
            alias: "H",
        },
        port: {
            type: "number",
            description: `HTTP server port (${defaultPort} by default)`,
            alias: "p",
        },
        debug: {
            type: "boolean",
            description: "Log debug messages",
            alias: "d",
        },
        "wrangler-config": {
            type: "string",
            description: "Path to wrangler.toml",
            alias: "c",
        },
        "wrangler-env": {
            type: "string",
            description: "Environment in wrangler.toml to use",
        },
        package: {
            type: "string",
            description: "Path to package.json",
        },
        modules: {
            type: "boolean",
            description: "Enable modules",
            alias: "m",
        },
        "modules-rule": {
            type: "array",
            description: "Modules import rule (TYPE=GLOB)",
        },
        "build-command": {
            type: "string",
            description: "Command to build project",
        },
        "build-base-path": {
            type: "string",
            description: "Working directory for build command",
        },
        "build-watch-path": {
            type: "string",
            description: "Directory to watch for rebuilding on changes",
        },
        watch: {
            type: "boolean",
            description: "Watch files for changes",
            alias: "w",
        },
        upstream: {
            type: "string",
            description: "URL of upstream origin",
            alias: "u",
        },
        cron: {
            type: "array",
            description: "Cron pattern to trigger scheduled events with",
            alias: "t",
        },
        kv: {
            type: "array",
            description: "KV namespace to bind",
            alias: "k",
        },
        "kv-persist": {
            // type: "boolean" | "string",
            description: "Path to persist KV data to (omit path for default)",
        },
        "cache-persist": {
            // type: "boolean" | "string",
            description: "Path to persist cached data to (omit path for default)",
        },
        "disable-cache": {
            type: "boolean",
            description: "Disable caching with default/named caches",
        },
        site: {
            type: "string",
            description: "Path to serve Workers Site files from",
            alias: "s",
        },
        "site-include": {
            type: "array",
            description: "Glob pattern of site files to serve",
        },
        "site-exclude": {
            type: "array",
            description: "Glob pattern of site files not to serve",
        },
        do: {
            type: "array",
            description: "Durable Object to bind (NAME=CLASS)",
            alias: "o",
        },
        "do-persist": {
            // type: "boolean" | "string",
            description: "Path to persist Durable Object data to (omit path for default)",
        },
        env: {
            type: "string",
            description: "Path to .env file",
            alias: "e",
        },
        binding: {
            type: "array",
            description: "Bind variable/secret (KEY=VALUE)",
            alias: "b",
        },
        wasm: {
            type: "array",
            description: "WASM module to bind (NAME=PATH)",
        },
        ["https"]: {
            // type: "boolean" | "string",
            description: "Enable self-signed HTTPS",
        },
        ["https-key"]: {
            type: "string",
            description: "Path to PEM SSL key",
        },
        ["https-cert"]: {
            type: "string",
            description: "Path to PEM SSL cert chain",
        },
        ["https-ca"]: {
            type: "string",
            description: "Path to SSL trusted CA certs",
        },
        ["https-pfx"]: {
            type: "string",
            description: "Path to PFX/PKCS12 SSL key/cert chain",
        },
        ["https-passphrase"]: {
            type: "string",
            description: "Passphrase to decrypt SSL files",
        },
        ["disable-updater"]: {
            type: "boolean",
            description: "Disable update checker",
        },
    })
        .parse(raw);
    return stripUndefinedOptions({
        scriptPath: argv._[0],
        sourceMap: true,
        log: new index_1.ConsoleLog(argv.debug),
        wranglerConfigPath: argv["wrangler-config"],
        wranglerConfigEnv: argv["wrangler-env"],
        packagePath: argv.package,
        modules: argv.modules,
        modulesRules: parseModuleRules(asStringArray(argv["modules-rule"])),
        buildCommand: argv["build-command"],
        buildBasePath: argv["build-base-path"],
        buildWatchPath: argv["build-watch-path"],
        watch: 
        // Assume --watch if --build-watch-path set
        (_a = argv.watch) !== null && _a !== void 0 ? _a : (argv["build-watch-path"] !== undefined ? true : undefined),
        host: argv.host,
        port: argv.port,
        upstream: argv.upstream,
        crons: asStringArray(argv.cron),
        kvNamespaces: asStringArray(argv.kv),
        kvPersist: argv["kv-persist"],
        cachePersist: argv["cache-persist"],
        disableCache: argv["disable-cache"],
        sitePath: argv.site,
        siteInclude: asStringArray(argv["site-include"]),
        siteExclude: asStringArray(argv["site-exclude"]),
        durableObjects: parseObject(asStringArray(argv["do"])),
        durableObjectsPersist: argv["do-persist"],
        envPath: argv.env,
        bindings: parseObject(asStringArray(argv.binding)),
        wasmBindings: parseObject(asStringArray(argv.wasm)),
        https: argv["https-key"] ||
            argv["https-cert"] ||
            argv["https-ca"] ||
            argv["https-pfx"] ||
            argv["https-passphrase"]
            ? {
                keyPath: argv["https-key"],
                certPath: argv["https-cert"],
                caPath: argv["https-ca"],
                pfxPath: argv["https-pfx"],
                passphrase: argv["https-passphrase"],
            }
            : argv["https"],
        disableUpdater: argv["disable-updater"],
    });
}
exports.default = parseArgv;
async function updateCheck({ pkg, cachePath, log, now = Date.now(), registry = "https://registry.npmjs.org/", }) {
    // If checked within the past day, don't check again
    await fs_1.promises.mkdir(cachePath, { recursive: true });
    const lastCheckFile = path_1.default.join(cachePath, "update-check");
    let lastCheck = 0;
    try {
        lastCheck = parseInt(await fs_1.promises.readFile(lastCheckFile, "utf8"));
    }
    catch (_a) { }
    if (now - lastCheck < 86400000)
        return;
    // Get latest version's package.json from npm
    const res = await node_fetch_1.default(`${registry}${pkg.name}/latest`, {
        headers: { Accept: "application/json" },
    });
    const registryVersion = (await res.json()).version;
    if (!registryVersion)
        return;
    // Record new last check time
    await fs_1.promises.writeFile(lastCheckFile, now.toString(), "utf8");
    // Log version if latest version is greater than the currently installed
    if (semiver_1.default(registryVersion, pkg.version) > 0) {
        log.warn(`Miniflare ${registryVersion} is available, ` +
            `but you're using ${pkg.version}. ` +
            "Update for improved compatibility with Cloudflare Workers.");
        const registryMajor = registryVersion.split(".")[0];
        const pkgMajor = pkg.version.split(".")[0];
        if (numericCompare(registryMajor, pkgMajor) > 0) {
            log.warn(`${registryVersion} includes breaking changes.` +
                "Make sure you check the changelog before upgrading.");
        }
    }
}
exports.updateCheck = updateCheck;
if (module === require.main) {
    // Suppress experimental modules warning
    const originalEmitWarning = process.emitWarning;
    process.emitWarning = (warning, name, ctor) => {
        if (name === "ExperimentalWarning" &&
            warning.toString().startsWith("VM Modules")) {
            return;
        }
        return originalEmitWarning(warning, name, ctor);
    };
    const options = parseArgv(process.argv.slice(2));
    const mf = new index_1.Miniflare(options);
    mf.getOptions()
        .then(async ({ host, port = defaultPort, processedHttps, disableUpdater }) => {
        const secure = processedHttps !== undefined;
        (await mf.createServer(secure)).listen(port, host, async () => {
            const protocol = secure ? "https" : "http";
            mf.log.info(`Listening on ${host !== null && host !== void 0 ? host : ""}:${port}`);
            if (host) {
                mf.log.info(`- ${protocol}://${host}:${port}`);
            }
            else {
                for (const accessibleHost of index_1.getAccessibleHosts(true)) {
                    mf.log.info(`- ${protocol}://${accessibleHost}:${port}`);
                }
            }
            // Check for updates, ignoring errors (it's not that important)
            if (disableUpdater)
                return;
            try {
                // Get currently installed package metadata
                const pkgFile = path_1.default.join(__dirname, "..", "package.json");
                const pkg = JSON.parse(await fs_1.promises.readFile(pkgFile, "utf8"));
                const cachePath = env_paths_1.default(pkg.name).cache;
                await updateCheck({ pkg, cachePath, log: mf.log });
            }
            catch (e) { }
        });
    })
        .catch((err) => mf.log.error(err));
}
//# sourceMappingURL=cli.js.map