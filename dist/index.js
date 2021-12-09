"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _Miniflare_instances, _Miniflare_modules, _Miniflare_watcher, _Miniflare_options, _Miniflare_globalScope, _Miniflare_scheduledTasks, _Miniflare_extraSourceMaps, _Miniflare_wss, _Miniflare_retrieveSourceMap, _Miniflare_watchCallback, _Miniflare_reloadScheduled, _Miniflare_reloadWorker, _Miniflare_httpRequestListener, _Miniflare_webSocketConnectionListener;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiniflareError = exports.getAccessibleHosts = exports.ConsoleLog = exports.NoOpLog = exports.Miniflare = void 0;
const assert_1 = __importDefault(require("assert"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const path_1 = __importDefault(require("path"));
const node_fetch_1 = require("@mrbbot/node-fetch");
const node_cron_1 = __importDefault(require("node-cron"));
const source_map_support_1 = __importDefault(require("source-map-support"));
const ws_1 = __importDefault(require("ws"));
const youch_1 = __importDefault(require("youch"));
const helpers_1 = require("./helpers");
Object.defineProperty(exports, "MiniflareError", { enumerable: true, get: function () { return helpers_1.MiniflareError; } });
const log_1 = require("./log");
const events_1 = require("./modules/events");
const events_2 = require("./modules/events");
const modules = __importStar(require("./modules/modules"));
const ws_2 = require("./modules/ws");
const watcher_1 = require("./options/watcher");
const scripts_1 = require("./scripts");
class Miniflare {
    constructor(options = {}) {
        _Miniflare_instances.add(this);
        _Miniflare_modules.set(this, void 0);
        _Miniflare_watcher.set(this, void 0);
        _Miniflare_options.set(this, void 0);
        _Miniflare_globalScope.set(this, void 0);
        _Miniflare_scheduledTasks.set(this, void 0);
        _Miniflare_extraSourceMaps.set(this, void 0);
        _Miniflare_wss.set(this, void 0);
        if (options.sourceMap) {
            source_map_support_1.default.install({
                emptyCacheBetweenOperations: true,
                retrieveSourceMap: __classPrivateFieldGet(this, _Miniflare_instances, "m", _Miniflare_retrieveSourceMap).bind(this),
            });
        }
        this.log = !options.log
            ? new log_1.NoOpLog()
            : options.log === true
                ? new log_1.ConsoleLog()
                : options.log;
        __classPrivateFieldSet(this, _Miniflare_modules, Object.entries(modules).reduce((modules, [name, module]) => {
            modules[name] = new module(this.log);
            return modules;
        }, {}), "f");
        // Initialise web socket server
        __classPrivateFieldSet(this, _Miniflare_wss, new ws_1.default.Server({ noServer: true }), "f");
        __classPrivateFieldGet(this, _Miniflare_wss, "f").addListener("connection", __classPrivateFieldGet(this, _Miniflare_instances, "m", _Miniflare_webSocketConnectionListener).bind(this));
        __classPrivateFieldSet(this, _Miniflare_watcher, new watcher_1.OptionsWatcher(this.log, __classPrivateFieldGet(this, _Miniflare_instances, "m", _Miniflare_watchCallback).bind(this), options), "f");
    }
    /** @deprecated Since 1.2.0, this is just an alias for reloadOptions() */
    async reloadScript() {
        await this.reloadOptions();
    }
    async reloadOptions(log = true) {
        await __classPrivateFieldGet(this, _Miniflare_watcher, "f").initPromise;
        await __classPrivateFieldGet(this, _Miniflare_watcher, "f").reloadOptions(log);
    }
    async dispatchFetch(input, init) {
        var _a;
        await __classPrivateFieldGet(this, _Miniflare_watcher, "f").initPromise;
        const globalScope = __classPrivateFieldGet(this, _Miniflare_globalScope, "f");
        assert_1.default(globalScope);
        return globalScope[events_1.dispatchFetchSymbol](new node_fetch_1.Request(input, init), (_a = __classPrivateFieldGet(this, _Miniflare_options, "f")) === null || _a === void 0 ? void 0 : _a.upstreamUrl);
    }
    async dispatchScheduled(scheduledTime, cron) {
        await __classPrivateFieldGet(this, _Miniflare_watcher, "f").initPromise;
        const globalScope = __classPrivateFieldGet(this, _Miniflare_globalScope, "f");
        assert_1.default(globalScope);
        return globalScope[events_1.dispatchScheduledSymbol](scheduledTime, cron);
    }
    async getOptions() {
        await __classPrivateFieldGet(this, _Miniflare_watcher, "f").initPromise;
        // This should never be undefined as initPromise is only resolved once
        // #watchCallback has been called for the first time
        assert_1.default(__classPrivateFieldGet(this, _Miniflare_options, "f") !== undefined);
        return __classPrivateFieldGet(this, _Miniflare_options, "f");
    }
    async getCache(name) {
        var _a;
        await __classPrivateFieldGet(this, _Miniflare_watcher, "f").initPromise;
        return __classPrivateFieldGet(this, _Miniflare_modules, "f").CacheModule.getCache(name, (_a = __classPrivateFieldGet(this, _Miniflare_options, "f")) === null || _a === void 0 ? void 0 : _a.cachePersist);
    }
    async getKVNamespace(namespace) {
        var _a;
        await __classPrivateFieldGet(this, _Miniflare_watcher, "f").initPromise;
        return __classPrivateFieldGet(this, _Miniflare_modules, "f").KVModule.getNamespace(namespace, (_a = __classPrivateFieldGet(this, _Miniflare_options, "f")) === null || _a === void 0 ? void 0 : _a.kvPersist);
    }
    async getDurableObjectNamespace(objectName) {
        var _a;
        await __classPrivateFieldGet(this, _Miniflare_watcher, "f").initPromise;
        return __classPrivateFieldGet(this, _Miniflare_modules, "f").DurableObjectsModule.getNamespace(objectName, (_a = __classPrivateFieldGet(this, _Miniflare_options, "f")) === null || _a === void 0 ? void 0 : _a.durableObjectsPersist);
    }
    async dispose() {
        await __classPrivateFieldGet(this, _Miniflare_watcher, "f").dispose();
        for (const module of Object.values(__classPrivateFieldGet(this, _Miniflare_modules, "f"))) {
            await module.dispose();
        }
    }
    createServer(secure) {
        const listener = __classPrivateFieldGet(this, _Miniflare_instances, "m", _Miniflare_httpRequestListener).bind(this);
        const wsUpgrade = (req, socket, head) => {
            // Handle web socket upgrades
            __classPrivateFieldGet(this, _Miniflare_wss, "f").handleUpgrade(req, socket, head, (ws) => {
                __classPrivateFieldGet(this, _Miniflare_wss, "f").emit("connection", ws, req);
            });
        };
        if (secure) {
            return this.getOptions().then(({ processedHttps }) => {
                const server = https_1.default.createServer(processedHttps !== null && processedHttps !== void 0 ? processedHttps : {}, listener);
                server.on("upgrade", wsUpgrade);
                return server;
            });
        }
        else {
            // TODO: (breaking) for v2, make this function always return a promise
            const server = http_1.default.createServer(listener);
            server.on("upgrade", wsUpgrade);
            return server;
        }
    }
}
exports.Miniflare = Miniflare;
_Miniflare_modules = new WeakMap(), _Miniflare_watcher = new WeakMap(), _Miniflare_options = new WeakMap(), _Miniflare_globalScope = new WeakMap(), _Miniflare_scheduledTasks = new WeakMap(), _Miniflare_extraSourceMaps = new WeakMap(), _Miniflare_wss = new WeakMap(), _Miniflare_instances = new WeakSet(), _Miniflare_retrieveSourceMap = function _Miniflare_retrieveSourceMap(url) {
    var _a;
    const map = (_a = __classPrivateFieldGet(this, _Miniflare_extraSourceMaps, "f")) === null || _a === void 0 ? void 0 : _a.get(url);
    return map ? { url, map } : null;
}, _Miniflare_watchCallback = async function _Miniflare_watchCallback(options) {
    __classPrivateFieldSet(this, _Miniflare_options, options, "f");
    // Build sandbox and environment
    const modules = Object.values(__classPrivateFieldGet(this, _Miniflare_modules, "f"));
    const sandbox = modules.reduce((sandbox, module) => Object.assign(sandbox, module.buildSandbox(options)), {});
    const environment = modules.reduce((environment, module) => Object.assign(environment, module.buildEnvironment(options)), {});
    // Assign bindings last so they can override modules if required
    Object.assign(environment, options.bindings);
    __classPrivateFieldGet(this, _Miniflare_instances, "m", _Miniflare_reloadScheduled).call(this);
    await __classPrivateFieldGet(this, _Miniflare_instances, "m", _Miniflare_reloadWorker).call(this, sandbox, environment);
}, _Miniflare_reloadScheduled = function _Miniflare_reloadScheduled() {
    var _a, _b, _c;
    // Schedule tasks, stopping all current ones first
    (_a = __classPrivateFieldGet(this, _Miniflare_scheduledTasks, "f")) === null || _a === void 0 ? void 0 : _a.forEach((task) => task.destroy());
    __classPrivateFieldSet(this, _Miniflare_scheduledTasks, (_c = (_b = __classPrivateFieldGet(this, _Miniflare_options, "f")) === null || _b === void 0 ? void 0 : _b.validatedCrons) === null || _c === void 0 ? void 0 : _c.map((spec) => node_cron_1.default.schedule(spec, async () => {
        const start = process.hrtime();
        const waitUntil = this.dispatchScheduled(undefined, spec);
        await log_1.logResponse(this.log, {
            start,
            method: "SCHD",
            url: spec,
            waitUntil,
        });
    })), "f");
}, _Miniflare_reloadWorker = async function _Miniflare_reloadWorker(sandbox, environment) {
    var _a, _b, _c, _d, _e, _f, _g;
    // Only called in #watchCallback() after #options set and scripts and
    // processedModulesRules are always set in this
    assert_1.default(((_a = __classPrivateFieldGet(this, _Miniflare_options, "f")) === null || _a === void 0 ? void 0 : _a.scripts) && __classPrivateFieldGet(this, _Miniflare_options, "f").processedModulesRules);
    // Keep track of the size in bytes of all scripts
    let size = 0;
    // Build modules linker maintaining set of referenced paths for watching
    const linker = new scripts_1.ScriptLinker(__classPrivateFieldGet(this, _Miniflare_options, "f").processedModulesRules);
    __classPrivateFieldSet(this, _Miniflare_extraSourceMaps, linker.extraSourceMaps, "f");
    // Build new global scope (sandbox), this inherits from EventTarget
    const globalScope = new events_2.ServiceWorkerGlobalScope(this.log, sandbox, environment, __classPrivateFieldGet(this, _Miniflare_options, "f").modules);
    __classPrivateFieldSet(this, _Miniflare_globalScope, globalScope, "f");
    const context = scripts_1.createScriptContext(globalScope);
    // Reset state
    __classPrivateFieldGet(this, _Miniflare_modules, "f").DurableObjectsModule.resetInstances();
    __classPrivateFieldGet(this, _Miniflare_modules, "f").StandardsModule.resetWebSockets();
    // Parse and run all scripts
    const moduleExports = {};
    for (const script of Object.values(__classPrivateFieldGet(this, _Miniflare_options, "f").scripts)) {
        this.log.debug(`Reloading ${path_1.default.relative("", script.fileName)}...`);
        // Parse script and build instance
        size += Buffer.byteLength(script.code, "utf8");
        let instance;
        try {
            instance = __classPrivateFieldGet(this, _Miniflare_options, "f").modules
                ? await script.buildModule(context, linker.linker)
                : await script.buildScript(context);
        }
        catch (e) {
            // If this is because --experimental-vm-modules disabled, rethrow
            if (e instanceof helpers_1.MiniflareError)
                throw e;
            this.log.error(`Unable to parse ${path_1.default.relative("", script.fileName)}: ${e} (ignoring)`);
            continue;
        }
        // Run script
        try {
            await instance.run();
        }
        catch (e) {
            this.log.error(e.stack);
            continue;
        }
        // If this isn't a module instance, move on to the next script
        if (!(instance instanceof scripts_1.ModuleScriptInstance))
            continue;
        // Store the namespace so we can extract its Durable Object constructors
        moduleExports[script.fileName] = instance.exports;
        // If this is the main modules script, setup event listeners for
        // default exports
        if (script.fileName === __classPrivateFieldGet(this, _Miniflare_options, "f").scriptPath) {
            const fetchListener = (_c = (_b = instance.exports) === null || _b === void 0 ? void 0 : _b.default) === null || _c === void 0 ? void 0 : _c.fetch;
            if (fetchListener) {
                globalScope[events_1.addModuleFetchListenerSymbol](fetchListener);
            }
            const scheduledListener = (_e = (_d = instance.exports) === null || _d === void 0 ? void 0 : _d.default) === null || _e === void 0 ? void 0 : _e.scheduled;
            if (scheduledListener) {
                globalScope[events_1.addModuleScheduledListenerSymbol](scheduledListener);
            }
        }
    }
    // Reset durable objects with new constructors and environment
    const constructors = {};
    for (const durableObject of (_f = __classPrivateFieldGet(this, _Miniflare_options, "f").processedDurableObjects) !== null && _f !== void 0 ? _f : []) {
        const constructor = (_g = moduleExports[durableObject.scriptPath]) === null || _g === void 0 ? void 0 : _g[durableObject.className];
        if (constructor) {
            constructors[durableObject.name] = constructor;
        }
        else {
            this.log.error(`Unable to find class ${durableObject.className} for Durable Object ${durableObject.name}`);
        }
    }
    __classPrivateFieldGet(this, _Miniflare_modules, "f").DurableObjectsModule.setContext(constructors, environment);
    // Watch module referenced paths
    assert_1.default(__classPrivateFieldGet(this, _Miniflare_watcher, "f") !== undefined);
    __classPrivateFieldGet(this, _Miniflare_watcher, "f").setExtraWatchedPaths(linker.referencedPaths);
    // Close all existing web sockets
    for (const ws of __classPrivateFieldGet(this, _Miniflare_wss, "f").clients) {
        ws.close(1012, "Service Restart");
    }
    // Log total size of worker with warning if required
    size += linker.referencedPathsTotalSize;
    this.log.info(`Worker reloaded! (${helpers_1.formatSize(size)})`);
    if (size > 1048576)
        this.log.warn("Worker's uncompressed size exceeds 1MiB!" +
            "Note that your worker will be compressed during upload " +
            "so you may still be able to deploy it.");
}, _Miniflare_httpRequestListener = async function _Miniflare_httpRequestListener(req, res) {
    var _a, _b, _c, _d, _e;
    const start = process.hrtime();
    const url = ((_c = (_b = (_a = __classPrivateFieldGet(this, _Miniflare_options, "f")) === null || _a === void 0 ? void 0 : _a.upstreamUrl) === null || _b === void 0 ? void 0 : _b.origin) !== null && _c !== void 0 ? _c : `http://${req.headers.host}`) +
        req.url;
    const parsedUrl = new URL(url);
    let body = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
        // If the Transfer-Encoding is not chunked, buffer the request. If we
        // didn't do this and tried to make a fetch with this body in the worker,
        // it would be sent with chunked Transfer-Encoding, since req is a stream.
        if ((_d = req.headers["transfer-encoding"]) === null || _d === void 0 ? void 0 : _d.includes("chunked")) {
            body = req;
        }
        else if (req.headers["content-length"] !== "0") {
            body = await new node_fetch_1.Request(url, {
                method: req.method,
                headers: req.headers,
                body: req,
            }).buffer();
        }
    }
    // Add additional Cloudflare specific headers:
    // https://support.cloudflare.com/hc/en-us/articles/200170986-How-does-Cloudflare-handle-HTTP-Request-headers-
    let ip = req.socket.remoteAddress;
    // Remove IPv6 prefix for IPv4 addresses
    if (ip === null || ip === void 0 ? void 0 : ip.startsWith("::ffff:"))
        ip = ip === null || ip === void 0 ? void 0 : ip.substring("::ffff:".length);
    req.headers["cf-connecting-ip"] = ip;
    req.headers["cf-ipcountry"] = "US";
    req.headers["cf-ray"] = "";
    req.headers["cf-request-id"] = "";
    req.headers["cf-visitor"] = '{"scheme":"http"}';
    // Create Request with additional Cloudflare specific properties:
    // https://developers.cloudflare.com/workers/runtime-apis/request#incomingrequestcfproperties
    const request = new node_fetch_1.Request(url, {
        method: req.method,
        headers: req.headers,
        body: body,
        cf: {
            asn: 395747,
            colo: "DFW",
            city: "Austin",
            region: "Texas",
            regionCode: "TX",
            metroCode: "635",
            postalCode: "78701",
            country: "US",
            continent: "NA",
            timezone: "America/Chicago",
            latitude: "30.27130",
            longitude: "-97.74260",
            clientTcpRtt: 0,
            httpProtocol: `HTTP/${req.httpVersion}`,
            requestPriority: "weight=192;exclusive=0",
            tlsCipher: "AEAD-AES128-GCM-SHA256",
            tlsVersion: "TLSv1.3",
        },
    });
    // Check path matches "/.mf/scheduled" ignoring trailing slash
    const scheduled = parsedUrl.pathname.replace(/\/$/, "") === "/.mf/scheduled";
    let response;
    let waitUntil;
    if (scheduled) {
        req.method = "SCHD";
        const time = parsedUrl.searchParams.get("time");
        const cron = parsedUrl.searchParams.get("cron");
        waitUntil = this.dispatchScheduled(time ? parseInt(time) : undefined, cron !== null && cron !== void 0 ? cron : undefined);
        res === null || res === void 0 ? void 0 : res.writeHead(200, { "Content-Type": "text/html; charset=UTF-8" });
        res === null || res === void 0 ? void 0 : res.end();
    }
    else {
        try {
            response = await this.dispatchFetch(request);
            waitUntil = response.waitUntil();
            // node-fetch will decompress compressed responses meaning these
            // headers are probably wrong
            response.headers.delete("content-length");
            response.headers.delete("content-encoding");
            res === null || res === void 0 ? void 0 : res.writeHead(response.status, response.headers.raw());
            // Response body may be null if empty
            if (response.body) {
                for await (const chunk of response.body) {
                    res === null || res === void 0 ? void 0 : res.write(chunk);
                }
            }
            res === null || res === void 0 ? void 0 : res.end();
        }
        catch (e) {
            const youch = new youch_1.default(e, req);
            youch.addLink(() => {
                return [
                    '<a href="https://developers.cloudflare.com/workers/" target="_blank" style="text-decoration:none">📚 Workers Docs</a>',
                    '<a href="https://discord.gg/cloudflaredev" target="_blank" style="text-decoration:none">💬 Workers Discord</a>',
                    '<a href="https://miniflare.dev" target="_blank" style="text-decoration:none">🔥 Miniflare Docs</a>',
                ].join("");
            });
            const errorHtml = await youch.toHTML();
            res === null || res === void 0 ? void 0 : res.writeHead(500, { "Content-Type": "text/html; charset=UTF-8" });
            res === null || res === void 0 ? void 0 : res.end(errorHtml, "utf8");
            this.log.error(`${req.method} ${req.url}: ${e.stack}`);
        }
    }
    assert_1.default(req.method && req.url);
    await log_1.logResponse(this.log, {
        start,
        method: req.method,
        url: req.url,
        // Don't log 500 status if this is manual scheduled event trigger
        status: scheduled ? undefined : (_e = response === null || response === void 0 ? void 0 : response.status) !== null && _e !== void 0 ? _e : 500,
        waitUntil,
    });
    return response;
}, _Miniflare_webSocketConnectionListener = async function _Miniflare_webSocketConnectionListener(ws, req) {
    // Handle request in worker
    const response = await __classPrivateFieldGet(this, _Miniflare_instances, "m", _Miniflare_httpRequestListener).call(this, req);
    // Check web socket response was returned
    const webSocket = response === null || response === void 0 ? void 0 : response.webSocket;
    if ((response === null || response === void 0 ? void 0 : response.status) !== 101 || !webSocket) {
        ws.close(1002, "Protocol Error");
        this.log.error("Web Socket request did not return status 101 Switching Protocols response with Web Socket");
        return;
    }
    // Terminate the web socket here
    await ws_2.terminateWebSocket(ws, webSocket);
};
__exportStar(require("./kv"), exports);
__exportStar(require("./modules"), exports);
var log_2 = require("./log");
Object.defineProperty(exports, "NoOpLog", { enumerable: true, get: function () { return log_2.NoOpLog; } });
Object.defineProperty(exports, "ConsoleLog", { enumerable: true, get: function () { return log_2.ConsoleLog; } });
var options_1 = require("./options");
Object.defineProperty(exports, "getAccessibleHosts", { enumerable: true, get: function () { return options_1.getAccessibleHosts; } });
//# sourceMappingURL=index.js.map