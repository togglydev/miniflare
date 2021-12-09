"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisKVStorage = void 0;
const assert_1 = __importDefault(require("assert"));
const helpers_1 = require("../helpers");
const storage_1 = require("./storage");
class RedisKVStorage extends storage_1.KVStorage {
    constructor(
    // Exposed for testing
    namespace, redis) {
        super();
        this.namespace = namespace;
        this.redis = redis;
        // Bind key and metaKey so we can use them in map later
        this.boundKey = this.key.bind(this);
        this.boundMetaKey = this.metaKey.bind(this);
    }
    // Store keys and metadata with different prefixes so scanning for keys only
    // returns one, and we can fetch metadata separately for listing
    key(key) {
        return `${this.namespace}:value:${key}`;
    }
    metaKey(key) {
        return `${this.namespace}:meta:${key}`;
    }
    // Throws any errors from the result of a pipeline
    // noinspection JSMethodCanBeStatic
    throwPipelineErrors(res) {
        for (const [error] of res)
            if (error)
                throw error;
    }
    async has(key) {
        return (await this.redis.exists(this.key(key))) > 0;
    }
    async hasMany(keys) {
        if (keys.length === 0)
            return 0;
        return await this.redis.exists(...keys.map(this.boundKey));
    }
    async get(key, skipMetadata) {
        if (skipMetadata) {
            // If we don't need metadata, we can just get the value, Redis will handle
            // expiry
            const value = await this.redis.getBuffer(this.key(key));
            return value === null ? undefined : { value };
        }
        else {
            // If we do, pipeline get the value, metadata and expiration TTL. Ideally,
            // we'd use EXPIRETIME here but it was added in Redis 7 so support
            // wouldn't be great: https://redis.io/commands/expiretime
            const res = await this.redis
                .pipeline()
                .getBuffer(this.key(key))
                .get(this.metaKey(key))
                .pttl(this.key(key))
                .exec();
            // Assert pipeline returned expected number of results successfully
            assert_1.default.strictEqual(res.length, 3);
            this.throwPipelineErrors(res);
            // Extract pipeline results
            const value = res[0][1];
            const meta = res[1][1];
            const ttl = res[2][1];
            // Return result
            if (value === null)
                return undefined;
            return {
                value,
                metadata: meta ? JSON.parse(meta) : undefined,
                // Used PTTL so ttl is in milliseconds, negative TTL means key didn't
                // exist or no expiration
                expiration: ttl >= 0 ? helpers_1.millisToSeconds(Date.now() + ttl) : undefined,
            };
        }
    }
    async getMany(keys, skipMetadata) {
        if (keys.length === 0)
            return [];
        if (skipMetadata) {
            // If we don't need metadata, we can just get all the values, Redis will
            // handle expiry
            // @ts-expect-error mgetBuffer exists, it's just not in type definitions
            const values = await this.redis.mgetBuffer(...keys.map(this.boundKey));
            return values.map((value) => (value === null ? undefined : { value }));
        }
        else {
            // If we do, pipeline getting the value, then getting metadata, then
            // getting all expiration TTLs. Note there's no MPTTL command. Again,
            // ideally we'd use EXPIRETIME here.
            const redisKeys = keys.map(this.boundKey);
            const redisMetaKeys = keys.map(this.boundMetaKey);
            let pipeline = this.redis
                .pipeline()
                // @ts-expect-error mgetBuffer exists, it's just not in type definitions
                .mgetBuffer(...redisKeys)
                .mget(...redisMetaKeys);
            for (const redisKey of redisKeys)
                pipeline = pipeline.pttl(redisKey);
            const res = await pipeline.exec();
            // Assert pipeline returned expected number of results successfully:
            // 2 (mgetBuffer + mget) + |keys| (pttl)
            assert_1.default.strictEqual(res.length, 2 + keys.length);
            this.throwPipelineErrors(res);
            // Extract pipeline results
            const values = res[0][1];
            const metas = res[1][1];
            // Should have value and meta for each key, even if null
            assert_1.default.strictEqual(values.length, keys.length);
            assert_1.default.strictEqual(metas.length, keys.length);
            // Return result
            const now = Date.now();
            const result = new Array(keys.length);
            for (let i = 0; i < keys.length; i++) {
                // Extract pipeline results (`2 +` for ttl is for getting past
                // mgetBuffer + mget)
                const value = values[i];
                const meta = metas[i];
                const ttl = res[2 + i][1];
                if (value === null) {
                    result[i] = undefined;
                }
                else {
                    result[i] = {
                        value,
                        metadata: meta ? JSON.parse(meta) : undefined,
                        // Used PTTL so ttl is in milliseconds, negative TTL means key
                        // didn't exist or no expiration
                        expiration: ttl >= 0 ? helpers_1.millisToSeconds(now + ttl) : undefined,
                    };
                }
            }
            return result;
        }
    }
    async put(key, value) {
        // Might as well pipeline put as may need to set metadata too and reduces
        // code duplication
        await this.putMany([[key, value]]);
    }
    async putMany(data) {
        // PX expiry mode is millisecond TTL. Ideally, we'd use EXAT as the mode
        // here instead, but it was added in Redis 6.2 so support wouldn't be great:
        // https://redis.io/commands/set#history
        const now = Date.now();
        let pipeline = this.redis.pipeline();
        for (const [key, value] of data) {
            const redisKey = this.key(key);
            // Work out millisecond TTL if defined (there are probably some rounding
            // errors here, but we'll only be off by a second so it's hopefully ok)
            const expiry = value.expiration
                ? value.expiration * 1000 - now
                : undefined;
            if (expiry) {
                pipeline = pipeline.set(redisKey, value.value, "PX", expiry);
            }
            else {
                pipeline = pipeline.set(redisKey, value.value);
            }
            if (value.metadata) {
                // Only store metadata if defined
                const redisMetaKey = this.metaKey(key);
                const json = JSON.stringify(value.metadata);
                if (expiry) {
                    pipeline = pipeline.set(redisMetaKey, json, "PX", expiry);
                }
                else {
                    pipeline = pipeline.set(redisMetaKey, json);
                }
            }
        }
        // Assert pipeline completed successfully
        const res = await pipeline.exec();
        this.throwPipelineErrors(res);
    }
    async delete(key) {
        // Delete the key and associated metadata
        const deleted = await this.redis.del(this.key(key), this.metaKey(key));
        // If we managed to delete a key, return true (we shouldn't ever be able
        // to just delete the metadata)
        return deleted > 0;
    }
    async deleteMany(keys) {
        if (keys.length === 0)
            return 0;
        // Delete the keys and their associated metadata. Do this separately so we
        // can work out the number of actual keys we deleted, as not all keys will
        // have metadata.
        const res = await this.redis
            .pipeline()
            .del(...keys.map(this.boundKey))
            .del(...keys.map(this.boundMetaKey))
            .exec();
        // Assert pipeline returned expected number of results successfully
        assert_1.default.strictEqual(res.length, 2);
        this.throwPipelineErrors(res);
        // Return number of real keys deleted
        return res[0][1];
    }
    async list({ prefix, keysFilter, skipMetadata, } = {}) {
        // Get the `NAMESPACE:value:` Redis key prefix so we can remove it
        const redisKeyPrefix = this.key("");
        // Scan all keys matching the prefix. This is quite inefficient but it would
        // be difficult to encode KV and Durable Object pagination in a Redis scan.
        let keys = await new Promise((resolve) => {
            const keys = [];
            const stream = this.redis.scanStream({
                // Always match the Redis key prefix, optionally match a user-specified
                // one too
                match: `${redisKeyPrefix}${prefix !== null && prefix !== void 0 ? prefix : ""}*`,
                // TODO: (low priority) consider increasing page size a bit
            });
            stream.on("data", (page) => {
                keys.push(...page.map((key) => ({
                    // Remove the Redis key prefix from each scanned key
                    name: key.substring(redisKeyPrefix.length),
                })));
            });
            // Resolve the promise once we've fetched all matching keys
            stream.on("end", () => resolve(keys));
        });
        // Apply KV/Durable Object specific filtering
        keys = keysFilter ? keysFilter(keys) : keys;
        // If we don't need metadata (Durable Objects), return now and save fetching
        // it all
        if (skipMetadata || keys.length === 0)
            return keys;
        // Fetch the metadata for the remaining keys. Note that we're not fetching
        // metadata for all keys originally matching the prefix, just the ones we're
        // going to return from the list after the filter.
        const redisMetaKeys = keys.map(({ name }) => this.metaKey(name));
        // Pipeline getting metadata and all expiration TTLs. Again, note there's no
        // MPTTL command and ideally we'd use EXPIRETIME here.
        let pipeline = this.redis.pipeline().mget(...redisMetaKeys);
        for (const key of keys)
            pipeline = pipeline.pttl(this.key(key.name));
        const res = await pipeline.exec();
        // Assert pipeline returned expected number of results successfully:
        // 1 (mget) + |keys| (pttl)
        assert_1.default.strictEqual(res.length, 1 + keys.length);
        this.throwPipelineErrors(res);
        // Extract pipeline results
        const metas = res[0][1];
        assert_1.default.strictEqual(metas.length, keys.length);
        // Populate keys with metadata and expiration
        const now = Date.now();
        for (let i = 0; i < keys.length; i++) {
            // Extract pipeline results (`1 +` for ttl is for getting past mget)
            const meta = metas[i];
            const ttl = res[1 + i][1];
            keys[i].metadata = meta ? JSON.parse(meta) : undefined;
            // Used PTTL so ttl is in milliseconds, negative TTL means key
            // didn't exist or no expiration
            keys[i].expiration = ttl >= 0 ? helpers_1.millisToSeconds(now + ttl) : undefined;
        }
        return keys;
    }
}
exports.RedisKVStorage = RedisKVStorage;
//# sourceMappingURL=redis.js.map