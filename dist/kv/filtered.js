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
var _FilteredKVStorageNamespace_instances, _FilteredKVStorageNamespace_options, _FilteredKVStorageNamespace_isIncluded;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilteredKVStorageNamespace = void 0;
const namespace_1 = require("./namespace");
class FilteredKVStorageNamespace extends namespace_1.KVStorageNamespace {
    constructor(storage, options = {}, clock) {
        super(storage, clock);
        _FilteredKVStorageNamespace_instances.add(this);
        _FilteredKVStorageNamespace_options.set(this, void 0);
        __classPrivateFieldSet(this, _FilteredKVStorageNamespace_options, options, "f");
    }
    async get(key, options) {
        return (await this.getWithMetadata(key, options)).value;
    }
    async getWithMetadata(key, options) {
        if (!__classPrivateFieldGet(this, _FilteredKVStorageNamespace_instances, "m", _FilteredKVStorageNamespace_isIncluded).call(this, key))
            return { value: null, metadata: null };
        return super.getWithMetadata(key, options);
    }
    async put(key, value, options) {
        if (__classPrivateFieldGet(this, _FilteredKVStorageNamespace_options, "f").readOnly) {
            throw new TypeError("Unable to put into read-only namespace");
        }
        return super.put(key, value, options);
    }
    async delete(key) {
        if (__classPrivateFieldGet(this, _FilteredKVStorageNamespace_options, "f").readOnly) {
            throw new TypeError("Unable to delete from read-only namespace");
        }
        return super.delete(key);
    }
    async list(options) {
        const { keys, list_complete, cursor } = await super.list(options);
        return {
            keys: keys.filter((key) => __classPrivateFieldGet(this, _FilteredKVStorageNamespace_instances, "m", _FilteredKVStorageNamespace_isIncluded).call(this, key.name)),
            list_complete,
            cursor,
        };
    }
}
exports.FilteredKVStorageNamespace = FilteredKVStorageNamespace;
_FilteredKVStorageNamespace_options = new WeakMap(), _FilteredKVStorageNamespace_instances = new WeakSet(), _FilteredKVStorageNamespace_isIncluded = function _FilteredKVStorageNamespace_isIncluded(key) {
    var _a, _b;
    if ((_a = __classPrivateFieldGet(this, _FilteredKVStorageNamespace_options, "f").include) === null || _a === void 0 ? void 0 : _a.length) {
        return __classPrivateFieldGet(this, _FilteredKVStorageNamespace_options, "f").include.some((regexp) => key.match(regexp));
    }
    if ((_b = __classPrivateFieldGet(this, _FilteredKVStorageNamespace_options, "f").exclude) === null || _b === void 0 ? void 0 : _b.length) {
        return !__classPrivateFieldGet(this, _FilteredKVStorageNamespace_options, "f").exclude.some((regexp) => key.match(regexp));
    }
    return true;
};
//# sourceMappingURL=filtered.js.map