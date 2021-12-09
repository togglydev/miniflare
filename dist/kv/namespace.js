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
var _KVStorageNamespace_storage, _KVStorageNamespace_clock;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KVStorageNamespace = void 0;
const es6_1 = require("web-streams-polyfill/ponyfill/es6");
const helpers_1 = require("./helpers");
const collator = new Intl.Collator();
// Returns value as an integer or undefined if it isn't one
function normaliseInt(value) {
    switch (typeof value) {
        case "string":
            const parsed = parseInt(value);
            return isNaN(parsed) ? undefined : parsed;
        case "number":
            return Math.round(value);
        default:
            return undefined;
    }
}
// Returns a buffer containing a concatenation of all chunks written to a stream
function consumeReadableStream(stream) {
    return new Promise((resolve, reject) => {
        const reader = stream.getReader();
        const chunks = [];
        let totalLength = 0;
        // Keep pushing until we're done reading the stream
        function push() {
            reader
                .read()
                .then(({ done, value }) => {
                if (done) {
                    resolve(Buffer.concat(chunks, totalLength));
                }
                else {
                    const chunk = Buffer.from(value);
                    totalLength += chunk.length;
                    chunks.push(chunk);
                    push();
                }
            })
                .catch(reject);
        }
        push();
    });
}
// Normalises type, ignoring cacheTtl as there is only one "edge location":
// the user's computer
function validateGetType(options) {
    var _a;
    const type = typeof options === "string" ? options : (_a = options.type) !== null && _a !== void 0 ? _a : "text";
    // Validate type
    if (!["text", "json", "arrayBuffer", "stream"].includes(type)) {
        throw new TypeError(`Invalid type: expected "text" | "json" | "arrayBuffer" | "stream", got "${type}"`);
    }
    return type;
}
function convertToGetType(value, type) {
    switch (type) {
        case "text":
            return value.toString("utf8");
        case "arrayBuffer":
            return Uint8Array.from(value).buffer;
        case "json":
            return JSON.parse(value.toString("utf8"));
        case "stream":
            return new es6_1.ReadableStream({
                start(controller) {
                    controller.enqueue(Uint8Array.from(value));
                    controller.close();
                },
            });
    }
}
class KVStorageNamespace {
    constructor(storage, clock = helpers_1.defaultClock) {
        _KVStorageNamespace_storage.set(this, void 0);
        _KVStorageNamespace_clock.set(this, void 0);
        __classPrivateFieldSet(this, _KVStorageNamespace_storage, storage, "f");
        __classPrivateFieldSet(this, _KVStorageNamespace_clock, clock, "f");
    }
    async get(key, options = {}) {
        const type = validateGetType(options);
        // Get value without metadata, returning null if not found
        const storedValue = await __classPrivateFieldGet(this, _KVStorageNamespace_storage, "f").get(key, true);
        if (storedValue === undefined)
            return null;
        // Return correctly typed value
        return convertToGetType(storedValue.value, type);
    }
    async getWithMetadata(key, options = {}) {
        const type = validateGetType(options);
        // Get value with metadata, returning nulls if not found
        const storedValue = await __classPrivateFieldGet(this, _KVStorageNamespace_storage, "f").get(key);
        if (storedValue === undefined)
            return { value: null, metadata: null };
        const { value, metadata = null } = storedValue;
        // Return correctly typed value with metadata
        return { value: convertToGetType(value, type), metadata };
    }
    async put(key, value, { expiration, expirationTtl, metadata } = {}) {
        // Convert value to a buffer
        let buffer;
        if (value instanceof es6_1.ReadableStream) {
            buffer = await consumeReadableStream(value);
        }
        else if (value instanceof ArrayBuffer) {
            buffer = Buffer.from(value);
        }
        else {
            buffer = Buffer.from(value, "utf8");
        }
        // Normalise expiration
        expiration = normaliseInt(expiration);
        expirationTtl = normaliseInt(expirationTtl);
        if (expirationTtl !== undefined) {
            expiration = helpers_1.millisToSeconds(__classPrivateFieldGet(this, _KVStorageNamespace_clock, "f").call(this)) + expirationTtl;
        }
        // Store value with expiration and metadata
        await __classPrivateFieldGet(this, _KVStorageNamespace_storage, "f").put(key, {
            value: buffer,
            expiration,
            metadata,
        });
    }
    async delete(key) {
        await __classPrivateFieldGet(this, _KVStorageNamespace_storage, "f").delete(key);
    }
    async list({ prefix = "", limit = 1000, cursor, } = {}) {
        // Validate options
        if (limit <= 0) {
            throw new TypeError(`Invalid limit: expected number > 0, got ${limit}`);
        }
        // We store the the cursor as the key to start AFTER so keys inserted whilst
        // paginating are returned
        const startAfter = cursor === undefined
            ? ""
            : Buffer.from(cursor, "base64").toString("utf8");
        // Get all keys matching the prefix, cursor and limit
        let nextName = "";
        const slicedKeys = await __classPrivateFieldGet(this, _KVStorageNamespace_storage, "f").list({
            prefix,
            keysFilter(keys) {
                // Sort the keys (in-place), so the cursor works correctly
                keys.sort((a, b) => collator.compare(a.name, b.name));
                // Find the correct part of the sorted array to return
                let startIndex = 0;
                if (startAfter !== "") {
                    startIndex = keys.findIndex(({ name }) => name === startAfter);
                    // If we couldn't find where to start, return nothing
                    if (startIndex === -1) {
                        startIndex = keys.length;
                    }
                    // Since we want to start AFTER this index, add 1 to it
                    startIndex++;
                }
                const endIndex = startIndex + limit;
                nextName = endIndex < keys.length ? keys[endIndex - 1].name : "";
                // Get key range to return
                return keys.slice(startIndex, endIndex);
            },
        });
        // Build next cursor and return keys
        const nextCursor = nextName === "" ? "" : Buffer.from(nextName, "utf8").toString("base64");
        return {
            keys: slicedKeys,
            list_complete: nextName === "",
            cursor: nextCursor,
        };
    }
}
exports.KVStorageNamespace = KVStorageNamespace;
_KVStorageNamespace_storage = new WeakMap(), _KVStorageNamespace_clock = new WeakMap();
//# sourceMappingURL=namespace.js.map