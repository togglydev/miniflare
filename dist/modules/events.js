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
var _a, _b, _c, _ServiceWorkerGlobalScope_instances, _ServiceWorkerGlobalScope_log, _ServiceWorkerGlobalScope_environment, _ServiceWorkerGlobalScope_wrappedListeners, _ServiceWorkerGlobalScope_wrappedError, _ServiceWorkerGlobalScope_wrap;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsModule = exports.ServiceWorkerGlobalScope = exports.dispatchScheduledSymbol = exports.dispatchFetchSymbol = exports.addModuleScheduledListenerSymbol = exports.addModuleFetchListenerSymbol = exports.ScheduledEvent = exports.FetchEvent = exports.waitUntilSymbol = exports.passThroughSymbol = exports.responseSymbol = void 0;
const node_fetch_1 = __importDefault(require("@mrbbot/node-fetch"));
const event_target_shim_1 = require("event-target-shim");
const module_1 = require("./module");
const standards_1 = require("./standards");
// Event properties that need to be accessible in the events module but not
// to user code, exported for testing
exports.responseSymbol = Symbol("response");
exports.passThroughSymbol = Symbol("passThrough");
exports.waitUntilSymbol = Symbol("waitUntil");
class FetchEvent extends event_target_shim_1.Event {
    constructor(request) {
        super("fetch");
        this.request = request;
        this[_a] = false;
        this[_b] = [];
    }
    respondWith(response) {
        this.stopImmediatePropagation();
        this[exports.responseSymbol] = Promise.resolve(response);
    }
    passThroughOnException() {
        this[exports.passThroughSymbol] = true;
    }
    waitUntil(promise) {
        this[exports.waitUntilSymbol].push(promise);
    }
}
exports.FetchEvent = FetchEvent;
_a = exports.passThroughSymbol, _b = exports.waitUntilSymbol;
class ScheduledEvent extends event_target_shim_1.Event {
    constructor(scheduledTime, cron) {
        super("scheduled");
        this.scheduledTime = scheduledTime;
        this.cron = cron;
        this[_c] = [];
    }
    waitUntil(promise) {
        this[exports.waitUntilSymbol].push(promise);
    }
}
exports.ScheduledEvent = ScheduledEvent;
_c = exports.waitUntilSymbol;
exports.addModuleFetchListenerSymbol = Symbol("addModuleFetchListener");
exports.addModuleScheduledListenerSymbol = Symbol("addModuleScheduledListener");
exports.dispatchFetchSymbol = Symbol("dispatchFetch");
exports.dispatchScheduledSymbol = Symbol("dispatchScheduled");
class ServiceWorkerGlobalScope extends event_target_shim_1.EventTarget {
    constructor(log, sandbox, environment, modules) {
        super();
        _ServiceWorkerGlobalScope_instances.add(this);
        _ServiceWorkerGlobalScope_log.set(this, void 0);
        _ServiceWorkerGlobalScope_environment.set(this, void 0);
        _ServiceWorkerGlobalScope_wrappedListeners.set(this, new WeakMap());
        _ServiceWorkerGlobalScope_wrappedError.set(this, void 0);
        __classPrivateFieldSet(this, _ServiceWorkerGlobalScope_log, log, "f");
        __classPrivateFieldSet(this, _ServiceWorkerGlobalScope_environment, environment, "f");
        // Only including environment in global scope if not using modules
        Object.assign(this, sandbox);
        if (!modules)
            Object.assign(this, environment);
        // Build global self-references
        this.global = this;
        this.globalThis = this;
        this.self = this;
        // Make sure this remains bound when creating VM context
        this.addEventListener = this.addEventListener.bind(this);
        this.removeEventListener = this.removeEventListener.bind(this);
        this.dispatchEvent = this.dispatchEvent.bind(this);
    }
    addEventListener(type, listener, options) {
        super.addEventListener(type, __classPrivateFieldGet(this, _ServiceWorkerGlobalScope_instances, "m", _ServiceWorkerGlobalScope_wrap).call(this, listener), options);
    }
    removeEventListener(type, listener, options) {
        super.removeEventListener(type, __classPrivateFieldGet(this, _ServiceWorkerGlobalScope_instances, "m", _ServiceWorkerGlobalScope_wrap).call(this, listener), options);
    }
    dispatchEvent(event) {
        __classPrivateFieldSet(this, _ServiceWorkerGlobalScope_wrappedError, undefined, "f");
        const result = super.dispatchEvent(event);
        if (__classPrivateFieldGet(this, _ServiceWorkerGlobalScope_wrappedError, "f") !== undefined)
            throw __classPrivateFieldGet(this, _ServiceWorkerGlobalScope_wrappedError, "f");
        return result;
    }
    [(_ServiceWorkerGlobalScope_log = new WeakMap(), _ServiceWorkerGlobalScope_environment = new WeakMap(), _ServiceWorkerGlobalScope_wrappedListeners = new WeakMap(), _ServiceWorkerGlobalScope_wrappedError = new WeakMap(), _ServiceWorkerGlobalScope_instances = new WeakSet(), _ServiceWorkerGlobalScope_wrap = function _ServiceWorkerGlobalScope_wrap(listener) {
        // When an event listener throws, we want dispatching to stop and the
        // error to be thrown so we can catch it and display a nice error page.
        if (listener === undefined)
            return undefined;
        if (listener === null)
            return null;
        const wrappedListeners = __classPrivateFieldGet(this, _ServiceWorkerGlobalScope_wrappedListeners, "f");
        let wrappedListener = wrappedListeners.get(listener);
        if (wrappedListener)
            return wrappedListener;
        wrappedListener = (event) => {
            try {
                if ("handleEvent" in listener) {
                    listener.handleEvent(event);
                }
                else {
                    // @ts-expect-error "this" type is definitely correct
                    listener(event);
                }
            }
            catch (error) {
                event.stopImmediatePropagation();
                __classPrivateFieldSet(this, _ServiceWorkerGlobalScope_wrappedError, error, "f");
            }
        };
        wrappedListeners.set(listener, wrappedListener);
        return wrappedListener;
    }, exports.addModuleFetchListenerSymbol)](listener) {
        const environment = __classPrivateFieldGet(this, _ServiceWorkerGlobalScope_environment, "f");
        this.addEventListener("fetch", (e) => {
            const ctx = {
                passThroughOnException: e.passThroughOnException.bind(e),
                waitUntil: e.waitUntil.bind(e),
            };
            const res = listener(e.request, environment, ctx);
            e.respondWith(res);
        });
    }
    [exports.addModuleScheduledListenerSymbol](listener) {
        const environment = __classPrivateFieldGet(this, _ServiceWorkerGlobalScope_environment, "f");
        this.addEventListener("scheduled", (e) => {
            const controller = { cron: e.cron, scheduledTime: e.scheduledTime };
            const ctx = { waitUntil: e.waitUntil.bind(e) };
            const res = listener(controller, environment, ctx);
            e.waitUntil(Promise.resolve(res));
        });
    }
    async [exports.dispatchFetchSymbol](request, upstreamUrl) {
        // NOTE: upstreamUrl is only used for throwing an error if no listener
        // provides a response. For this function to work correctly, the request's
        // origin must also be upstreamUrl.
        const event = new FetchEvent(request.clone());
        const waitUntil = async () => {
            return (await Promise.all(event[exports.waitUntilSymbol]));
        };
        try {
            this.dispatchEvent(event);
            // `event[responseSymbol]` may be `undefined`, but `await undefined` is
            // still `undefined`
            const response = (await event[exports.responseSymbol]);
            if (response) {
                response.waitUntil = waitUntil;
                return response;
            }
        }
        catch (e) {
            if (event[exports.passThroughSymbol]) {
                // warn instead of error so we don't throw an exception when not logging
                __classPrivateFieldGet(this, _ServiceWorkerGlobalScope_log, "f").warn(e.stack);
            }
            else {
                throw e;
            }
        }
        if (!upstreamUrl) {
            throw new standards_1.FetchError("No fetch handler responded and unable to proxy request to upstream: no upstream specified. " +
                "Have you added a fetch event listener that responds with a Response?", "upstream");
        }
        request.headers.delete("host");
        const response = (await node_fetch_1.default(request));
        response.waitUntil = waitUntil;
        return response;
    }
    async [exports.dispatchScheduledSymbol](scheduledTime, cron) {
        const event = new ScheduledEvent(scheduledTime !== null && scheduledTime !== void 0 ? scheduledTime : Date.now(), cron !== null && cron !== void 0 ? cron : "");
        this.dispatchEvent(event);
        return (await Promise.all(event[exports.waitUntilSymbol]));
    }
}
exports.ServiceWorkerGlobalScope = ServiceWorkerGlobalScope;
class EventsModule extends module_1.Module {
    buildSandbox() {
        return {
            Event: event_target_shim_1.Event,
            EventTarget: event_target_shim_1.EventTarget,
            FetchEvent,
            ScheduledEvent,
        };
    }
}
exports.EventsModule = EventsModule;
//# sourceMappingURL=events.js.map