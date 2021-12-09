"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _Cache_storage, _Cache_clock, _Cache_namespace;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoOpCache = exports.Cache = void 0;
const node_fetch_1 = require("@mrbbot/node-fetch");
const http_cache_semantics_1 = __importDefault(require("http-cache-semantics"));
const helpers_1 = require("./helpers");
const namespace_1 = require("./namespace");
function normaliseRequest(req) {
    return req instanceof node_fetch_1.Request ? req : new node_fetch_1.Request(req);
}
// Normalises headers to object mapping lower-case names to single values.
// Single values are OK here as the headers we care about for determining
// cacheability are all single-valued, and we store the raw, multi-valued
// headers in KV once this has been determined.
function normaliseHeaders(headers) {
    const result = {};
    for (const [key, value] of headers) {
        result[key.toLowerCase()] = value;
    }
    return result;
}
function getKey(req) {
    return `${req.url}.json`;
}
class Cache {
    constructor(storage, clock = helpers_1.defaultClock) {
        _Cache_storage.set(this, void 0);
        _Cache_clock.set(this, void 0);
        _Cache_namespace.set(this, void 0);
        __classPrivateFieldSet(this, _Cache_storage, storage, "f");
        __classPrivateFieldSet(this, _Cache_clock, clock, "f");
        __classPrivateFieldSet(this, _Cache_namespace, new namespace_1.KVStorageNamespace(storage, clock), "f");
    }
    async put(req, res) {
        var _a;
        req = normaliseRequest(req);
        // Cloudflare ignores request Cache-Control
        const reqHeaders = normaliseHeaders(req.headers);
        delete reqHeaders["cache-control"];
        // Cloudflare never caches responses with Set-Cookie headers
        // If Cache-Control contains private=set-cookie, Cloudflare will remove
        // the Set-Cookie header automatically
        const resHeaders = normaliseHeaders(res.headers);
        if ((_a = resHeaders["cache-control"]) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes("private=set-cookie")) {
            resHeaders["cache-control"] = resHeaders["cache-control"].replace(/private=set-cookie/i, "");
            delete resHeaders["set-cookie"];
        }
        // Build request and responses suitable for CachePolicy
        const cacheReq = {
            url: req.url,
            method: req.method,
            headers: reqHeaders,
        };
        const cacheRes = {
            status: res.status,
            headers: resHeaders,
        };
        // @ts-expect-error `now` isn't included in CachePolicy's type definitions
        const originalNow = http_cache_semantics_1.default.prototype.now;
        // @ts-expect-error `now` isn't included in CachePolicy's type definitions
        http_cache_semantics_1.default.prototype.now = __classPrivateFieldGet(this, _Cache_clock, "f");
        let expirationTtl;
        try {
            const policy = new http_cache_semantics_1.default(cacheReq, cacheRes, { shared: true });
            // Check if the request & response is cacheable, if not return undefined
            if (req.method !== "GET" ||
                "set-cookie" in resHeaders ||
                !policy.storable()) {
                return;
            }
            expirationTtl = policy.timeToLive() / 1000;
        }
        finally {
            // @ts-expect-error `now` isn't included in CachePolicy's type definitions
            http_cache_semantics_1.default.prototype.now = originalNow;
        }
        // If it is cacheable, store it in KV
        const key = getKey(req);
        await __classPrivateFieldGet(this, _Cache_namespace, "f").put(key, JSON.stringify({
            status: res.status,
            headers: res.headers.raw(),
            body: Buffer.from(await res.arrayBuffer()).toString("base64"),
        }), { expirationTtl });
    }
    async match(req, options) {
        req = normaliseRequest(req);
        // Cloudflare only caches GET requests
        if (req.method !== "GET" && !(options === null || options === void 0 ? void 0 : options.ignoreMethod))
            return;
        // Check if we have the response cached
        const key = getKey(req);
        const res = await __classPrivateFieldGet(this, _Cache_namespace, "f").get(key, "json");
        if (!res)
            return;
        // Build Response from cache
        res.headers["CF-Cache-Status"] = ["HIT"];
        return new node_fetch_1.Response(Buffer.from(res.body, "base64"), {
            status: res.status,
            headers: res.headers,
        });
    }
    async delete(req, options) {
        req = normaliseRequest(req);
        // Cloudflare only caches GET requests
        if (req.method !== "GET" && !(options === null || options === void 0 ? void 0 : options.ignoreMethod))
            return false;
        // Delete the cached response if it exists (we delete from this.storage not
        // this.namespace since we need to know whether we deleted something)
        const key = getKey(req);
        return __classPrivateFieldGet(this, _Cache_storage, "f").delete(key);
    }
}
exports.Cache = Cache;
_Cache_storage = new WeakMap(), _Cache_clock = new WeakMap(), _Cache_namespace = new WeakMap();
class NoOpCache {
    async put(_req, _res) {
        return;
    }
    async match(_req, _options) {
        return;
    }
    async delete(_req, _options) {
        return false;
    }
}
exports.NoOpCache = NoOpCache;
//# sourceMappingURL=cache.js.map