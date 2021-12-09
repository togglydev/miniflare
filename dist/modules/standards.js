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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandardsModule = exports.crypto = exports.btoa = exports.atob = exports.CryptoKey = exports.WritableStreamDefaultWriter = exports.WritableStreamDefaultController = exports.WritableStream = exports.TransformStreamDefaultController = exports.TransformStream = exports.ReadableStreamDefaultReader = exports.ReadableStreamDefaultController = exports.ReadableStreamBYOBRequest = exports.ReadableStreamBYOBReader = exports.ReadableStream = exports.ReadableByteStreamController = exports.CountQueuingStrategy = exports.ByteLengthQueuingStrategy = exports.Request = exports.FormData = exports.Headers = exports.FetchError = exports.TextEncoder = exports.TextDecoder = exports.URLSearchParams = exports.URL = exports.Response = void 0;
const crypto_1 = require("crypto");
const url_1 = require("url");
Object.defineProperty(exports, "URL", { enumerable: true, get: function () { return url_1.URL; } });
Object.defineProperty(exports, "URLSearchParams", { enumerable: true, get: function () { return url_1.URLSearchParams; } });
const util_1 = require("util");
Object.defineProperty(exports, "TextDecoder", { enumerable: true, get: function () { return util_1.TextDecoder; } });
Object.defineProperty(exports, "TextEncoder", { enumerable: true, get: function () { return util_1.TextEncoder; } });
const node_fetch_1 = __importStar(require("@mrbbot/node-fetch"));
Object.defineProperty(exports, "FetchError", { enumerable: true, get: function () { return node_fetch_1.FetchError; } });
Object.defineProperty(exports, "Headers", { enumerable: true, get: function () { return node_fetch_1.Headers; } });
Object.defineProperty(exports, "Request", { enumerable: true, get: function () { return node_fetch_1.Request; } });
const webcrypto_1 = require("@peculiar/webcrypto");
Object.defineProperty(exports, "CryptoKey", { enumerable: true, get: function () { return webcrypto_1.CryptoKey; } });
const formdata_node_1 = __importDefault(require("formdata-node"));
exports.FormData = formdata_node_1.default;
const es6_1 = require("web-streams-polyfill/ponyfill/es6");
Object.defineProperty(exports, "ByteLengthQueuingStrategy", { enumerable: true, get: function () { return es6_1.ByteLengthQueuingStrategy; } });
Object.defineProperty(exports, "CountQueuingStrategy", { enumerable: true, get: function () { return es6_1.CountQueuingStrategy; } });
Object.defineProperty(exports, "ReadableByteStreamController", { enumerable: true, get: function () { return es6_1.ReadableByteStreamController; } });
Object.defineProperty(exports, "ReadableStream", { enumerable: true, get: function () { return es6_1.ReadableStream; } });
Object.defineProperty(exports, "ReadableStreamBYOBReader", { enumerable: true, get: function () { return es6_1.ReadableStreamBYOBReader; } });
Object.defineProperty(exports, "ReadableStreamBYOBRequest", { enumerable: true, get: function () { return es6_1.ReadableStreamBYOBRequest; } });
Object.defineProperty(exports, "ReadableStreamDefaultController", { enumerable: true, get: function () { return es6_1.ReadableStreamDefaultController; } });
Object.defineProperty(exports, "ReadableStreamDefaultReader", { enumerable: true, get: function () { return es6_1.ReadableStreamDefaultReader; } });
Object.defineProperty(exports, "TransformStream", { enumerable: true, get: function () { return es6_1.TransformStream; } });
Object.defineProperty(exports, "TransformStreamDefaultController", { enumerable: true, get: function () { return es6_1.TransformStreamDefaultController; } });
Object.defineProperty(exports, "WritableStream", { enumerable: true, get: function () { return es6_1.WritableStream; } });
Object.defineProperty(exports, "WritableStreamDefaultController", { enumerable: true, get: function () { return es6_1.WritableStreamDefaultController; } });
Object.defineProperty(exports, "WritableStreamDefaultWriter", { enumerable: true, get: function () { return es6_1.WritableStreamDefaultWriter; } });
const ws_1 = __importDefault(require("ws"));
const module_1 = require("./module");
const ws_2 = require("./ws");
exports.Response = node_fetch_1.Response;
function atob(s) {
    return Buffer.from(s, "base64").toString("binary");
}
exports.atob = atob;
function btoa(s) {
    return Buffer.from(s, "binary").toString("base64");
}
exports.btoa = btoa;
exports.crypto = new webcrypto_1.Crypto();
// Override the digest function to add support for MD5 digests which aren't
// part of the WebCrypto standard, but are supported in Workers
const originalDigest = exports.crypto.subtle.digest.bind(exports.crypto.subtle);
exports.crypto.subtle.digest = function (algorithm, data) {
    const algorithmName = typeof algorithm === "string" ? algorithm : algorithm === null || algorithm === void 0 ? void 0 : algorithm.name;
    if ((algorithmName === null || algorithmName === void 0 ? void 0 : algorithmName.toLowerCase()) == "md5") {
        if (data instanceof ArrayBuffer)
            data = Buffer.from(data);
        return Promise.resolve(crypto_1.createHash("md5")
            .update(data)
            .digest().buffer);
    }
    // If the algorithm isn't MD5, defer to the original function
    return originalDigest(algorithm, data);
};
class StandardsModule extends module_1.Module {
    constructor(log) {
        // TODO: (low priority) proxy Date.now() and add warning, maybe new Date() too?
        super(log);
        this.webSockets = [];
        this.sandbox = {
            console,
            setTimeout,
            setInterval,
            clearTimeout,
            clearInterval,
            atob,
            btoa,
            crypto: exports.crypto,
            CryptoKey: webcrypto_1.CryptoKey,
            TextDecoder: util_1.TextDecoder,
            TextEncoder: util_1.TextEncoder,
            fetch: this.fetch.bind(this),
            Headers: node_fetch_1.Headers,
            Request: node_fetch_1.Request,
            Response: exports.Response,
            FormData: formdata_node_1.default,
            URL: url_1.URL,
            URLSearchParams: url_1.URLSearchParams,
            ByteLengthQueuingStrategy: es6_1.ByteLengthQueuingStrategy,
            CountQueuingStrategy: es6_1.CountQueuingStrategy,
            ReadableByteStreamController: es6_1.ReadableByteStreamController,
            ReadableStream: es6_1.ReadableStream,
            ReadableStreamBYOBReader: es6_1.ReadableStreamBYOBReader,
            ReadableStreamBYOBRequest: es6_1.ReadableStreamBYOBRequest,
            ReadableStreamDefaultController: es6_1.ReadableStreamDefaultController,
            ReadableStreamDefaultReader: es6_1.ReadableStreamDefaultReader,
            TransformStream: es6_1.TransformStream,
            TransformStreamDefaultController: es6_1.TransformStreamDefaultController,
            WritableStream: es6_1.WritableStream,
            WritableStreamDefaultController: es6_1.WritableStreamDefaultController,
            WritableStreamDefaultWriter: es6_1.WritableStreamDefaultWriter,
            // The types below would be included automatically, but it's not possible
            // to create instances of them without using their constructors and they
            // may be returned from Miniflare's realm (e.g. ArrayBuffer responses,
            // Durable Object listed keys) so it makes sense to share these so
            // instanceof behaves correctly.
            ArrayBuffer,
            Atomics,
            BigInt64Array,
            BigUint64Array,
            DataView,
            Date,
            Float32Array,
            Float64Array,
            Int8Array,
            Int16Array,
            Int32Array,
            Map,
            Set,
            SharedArrayBuffer,
            Uint8Array,
            Uint8ClampedArray,
            Uint16Array,
            Uint32Array,
            WeakMap,
            WeakSet,
            WebAssembly,
            // The types below are included automatically. By not including Array,
            // Object, Function and RegExp, instanceof will return true for these
            // types on literals. JSON.parse will return instances of its realm's
            // objects/arrays too, hence it is not included. See tests for examples.
            //
            // Array,
            // Boolean,
            // Function,
            // Error,
            // EvalError,
            // Math,
            // NaN,
            // Number,
            // BigInt,
            // Object,
            // Promise,
            // Proxy,
            // RangeError,
            // ReferenceError,
            // Reflect,
            // RegExp,
            // String,
            // Symbol,
            // SyntaxError,
            // TypeError,
            // URIError,
            // Intl,
            // JSON,
        };
    }
    async fetch(input, init) {
        const request = new node_fetch_1.Request(input, init);
        // Cloudflare ignores request Host
        request.headers.delete("host");
        // Handle web socket upgrades
        if (request.method === "GET" &&
            request.headers.get("upgrade") === "websocket") {
            // Establish web socket connection
            const headers = {};
            for (const [key, value] of request.headers.entries()) {
                headers[key] = value;
            }
            const ws = new ws_1.default(request.url, {
                followRedirects: request.redirect === "follow",
                maxRedirects: request.follow,
                headers,
            });
            this.webSockets.push(ws);
            // Terminate web socket with pair and resolve
            const [worker, client] = Object.values(new ws_2.WebSocketPair());
            await ws_2.terminateWebSocket(ws, client);
            return new exports.Response(null, { webSocket: worker });
        }
        // TODO: (low priority) support cache using fetch:
        //  https://developers.cloudflare.com/workers/learning/how-the-cache-works#fetch
        //  https://developers.cloudflare.com/workers/examples/cache-using-fetch
        return node_fetch_1.default(request);
    }
    resetWebSockets() {
        // Ensure all fetched web sockets are closed
        for (const ws of this.webSockets) {
            ws.close(1012, "Service Restart");
        }
        this.webSockets = [];
    }
    buildSandbox() {
        return this.sandbox;
    }
}
exports.StandardsModule = StandardsModule;
//# sourceMappingURL=standards.js.map