"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mutex = exports.KVStorageFactory = exports.millisToSeconds = exports.defaultClock = exports.intersects = exports.sanitise = void 0;
const assert_1 = __importDefault(require("assert"));
const path_1 = __importDefault(require("path"));
const ioredis_1 = __importDefault(require("ioredis"));
const sanitize_filename_1 = __importDefault(require("sanitize-filename"));
const storage_1 = require("./storage");
const redis_1 = require("./storage/redis");
function sanitise(fileName) {
    return sanitize_filename_1.default(fileName, { replacement: "_" });
}
exports.sanitise = sanitise;
function intersects(a, b) {
    for (const value of a) {
        if (b.has(value))
            return true;
    }
    return false;
}
exports.intersects = intersects;
const defaultClock = () => Date.now();
exports.defaultClock = defaultClock;
function millisToSeconds(millis) {
    return Math.floor(millis / 1000);
}
exports.millisToSeconds = millisToSeconds;
const redisConnectionStringRegexp = /^rediss?:\/\//;
class KVStorageFactory {
    constructor(defaultPersistRoot, 
    // Store memory KV storages for persistence across options reloads
    memoryStorages = new Map(), 
    // Store Redis connections across options reloads
    redisConnections = new Map()) {
        this.defaultPersistRoot = defaultPersistRoot;
        this.memoryStorages = memoryStorages;
        this.redisConnections = redisConnections;
    }
    getStorage(namespace, persist) {
        // Handle boolean persist by setting persist to defaultPersistRoot if it's
        // true, or undefined if it's false
        persist = persist === true ? this.defaultPersistRoot : persist || undefined;
        if (persist) {
            if (persist.match(redisConnectionStringRegexp)) {
                // If the persist option is a redis connection string, use Redis storage
                let connection = this.redisConnections.get(persist);
                if (!connection) {
                    // TODO: (low priority) maybe allow redis options to be configured?
                    this.redisConnections.set(persist, (connection = new ioredis_1.default(persist)));
                }
                return new redis_1.RedisKVStorage(namespace, connection);
            }
            else {
                // Otherwise, use file-system storage
                const root = path_1.default.join(persist, sanitise(namespace));
                return new storage_1.FileKVStorage(root);
            }
        }
        else {
            // Otherwise, use in-memory storage
            let storage = this.memoryStorages.get(namespace);
            if (storage)
                return storage;
            this.memoryStorages.set(namespace, (storage = new storage_1.MemoryKVStorage()));
            return storage;
        }
    }
    dispose() {
        for (const connection of this.redisConnections.values()) {
            connection.disconnect();
        }
    }
}
exports.KVStorageFactory = KVStorageFactory;
class Mutex {
    constructor() {
        this.locked = false;
        this.resolveQueue = [];
    }
    lock() {
        if (!this.locked) {
            this.locked = true;
            return Promise.resolve();
        }
        return new Promise((resolve) => this.resolveQueue.push(resolve));
    }
    unlock() {
        var _a;
        assert_1.default(this.locked);
        if (this.resolveQueue.length > 0) {
            (_a = this.resolveQueue.shift()) === null || _a === void 0 ? void 0 : _a();
        }
        else {
            this.locked = false;
        }
    }
    async run(closure) {
        await this.lock();
        try {
            return await closure();
        }
        finally {
            this.unlock();
        }
    }
}
exports.Mutex = Mutex;
//# sourceMappingURL=helpers.js.map