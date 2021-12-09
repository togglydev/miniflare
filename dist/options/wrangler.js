"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWranglerOptions = void 0;
const assert_1 = __importDefault(require("assert"));
const path_1 = __importDefault(require("path"));
const toml_1 = __importDefault(require("@iarna/toml"));
function getWranglerOptions(input, inputDir, env) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11;
    // Parse wrangler config and select correct environment
    const config = toml_1.default.parse(input);
    if (env && config.env && env in config.env) {
        Object.assign(config, config.env[env]);
    }
    // Auto-fill build configuration for "webpack" and "rust" worker types using
    // "wrangler build" if not already defined
    if (!config.build && (config.type === "webpack" || config.type === "rust")) {
        // Explicitly set dir to empty string, this will exclude it when resolving.
        // config.build.upload.main's below will be resolved relative to inputDir
        config.build = { cwd: inputDir, upload: { dir: "" } };
        assert_1.default(config.build.upload); // TypeScript gets annoyed if this isn't here
        if (config.type === "webpack") {
            config.build.command = "wrangler build";
            config.build.upload.main = path_1.default.join("worker", "script.js");
        }
        else if (config.type === "rust") {
            // In tests, __dirname will refer to src folder containing .ts files
            // so make sure we're referring to the dist folder containing .js files
            // NOTE: this requires building the code before running tests
            const distDir = __filename.endsWith(".ts")
                ? path_1.default.resolve(__dirname, "..", "..", "dist", "options")
                : __dirname;
            const rustScript = path_1.default.join(distDir, "rust.js");
            config.build.command = `wrangler build && ${process.execPath} ${rustScript}`;
            config.build.upload.main = path_1.default.join("worker", "generated", "script.js");
            // Add wasm binding, script.wasm will be created by rustScript
            if (!config.miniflare)
                config.miniflare = {};
            if (!config.miniflare.wasm_bindings)
                config.miniflare.wasm_bindings = [];
            config.miniflare.wasm_bindings.push({
                name: "wasm",
                // WASM bindings aren't implicitly resolved relative to inputDir
                path: path_1.default.join(inputDir, "worker", "generated", "script.wasm"),
            });
        }
    }
    // Map wrangler keys to miniflare's
    return {
        // Resolve script relative to configuration's path
        scriptPath: ((_b = (_a = config.build) === null || _a === void 0 ? void 0 : _a.upload) === null || _b === void 0 ? void 0 : _b.main)
            ? path_1.default.resolve(inputDir, (_e = (_d = (_c = config.build) === null || _c === void 0 ? void 0 : _c.upload) === null || _d === void 0 ? void 0 : _d.dir) !== null && _e !== void 0 ? _e : "dist", config.build.upload.main)
            : undefined,
        modules: ((_g = (_f = config.build) === null || _f === void 0 ? void 0 : _f.upload) === null || _g === void 0 ? void 0 : _g.format) && config.build.upload.format === "modules",
        modulesRules: (_k = (_j = (_h = config.build) === null || _h === void 0 ? void 0 : _h.upload) === null || _j === void 0 ? void 0 : _j.rules) === null || _k === void 0 ? void 0 : _k.map(({ type, globs, fallthrough }) => ({
            type,
            include: globs,
            fallthrough,
        })),
        bindings: config.vars,
        kvNamespaces: (_l = config.kv_namespaces) === null || _l === void 0 ? void 0 : _l.map(({ binding }) => binding),
        sitePath: ((_m = config.site) === null || _m === void 0 ? void 0 : _m.bucket)
            ? path_1.default.resolve(inputDir, (_o = config.site) === null || _o === void 0 ? void 0 : _o.bucket)
            : undefined,
        siteInclude: (_p = config.site) === null || _p === void 0 ? void 0 : _p.include,
        siteExclude: (_q = config.site) === null || _q === void 0 ? void 0 : _q.exclude,
        durableObjects: (_s = (_r = config.durable_objects) === null || _r === void 0 ? void 0 : _r.bindings) === null || _s === void 0 ? void 0 : _s.reduce((objects, { name, class_name, script_name }) => {
            objects[name] = { className: class_name, scriptPath: script_name };
            return objects;
        }, {}),
        crons: (_t = config.triggers) === null || _t === void 0 ? void 0 : _t.crons,
        buildCommand: (_u = config.build) === null || _u === void 0 ? void 0 : _u.command,
        buildBasePath: (_v = config.build) === null || _v === void 0 ? void 0 : _v.cwd,
        buildWatchPath: (_x = (_w = config.build) === null || _w === void 0 ? void 0 : _w.watch_dir) !== null && _x !== void 0 ? _x : (((_y = config.build) === null || _y === void 0 ? void 0 : _y.command) && "src"),
        upstream: (_z = config.miniflare) === null || _z === void 0 ? void 0 : _z.upstream,
        kvPersist: (_0 = config.miniflare) === null || _0 === void 0 ? void 0 : _0.kv_persist,
        cachePersist: (_1 = config.miniflare) === null || _1 === void 0 ? void 0 : _1.cache_persist,
        disableCache: (_2 = config.miniflare) === null || _2 === void 0 ? void 0 : _2.disable_cache,
        durableObjectsPersist: (_3 = config.miniflare) === null || _3 === void 0 ? void 0 : _3.durable_objects_persist,
        envPath: (_4 = config.miniflare) === null || _4 === void 0 ? void 0 : _4.env_path,
        host: (_5 = config.miniflare) === null || _5 === void 0 ? void 0 : _5.host,
        port: (_6 = config.miniflare) === null || _6 === void 0 ? void 0 : _6.port,
        https: typeof ((_7 = config.miniflare) === null || _7 === void 0 ? void 0 : _7.https) === "object"
            ? {
                keyPath: config.miniflare.https.key,
                certPath: config.miniflare.https.cert,
                caPath: config.miniflare.https.ca,
                pfxPath: config.miniflare.https.pfx,
                passphrase: config.miniflare.https.passphrase,
            }
            : (_8 = config.miniflare) === null || _8 === void 0 ? void 0 : _8.https,
        wasmBindings: (_10 = (_9 = config.miniflare) === null || _9 === void 0 ? void 0 : _9.wasm_bindings) === null || _10 === void 0 ? void 0 : _10.reduce((bindings, { name, path }) => {
            bindings[name] = path;
            return bindings;
        }, {}),
        disableUpdater: (_11 = config.miniflare) === null || _11 === void 0 ? void 0 : _11.disable_updater,
    };
}
exports.getWranglerOptions = getWranglerOptions;
//# sourceMappingURL=wrangler.js.map