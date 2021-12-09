"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryKVStorage = void 0;
const helpers_1 = require("../helpers");
const storage_1 = require("./storage");
class MemoryKVStorage extends storage_1.KVStorage {
    constructor(map = new Map(), clock = helpers_1.defaultClock) {
        super();
        this.map = map;
        this.clock = clock;
    }
    expired(key, meta, time) {
        if (meta === undefined)
            meta = this.map.get(key);
        if (time === undefined)
            time = helpers_1.millisToSeconds(this.clock());
        if ((meta === null || meta === void 0 ? void 0 : meta.expiration) !== undefined && meta.expiration <= time) {
            this.map.delete(key);
            return true;
        }
        return false;
    }
    async has(key) {
        if (this.expired(key))
            return false;
        return this.map.has(key);
    }
    async get(key) {
        const value = this.map.get(key);
        if (this.expired(key, value))
            return undefined;
        return value;
    }
    async put(key, value) {
        this.map.set(key, value);
    }
    async delete(key) {
        if (this.expired(key))
            return false;
        return this.map.delete(key);
    }
    async list({ prefix, keysFilter } = {}) {
        const time = helpers_1.millisToSeconds(this.clock());
        const keys = Array.from(this.map.entries())
            .filter(([name, value]) => {
            if (prefix !== undefined && !name.startsWith(prefix))
                return false;
            return !this.expired(name, value, time);
        })
            .map(([name, { expiration, metadata }]) => ({
            name,
            expiration,
            metadata,
        }));
        return keysFilter ? keysFilter(keys) : keys;
    }
}
exports.MemoryKVStorage = MemoryKVStorage;
//# sourceMappingURL=memory.js.map