"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoOpCache = exports.Cache = exports.CacheModule = void 0;
const path_1 = __importDefault(require("path"));
const helpers_1 = require("../helpers");
const kv_1 = require("../kv");
Object.defineProperty(exports, "Cache", { enumerable: true, get: function () { return kv_1.Cache; } });
Object.defineProperty(exports, "NoOpCache", { enumerable: true, get: function () { return kv_1.NoOpCache; } });
const helpers_2 = require("../kv/helpers");
const module_1 = require("./module");
const defaultPersistRoot = path_1.default.resolve(".mf", "cache");
const defaultCacheName = "default";
const noopCache = new kv_1.NoOpCache();
class CacheModule extends module_1.Module {
    constructor(log, storageFactory = new helpers_2.KVStorageFactory(defaultPersistRoot)) {
        super(log);
        this.storageFactory = storageFactory;
    }
    getCache(name = defaultCacheName, persist) {
        return new kv_1.Cache(this.storageFactory.getStorage(name, persist));
    }
    buildSandbox(options) {
        const defaultCache = options.disableCache
            ? noopCache
            : this.getCache(undefined, options.cachePersist);
        return {
            caches: {
                default: defaultCache,
                open: async (name) => {
                    if (name === defaultCacheName) {
                        throw new helpers_1.MiniflareError(`\"${defaultCacheName}\" is a reserved cache name`);
                    }
                    return options.disableCache
                        ? noopCache
                        : this.getCache(name, options.cachePersist);
                },
            },
        };
    }
    dispose() {
        this.storageFactory.dispose();
    }
}
exports.CacheModule = CacheModule;
//# sourceMappingURL=cache.js.map