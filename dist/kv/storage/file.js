"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileKVStorage = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const helpers_1 = require("../helpers");
const storage_1 = require("./storage");
function onNotFound(promise, value) {
    return promise.catch((e) => {
        if (e.code === "ENOENT")
            return value;
        throw e;
    });
}
function readFile(filePath, decode) {
    return onNotFound(fs_1.promises.readFile(filePath, decode && "utf8"), undefined);
}
async function writeFile(filePath, data) {
    await fs_1.promises.mkdir(path_1.default.dirname(filePath), { recursive: true });
    await fs_1.promises.writeFile(filePath, data, typeof data === "string" ? "utf8" : undefined);
}
function deleteFile(filePath) {
    return onNotFound(fs_1.promises.unlink(filePath).then(() => true), false);
}
function readDir(filePath) {
    return onNotFound(fs_1.promises.readdir(filePath), []);
}
async function walkDir(rootPath) {
    const files = [];
    const fileNames = await readDir(rootPath);
    for (const fileName of fileNames) {
        const filePath = path_1.default.join(rootPath, fileName);
        if ((await fs_1.promises.stat(filePath)).isDirectory()) {
            // Recurse into this subdirectory, adding all it's paths
            files.push(...(await walkDir(filePath)));
        }
        else {
            files.push(filePath);
        }
    }
    return files;
}
const metaSuffix = ".meta.json";
class FileKVStorage extends storage_1.KVStorage {
    constructor(root, 
    // Allow sanitisation to be disabled for read-only Workers Site's namespaces
    //  so paths containing /'s resolve correctly
    sanitise = true, clock = helpers_1.defaultClock) {
        super();
        this.sanitise = sanitise;
        this.clock = clock;
        this.root = path_1.default.resolve(root);
    }
    // noinspection JSMethodCanBeStatic
    async getMeta(filePath) {
        // Try to get file metadata, if it doesn't exist, assume no expiration or
        // metadata, otherwise JSON parse it and use it
        const metadataValue = await readFile(filePath + metaSuffix, true);
        if (metadataValue) {
            return JSON.parse(metadataValue);
        }
        else {
            return {};
        }
    }
    async expired(filePath, meta, time) {
        if (meta === undefined)
            meta = await this.getMeta(filePath);
        if (time === undefined)
            time = helpers_1.millisToSeconds(this.clock());
        if (meta.expiration !== undefined && meta.expiration <= time) {
            await this.deleteFiles(filePath);
            return true;
        }
        return false;
    }
    keyFilePath(key) {
        const sanitisedKey = this.sanitise ? helpers_1.sanitise(key) : key;
        return [path_1.default.join(this.root, sanitisedKey), sanitisedKey !== key];
    }
    async has(key) {
        // Check if file exists
        const [filePath] = this.keyFilePath(key);
        if (await this.expired(filePath))
            return false;
        return fs_1.existsSync(filePath);
    }
    async get(key) {
        // Try to get file data, if it doesn't exist, the key doesn't either
        const [filePath] = this.keyFilePath(key);
        const value = await readFile(filePath);
        if (!value)
            return undefined;
        const meta = await this.getMeta(filePath);
        if (await this.expired(filePath, meta))
            return undefined;
        return { ...meta, value };
    }
    async put(key, { value, expiration, metadata }) {
        // Write value to file
        const [filePath, sanitised] = this.keyFilePath(key);
        await writeFile(filePath, value);
        // Write metadata to file if there is any, otherwise delete old metadata,
        // also storing key if it was sanitised so list results are correct
        const metaFilePath = filePath + metaSuffix;
        if (expiration !== undefined || metadata !== undefined || sanitised) {
            await writeFile(metaFilePath, JSON.stringify({ key, expiration, metadata }));
        }
        else {
            await deleteFile(metaFilePath);
        }
    }
    // noinspection JSMethodCanBeStatic
    async deleteFiles(filePath) {
        const existed = await deleteFile(filePath);
        await deleteFile(filePath + metaSuffix);
        return existed;
    }
    async delete(key) {
        // Delete value file and associated metadata
        const [filePath] = this.keyFilePath(key);
        if (await this.expired(filePath))
            return false;
        return this.deleteFiles(filePath);
    }
    async list({ prefix, keysFilter } = {}) {
        var _a;
        const time = helpers_1.millisToSeconds(this.clock());
        const keys = [];
        const filePaths = await walkDir(this.root);
        for (const filePath of filePaths) {
            // Get key name by removing root directory & path separator
            // (we can do this as this.root is fully-resolved in the constructor)
            const name = filePath.substring(this.root.length + 1);
            // Ignore meta files
            if (filePath.endsWith(metaSuffix))
                continue;
            // Try to get file meta
            const meta = await this.getMeta(filePath);
            // Get the real unsanitised key if it exists
            const realName = (_a = meta === null || meta === void 0 ? void 0 : meta.key) !== null && _a !== void 0 ? _a : name;
            // Ignore keys not matching the prefix if it's defined
            if (prefix !== undefined && !realName.startsWith(prefix))
                continue;
            // Ignore expired keys
            if (await this.expired(filePath, meta, time))
                continue;
            keys.push({
                name: realName,
                expiration: meta.expiration,
                metadata: meta.metadata,
            });
        }
        return keysFilter ? keysFilter(keys) : keys;
    }
}
exports.FileKVStorage = FileKVStorage;
//# sourceMappingURL=file.js.map