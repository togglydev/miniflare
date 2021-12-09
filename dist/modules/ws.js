"use strict";
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
var _WebSocket_readyState, _WebSocket_sendQueue;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketsModule = exports.terminateWebSocket = exports.WebSocketPair = exports.WebSocket = exports.ErrorEvent = exports.CloseEvent = exports.MessageEvent = void 0;
const assert_1 = __importDefault(require("assert"));
const event_target_shim_1 = require("event-target-shim");
const helpers_1 = require("../helpers");
const module_1 = require("./module");
class MessageEvent extends event_target_shim_1.Event {
    constructor(data) {
        super("message");
        this.data = data;
    }
}
exports.MessageEvent = MessageEvent;
class CloseEvent extends event_target_shim_1.Event {
    constructor(code, reason) {
        super("close");
        this.code = code;
        this.reason = reason;
    }
}
exports.CloseEvent = CloseEvent;
class ErrorEvent extends event_target_shim_1.Event {
    constructor(error) {
        super("error");
        this.error = error;
    }
}
exports.ErrorEvent = ErrorEvent;
// Maps web sockets to the other side of their connections, we don't want to
// expose this to the user, but this cannot be a private field as we need to
// construct both sockets before setting the circular references
const pairSymbol = Symbol("pair");
class WebSocket extends event_target_shim_1.EventTarget {
    constructor() {
        super(...arguments);
        _WebSocket_readyState.set(this, WebSocket.CONNECTING);
        _WebSocket_sendQueue.set(this, []);
    }
    get readyState() {
        return __classPrivateFieldGet(this, _WebSocket_readyState, "f");
    }
    accept() {
        if (__classPrivateFieldGet(this, _WebSocket_readyState, "f") !== WebSocket.CONNECTING) {
            throw new Error(`WebSocket is not connecting: readyState ${__classPrivateFieldGet(this, _WebSocket_readyState, "f")} (${readyStateNames[__classPrivateFieldGet(this, _WebSocket_readyState, "f")]})`);
        }
        __classPrivateFieldSet(this, _WebSocket_readyState, WebSocket.OPEN, "f");
        if (__classPrivateFieldGet(this, _WebSocket_sendQueue, "f")) {
            for (const event of __classPrivateFieldGet(this, _WebSocket_sendQueue, "f")) {
                this.dispatchEvent(event);
            }
            __classPrivateFieldSet(this, _WebSocket_sendQueue, undefined, "f");
        }
    }
    send(message) {
        const pair = this[pairSymbol];
        assert_1.default(pair !== undefined);
        if (__classPrivateFieldGet(this, _WebSocket_readyState, "f") >= WebSocket.CLOSING) {
            throw new Error(`WebSocket is not connecting/open: readyState ${__classPrivateFieldGet(this, _WebSocket_readyState, "f")} (${readyStateNames[__classPrivateFieldGet(this, _WebSocket_readyState, "f")]})`);
        }
        const event = new MessageEvent(message);
        if (__classPrivateFieldGet(pair, _WebSocket_readyState, "f") === WebSocket.OPEN) {
            pair.dispatchEvent(event);
        }
        else {
            if (__classPrivateFieldGet(pair, _WebSocket_readyState, "f") !== WebSocket.CONNECTING) {
                throw new Error(`Pair WebSocket is not connecting: readyState ${__classPrivateFieldGet(pair, _WebSocket_readyState, "f")} (${readyStateNames[__classPrivateFieldGet(pair, _WebSocket_readyState, "f")]})`);
            }
            assert_1.default(__classPrivateFieldGet(pair, _WebSocket_sendQueue, "f") !== undefined);
            __classPrivateFieldGet(pair, _WebSocket_sendQueue, "f").push(event);
        }
    }
    close(code, reason) {
        const pair = this[pairSymbol];
        assert_1.default(pair !== undefined);
        if (__classPrivateFieldGet(this, _WebSocket_readyState, "f") >= WebSocket.CLOSING ||
            __classPrivateFieldGet(pair, _WebSocket_readyState, "f") >= WebSocket.CLOSING) {
            return;
        }
        __classPrivateFieldSet(this, _WebSocket_readyState, WebSocket.CLOSING, "f");
        __classPrivateFieldSet(pair, _WebSocket_readyState, WebSocket.CLOSING, "f");
        this.dispatchEvent(new CloseEvent(code, reason));
        pair.dispatchEvent(new CloseEvent(code, reason));
        __classPrivateFieldSet(this, _WebSocket_readyState, WebSocket.CLOSED, "f");
        __classPrivateFieldSet(pair, _WebSocket_readyState, WebSocket.CLOSED, "f");
    }
}
exports.WebSocket = WebSocket;
_WebSocket_readyState = new WeakMap(), _WebSocket_sendQueue = new WeakMap();
WebSocket.CONNECTING = 0;
WebSocket.OPEN = 1;
WebSocket.CLOSING = 2;
WebSocket.CLOSED = 3;
const readyStateNames = {
    [WebSocket.CONNECTING]: "CONNECTING",
    [WebSocket.OPEN]: "OPEN",
    [WebSocket.CLOSING]: "CLOSING",
    [WebSocket.CLOSED]: "CLOSED",
};
class WebSocketPair {
    constructor() {
        this[0] = new WebSocket();
        this[1] = new WebSocket();
        this[0][pairSymbol] = this[1];
        this[1][pairSymbol] = this[0];
    }
}
exports.WebSocketPair = WebSocketPair;
async function terminateWebSocket(ws, pair) {
    // Forward events from client to worker
    ws.on("message", (message) => {
        if (typeof message === "string") {
            pair.send(message);
        }
        else {
            ws.close(1003, "Unsupported Data");
        }
    });
    ws.on("close", (code, reason) => {
        pair.close(code, reason);
    });
    ws.on("error", (error) => {
        pair.dispatchEvent(new ErrorEvent(error));
    });
    // Forward events from worker to client
    pair.addEventListener("message", (e) => {
        ws.send(e.data);
    });
    pair.addEventListener("close", (e) => {
        ws.close(e.code, e.reason);
    });
    // Our constants are the same as ws's
    if (ws.readyState >= WebSocket.CLOSING) {
        throw new helpers_1.MiniflareError("WebSocket already closed");
    }
    else if (ws.readyState === WebSocket.CONNECTING) {
        // Wait for client to be open before accepting worker pair
        await new Promise((resolve, reject) => {
            ws.on("open", () => {
                ws.off("close", reject);
                ws.off("error", reject);
                resolve(undefined);
            });
            ws.once("close", reject);
            ws.once("error", reject);
        });
    }
    pair.accept();
}
exports.terminateWebSocket = terminateWebSocket;
class WebSocketsModule extends module_1.Module {
    buildSandbox() {
        return {
            MessageEvent,
            CloseEvent,
            ErrorEvent,
            WebSocket,
            WebSocketPair,
        };
    }
}
exports.WebSocketsModule = WebSocketsModule;
//# sourceMappingURL=ws.js.map