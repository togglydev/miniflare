"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _HTMLRewriter_elementHandlers, _HTMLRewriter_documentHandlers;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentEnd = exports.Doctype = exports.TextChunk = exports.Comment = exports.Element = exports.HTMLRewriterModule = exports.HTMLRewriter = exports.transformToArray = void 0;
const util_1 = require("util");
const html_rewriter_wasm_1 = require("html-rewriter-wasm");
Object.defineProperty(exports, "Comment", { enumerable: true, get: function () { return html_rewriter_wasm_1.Comment; } });
Object.defineProperty(exports, "Doctype", { enumerable: true, get: function () { return html_rewriter_wasm_1.Doctype; } });
Object.defineProperty(exports, "DocumentEnd", { enumerable: true, get: function () { return html_rewriter_wasm_1.DocumentEnd; } });
Object.defineProperty(exports, "Element", { enumerable: true, get: function () { return html_rewriter_wasm_1.Element; } });
Object.defineProperty(exports, "TextChunk", { enumerable: true, get: function () { return html_rewriter_wasm_1.TextChunk; } });
const es6_1 = require("web-streams-polyfill/ponyfill/es6");
const module_1 = require("./module");
const standards_1 = require("./standards");
// Based on https://developer.mozilla.org/en-US/docs/Web/API/TransformStream#anything-to-uint8array_stream
const encoder = new util_1.TextEncoder();
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function transformToArray(chunk) {
    if (chunk instanceof Uint8Array) {
        return chunk;
    }
    else if (ArrayBuffer.isView(chunk)) {
        return new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);
    }
    else if (chunk instanceof ArrayBuffer) {
        return new Uint8Array(chunk);
    }
    else if (Array.isArray(chunk) &&
        chunk.every((value) => typeof value === "number")) {
        return new Uint8Array(chunk);
    }
    else if (typeof chunk === "number") {
        return new Uint8Array([chunk]);
    }
    else if (chunk === null || chunk === undefined) {
        throw new TypeError("chunk must be defined");
    }
    else {
        return encoder.encode(String(chunk));
    }
}
exports.transformToArray = transformToArray;
class HTMLRewriter {
    constructor() {
        _HTMLRewriter_elementHandlers.set(this, []);
        _HTMLRewriter_documentHandlers.set(this, []);
    }
    on(selector, handlers) {
        __classPrivateFieldGet(this, _HTMLRewriter_elementHandlers, "f").push([selector, handlers]);
        return this;
    }
    onDocument(handlers) {
        __classPrivateFieldGet(this, _HTMLRewriter_documentHandlers, "f").push(handlers);
        return this;
    }
    transform(response) {
        const transformedStream = new es6_1.ReadableStream({
            type: "bytes",
            start: async (controller) => {
                // Create a rewriter instance for this transformation that writes its
                // output to the transformed response's stream
                const rewriter = new html_rewriter_wasm_1.HTMLRewriter((output) => {
                    // enqueue will throw on empty chunks
                    if (output.length !== 0)
                        controller.enqueue(output);
                });
                // Add all registered handlers
                for (const [selector, handlers] of __classPrivateFieldGet(this, _HTMLRewriter_elementHandlers, "f")) {
                    rewriter.on(selector, handlers);
                }
                for (const handlers of __classPrivateFieldGet(this, _HTMLRewriter_documentHandlers, "f")) {
                    rewriter.onDocument(handlers);
                }
                try {
                    // Transform the response body (may be null if empty)
                    if (response.body) {
                        for await (const chunk of response.body) {
                            await rewriter.write(transformToArray(chunk));
                        }
                    }
                    await rewriter.end();
                }
                catch (e) {
                    controller.error(e);
                }
                finally {
                    // Make sure the rewriter/controller are always freed/closed
                    rewriter.free();
                    controller.close();
                }
            },
        });
        // Return a response with the transformed body, copying over headers, etc
        return new standards_1.Response(transformedStream, response);
    }
}
exports.HTMLRewriter = HTMLRewriter;
_HTMLRewriter_elementHandlers = new WeakMap(), _HTMLRewriter_documentHandlers = new WeakMap();
class HTMLRewriterModule extends module_1.Module {
    buildSandbox() {
        return { HTMLRewriter };
    }
}
exports.HTMLRewriterModule = HTMLRewriterModule;
//# sourceMappingURL=rewriter.js.map