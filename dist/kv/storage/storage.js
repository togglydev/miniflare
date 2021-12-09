"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KVStorage = void 0;
class KVStorage {
    // Batch functions, default implementations may be overridden to optimise
    async hasMany(keys) {
        let count = 0;
        for (const key of keys)
            if (await this.has(key))
                count++;
        return count;
    }
    async getMany(keys, skipMetadata) {
        const values = new Array(keys.length);
        for (let i = 0; i < keys.length; i++) {
            values[i] = await this.get(keys[i], skipMetadata);
        }
        return values;
    }
    async putMany(data) {
        for (const [key, value] of data)
            await this.put(key, value);
    }
    async deleteMany(keys) {
        let count = 0;
        for (const key of keys)
            if (await this.delete(key))
                count++;
        return count;
    }
}
exports.KVStorage = KVStorage;
//# sourceMappingURL=storage.js.map