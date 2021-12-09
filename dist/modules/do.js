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
var _DurableObjectId_hexId, _DurableObjectStub_factory, _DurableObjectNamespace_objectName, _DurableObjectNamespace_factory;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DurableObjectsModule = exports.DurableObjectNamespace = exports.DurableObjectStub = exports.DurableObjectId = exports.DurableObjectState = void 0;
const assert_1 = __importDefault(require("assert"));
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const helpers_1 = require("../helpers");
const kv_1 = require("../kv");
const do_1 = require("../kv/do");
const helpers_2 = require("../kv/helpers");
const module_1 = require("./module");
const standards_1 = require("./standards");
// Ideally we would store the storage on the DurableObject instance itself,
// but we don't know what the user's Durable Object code does, so we store it
// in a WeakMap instead. This means DurableObjectStorage instances can still be
// garbage collected if the corresponding DurableObject instance is.
const instancesStorage = new WeakMap();
class DurableObjectState {
    constructor(id, storage) {
        this.id = id;
        this.storage = storage;
    }
    waitUntil(_promise) { }
}
exports.DurableObjectState = DurableObjectState;
class DurableObjectId {
    constructor(hexId, name) {
        this.name = name;
        _DurableObjectId_hexId.set(this, void 0);
        __classPrivateFieldSet(this, _DurableObjectId_hexId, hexId, "f");
    }
    toString() {
        return __classPrivateFieldGet(this, _DurableObjectId_hexId, "f");
    }
}
exports.DurableObjectId = DurableObjectId;
_DurableObjectId_hexId = new WeakMap();
class DurableObjectStub {
    constructor(factory, id) {
        this.id = id;
        _DurableObjectStub_factory.set(this, void 0);
        __classPrivateFieldSet(this, _DurableObjectStub_factory, factory, "f");
    }
    get name() {
        return this.id.name;
    }
    async fetch(input, init) {
        const instance = await __classPrivateFieldGet(this, _DurableObjectStub_factory, "f").call(this, this.id);
        return instance.fetch(new standards_1.Request(input, init));
    }
    // Extra Miniflare-only API exposed for easier testing
    async storage() {
        const instance = await __classPrivateFieldGet(this, _DurableObjectStub_factory, "f").call(this, this.id);
        const storage = instancesStorage.get(instance);
        // #factory will make sure instance's storage is in instancesStorage
        assert_1.default(storage);
        return storage;
    }
}
exports.DurableObjectStub = DurableObjectStub;
_DurableObjectStub_factory = new WeakMap();
class DurableObjectNamespace {
    constructor(objectName, factory) {
        _DurableObjectNamespace_objectName.set(this, void 0);
        _DurableObjectNamespace_factory.set(this, void 0);
        __classPrivateFieldSet(this, _DurableObjectNamespace_objectName, objectName, "f");
        __classPrivateFieldSet(this, _DurableObjectNamespace_factory, factory, "f");
    }
    newUniqueId() {
        // Create new zero-filled 32 byte buffer
        const id = Buffer.alloc(32);
        // Leave first byte as 0, ensuring no intersection with named IDs
        // ...then write current time in 8 bytes
        id.writeBigUInt64BE(BigInt(Date.now()), 1);
        // ...then fill remaining 23 (32 - 8 - 1) bytes with random data
        crypto_1.default.randomFillSync(id, 9, 23);
        return new DurableObjectId(id.toString("hex"));
    }
    idFromName(name) {
        const id = crypto_1.default
            .createHash("sha256")
            .update(__classPrivateFieldGet(this, _DurableObjectNamespace_objectName, "f"))
            .update(name)
            .digest();
        // Force first bit to be 1, ensuring no intersection with unique IDs
        id[0] |= 128;
        return new DurableObjectId(id.toString("hex"), name);
    }
    idFromString(hexId) {
        return new DurableObjectId(hexId);
    }
    get(id) {
        return new DurableObjectStub(__classPrivateFieldGet(this, _DurableObjectNamespace_factory, "f"), id);
    }
}
exports.DurableObjectNamespace = DurableObjectNamespace;
_DurableObjectNamespace_objectName = new WeakMap(), _DurableObjectNamespace_factory = new WeakMap();
const defaultPersistRoot = path_1.default.resolve(".mf", "do");
class DurableObjectsModule extends module_1.Module {
    constructor(log, storageFactory = new helpers_2.KVStorageFactory(defaultPersistRoot)) {
        super(log);
        this.storageFactory = storageFactory;
        this._instances = new Map();
        this._constructors = {};
        this._environment = {};
        this._contextPromise = new Promise((resolve) => (this._contextResolve = resolve));
    }
    resetInstances() {
        // Abort all instance storage transactions and delete instances
        for (const instance of this._instances.values()) {
            const storage = instancesStorage.get(instance);
            assert_1.default(storage);
            storage[do_1.abortAllSymbol]();
        }
        this._instances.clear();
        this._contextPromise = new Promise((resolve) => (this._contextResolve = resolve));
    }
    setContext(constructors, environment) {
        var _a;
        this._constructors = constructors;
        this._environment = environment;
        (_a = this._contextResolve) === null || _a === void 0 ? void 0 : _a.call(this);
    }
    getNamespace(objectName, persist) {
        const factory = async (id) => {
            // Wait for constructors and environment
            await this._contextPromise;
            // Reuse existing instances
            const key = `${objectName}_${id.toString()}`;
            let instance = this._instances.get(key);
            if (instance)
                return instance;
            // Create and store new instance if none found
            const constructor = this._constructors[objectName];
            if (constructor === undefined) {
                throw new helpers_1.MiniflareError(`Missing constructor for Durable Object ${objectName}`);
            }
            const storage = new kv_1.DurableObjectStorage(this.storageFactory.getStorage(key, persist));
            const state = new DurableObjectState(id, storage);
            instance = new constructor(state, this._environment);
            this._instances.set(key, instance);
            instancesStorage.set(instance, storage);
            return instance;
        };
        return new DurableObjectNamespace(objectName, factory);
    }
    buildEnvironment(options) {
        var _a;
        const environment = {};
        for (const object of (_a = options.processedDurableObjects) !== null && _a !== void 0 ? _a : []) {
            environment[object.name] = this.getNamespace(object.name, options.durableObjectsPersist);
        }
        return environment;
    }
    dispose() {
        this.storageFactory.dispose();
    }
}
exports.DurableObjectsModule = DurableObjectsModule;
//# sourceMappingURL=do.js.map