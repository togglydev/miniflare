"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KVModule = void 0;
const path_1 = __importDefault(require("path"));
const kv_1 = require("../kv");
const helpers_1 = require("../kv/helpers");
const module_1 = require("./module");
const defaultPersistRoot = path_1.default.resolve(".mf", "kv");
class KVModule extends module_1.Module {
    constructor(log, storageFactory = new helpers_1.KVStorageFactory(defaultPersistRoot)) {
        super(log);
        this.storageFactory = storageFactory;
    }
    getNamespace(namespace, persist) {
        return new kv_1.KVStorageNamespace(this.storageFactory.getStorage(namespace, persist));
    }
    buildEnvironment(options) {
        var _a;
        const environment = {};
        for (const namespace of (_a = options.kvNamespaces) !== null && _a !== void 0 ? _a : []) {
            environment[namespace] = this.getNamespace(namespace, options.kvPersist);
        }
        return environment;
    }
    dispose() {
        this.storageFactory.dispose();
    }
}
exports.KVModule = KVModule;
//# sourceMappingURL=kv.js.map