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
var _DurableObjectTransaction_instances, _DurableObjectTransaction_storage, _DurableObjectTransaction_get, _DurableObjectStorage_txnCount, _DurableObjectStorage_txnWriteSets, _DurableObjectStorage_mutex, _DurableObjectStorage_abortedAll, _DurableObjectStorage_storage;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DurableObjectStorage = exports.abortAllSymbol = exports.transactionValidateWriteSymbol = exports.transactionReadSymbol = exports.DurableObjectTransaction = void 0;
const assert_1 = __importDefault(require("assert"));
const typeson_1 = __importDefault(require("typeson"));
// @ts-expect-error typeson-registry doesn't have types
const structured_cloning_throwing_1 = __importDefault(require("typeson-registry/dist/presets/structured-cloning-throwing"));
const helpers_1 = require("./helpers");
const collator = new Intl.Collator();
const TSON = new typeson_1.default().register(structured_cloning_throwing_1.default);
// Durable Object transactions are implemented using Optimistic Concurrency
// Control as described in https://dl.acm.org/doi/10.1145/319566.319567.
// The toy implementation here https://github.com/mwhittaker/occ is also very
// helpful.
const internalsSymbol = Symbol("internals");
// Class containing everything related to DurableObjectTransactions that needs
// to be accessible to DurableObjectStorage
class DurableObjectTransactionInternals {
    constructor(startTxnCount) {
        this.startTxnCount = startTxnCount;
        this.readSet = new Set();
        this.copies = new Map();
        this.rolledback = false;
    }
    get writeSet() {
        return new Set(this.copies.keys());
    }
}
class DurableObjectTransaction {
    constructor(storage, startTxnCount) {
        _DurableObjectTransaction_instances.add(this);
        _DurableObjectTransaction_storage.set(this, void 0);
        __classPrivateFieldSet(this, _DurableObjectTransaction_storage, storage, "f");
        this[internalsSymbol] = new DurableObjectTransactionInternals(startTxnCount);
    }
    async get(keys) {
        assert_1.default(!this[internalsSymbol].rolledback);
        if (Array.isArray(keys)) {
            // If array of keys passed, build map of results
            const res = new Map();
            const values = await __classPrivateFieldGet(this, _DurableObjectTransaction_instances, "m", _DurableObjectTransaction_get).call(this, keys);
            assert_1.default.strictEqual(values.length, keys.length);
            for (let i = 0; i < keys.length; i++) {
                const value = values[i];
                if (value)
                    res.set(keys[i], TSON.parse(value.toString("utf8")));
            }
            return res;
        }
        else {
            // Otherwise, return a single result
            const value = (await __classPrivateFieldGet(this, _DurableObjectTransaction_instances, "m", _DurableObjectTransaction_get).call(this, [keys]))[0];
            return value ? TSON.parse(value.toString("utf8")) : undefined;
        }
    }
    async put(entries, value) {
        const internals = this[internalsSymbol];
        assert_1.default(!internals.rolledback);
        // If a single key/value pair was passed, normalise it to an object
        if (typeof entries === "string") {
            assert_1.default(value !== undefined);
            entries = { [entries]: value };
        }
        // Update shadow copies for each entry, and record operation in write log
        for (const [key, rawValue] of Object.entries(entries)) {
            const value = Buffer.from(TSON.stringify(rawValue), "utf8");
            internals.copies.set(key, value);
        }
    }
    async delete(keys) {
        const internals = this[internalsSymbol];
        assert_1.default(!internals.rolledback);
        // Record whether an array was passed so we know what to return at the end
        const arrayKeys = Array.isArray(keys);
        // Normalise keys argument to string array
        if (!Array.isArray(keys))
            keys = [keys];
        // Delete shadow copies for each entry, and record operation in write log
        const deleted = await __classPrivateFieldGet(this, _DurableObjectTransaction_storage, "f").hasMany(keys);
        for (const key of keys) {
            internals.readSet.add(key);
            internals.copies.set(key, undefined);
        }
        return arrayKeys ? deleted : deleted > 0;
    }
    // TODO: (low priority) implement this properly, our semantics are slightly
    //  different to Cloudflare's:
    //  https://developers.cloudflare.com/workers/runtime-apis/durable-objects#methods
    async deleteAll() {
        assert_1.default(!this[internalsSymbol].rolledback);
        // Delete all existing keys
        // TODO: (low priority) think about whether it's correct to use list() here,
        //  what if a transaction adding a new key commits before this commits?
        const keys = (await __classPrivateFieldGet(this, _DurableObjectTransaction_storage, "f").list()).map(({ name }) => name);
        await this.delete(keys);
    }
    async list(options) {
        assert_1.default(!this[internalsSymbol].rolledback);
        // Get all matching key names, sorted
        const direction = (options === null || options === void 0 ? void 0 : options.reverse) ? -1 : 1;
        const keys = await __classPrivateFieldGet(this, _DurableObjectTransaction_storage, "f").list({
            skipMetadata: true,
            prefix: options === null || options === void 0 ? void 0 : options.prefix,
            keysFilter(keys) {
                keys = keys
                    .filter(({ name }) => {
                    return !(((options === null || options === void 0 ? void 0 : options.start) && collator.compare(name, options.start) < 0) ||
                        ((options === null || options === void 0 ? void 0 : options.end) && collator.compare(name, options.end) >= 0));
                })
                    .sort((a, b) => direction * collator.compare(a.name, b.name));
                // Truncate keys to the limit if one is specified
                if (options === null || options === void 0 ? void 0 : options.limit)
                    keys = keys.slice(0, options.limit);
                return keys;
            },
        });
        // Get keys' values
        return this.get(keys.map(({ name }) => name));
    }
    rollback() {
        const internals = this[internalsSymbol];
        assert_1.default(!internals.rolledback);
        internals.rolledback = true;
    }
}
exports.DurableObjectTransaction = DurableObjectTransaction;
_DurableObjectTransaction_storage = new WeakMap(), _DurableObjectTransaction_instances = new WeakSet(), _DurableObjectTransaction_get = async function _DurableObjectTransaction_get(keys) {
    var _a;
    const internals = this[internalsSymbol];
    const buffers = Array(keys.length);
    // Keys and indices of keys to batch get from storage
    const storageGetKeys = [];
    const storageGetIndices = [];
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        internals.readSet.add(key);
        if (internals.copies.has(key)) {
            // Value may be undefined if key deleted so need explicit has
            buffers[i] = internals.copies.get(key);
        }
        else {
            storageGetKeys.push(key);
            storageGetIndices.push(i);
        }
    }
    // Batch get keys from storage, ignoring metadata
    assert_1.default.strictEqual(storageGetKeys.length, storageGetIndices.length);
    const res = await __classPrivateFieldGet(this, _DurableObjectTransaction_storage, "f").getMany(storageGetKeys, true);
    assert_1.default.strictEqual(storageGetKeys.length, res.length);
    for (let i = 0; i < storageGetKeys.length; i++) {
        buffers[storageGetIndices[i]] = (_a = res[i]) === null || _a === void 0 ? void 0 : _a.value;
    }
    return buffers;
};
// Maximum size of _txnWriteSets map for validation, this is basically the
// maximum number of concurrent transactions we expect to be running on a single
// storage instance
const txnMapSize = 16;
// Private methods of DurableObjectStorage exposed for testing
exports.transactionReadSymbol = Symbol("transactionRead");
exports.transactionValidateWriteSymbol = Symbol("transactionValidateAndWrite");
// Private method of DurableObjectStorage exposed for module
exports.abortAllSymbol = Symbol("abortAll");
class DurableObjectStorage {
    constructor(storage) {
        _DurableObjectStorage_txnCount.set(this, 0);
        _DurableObjectStorage_txnWriteSets.set(this, new Map());
        _DurableObjectStorage_mutex.set(this, new helpers_1.Mutex());
        _DurableObjectStorage_abortedAll.set(this, false);
        _DurableObjectStorage_storage.set(this, void 0);
        __classPrivateFieldSet(this, _DurableObjectStorage_storage, storage, "f");
    }
    async [(_DurableObjectStorage_txnCount = new WeakMap(), _DurableObjectStorage_txnWriteSets = new WeakMap(), _DurableObjectStorage_mutex = new WeakMap(), _DurableObjectStorage_abortedAll = new WeakMap(), _DurableObjectStorage_storage = new WeakMap(), exports.transactionReadSymbol)](closure) {
        // 1. Read Phase
        const txn = new DurableObjectTransaction(__classPrivateFieldGet(this, _DurableObjectStorage_storage, "f"), __classPrivateFieldGet(this, _DurableObjectStorage_txnCount, "f"));
        const result = await closure(txn);
        return { txn, result };
    }
    async [exports.transactionValidateWriteSymbol](txn) {
        // This function returns false iff the transaction should be retried
        const internals = txn[internalsSymbol];
        // Don't commit if rolledback or aborted all
        if (internals.rolledback || __classPrivateFieldGet(this, _DurableObjectStorage_abortedAll, "f"))
            return true;
        // Mutex needed as write phase is asynchronous and these phases need to be
        // performed as a critical section
        // TODO: consider moving lock to KVStorage, then using database/file locks,
        //  would also need to move all storage state there (txnCount, txnWriteSets)
        return __classPrivateFieldGet(this, _DurableObjectStorage_mutex, "f").run(async () => {
            // 2. Validate Phase
            const finishTxnCount = __classPrivateFieldGet(this, _DurableObjectStorage_txnCount, "f");
            for (let t = internals.startTxnCount + 1; t <= finishTxnCount; t++) {
                const otherWriteSet = __classPrivateFieldGet(this, _DurableObjectStorage_txnWriteSets, "f").get(t);
                if (!otherWriteSet || helpers_1.intersects(otherWriteSet, internals.readSet)) {
                    return false;
                }
            }
            // 3. Write Phase
            const putEntries = [];
            const deleteKeys = [];
            for (const [key, value] of internals.copies.entries()) {
                if (value) {
                    putEntries.push([key, { value }]);
                }
                else {
                    deleteKeys.push(key);
                }
            }
            if (putEntries.length > 0)
                await __classPrivateFieldGet(this, _DurableObjectStorage_storage, "f").putMany(putEntries);
            if (deleteKeys.length > 0)
                await __classPrivateFieldGet(this, _DurableObjectStorage_storage, "f").deleteMany(deleteKeys);
            __classPrivateFieldSet(this, _DurableObjectStorage_txnCount, +__classPrivateFieldGet(this, _DurableObjectStorage_txnCount, "f") + 1, "f");
            __classPrivateFieldGet(this, _DurableObjectStorage_txnWriteSets, "f").set(__classPrivateFieldGet(this, _DurableObjectStorage_txnCount, "f"), internals.writeSet);
            // Keep _txnWriteSets.size <= txnMapSize (if deleted key is negative,
            // i.e. transaction never existed, map delete won't do anything)
            __classPrivateFieldGet(this, _DurableObjectStorage_txnWriteSets, "f").delete(__classPrivateFieldGet(this, _DurableObjectStorage_txnCount, "f") - txnMapSize);
            return true;
        });
    }
    [exports.abortAllSymbol]() {
        __classPrivateFieldSet(this, _DurableObjectStorage_abortedAll, true, "f");
    }
    async transaction(closure) {
        // TODO: (low priority) maybe throw exception after n retries?
        while (true) {
            const { txn, result } = await this[exports.transactionReadSymbol](closure);
            if (await this[exports.transactionValidateWriteSymbol](txn))
                return result;
        }
    }
    get(key) {
        return this.transaction((txn) => txn.get(key));
    }
    put(keyEntries, value) {
        return this.transaction((txn) => txn.put(keyEntries, value));
    }
    delete(key) {
        return this.transaction((txn) => txn.delete(key));
    }
    deleteAll() {
        return this.transaction((txn) => txn.deleteAll());
    }
    list(options) {
        return this.transaction((txn) => txn.list(options));
    }
}
exports.DurableObjectStorage = DurableObjectStorage;
//# sourceMappingURL=do.js.map