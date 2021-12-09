import { KVClock } from "../helpers";
import { KVStorage, KVStorageListOptions, KVStoredKey, KVStoredValue } from "./storage";
export declare class FileKVStorage extends KVStorage {
    private sanitise;
    private clock;
    private readonly root;
    constructor(root: string, sanitise?: boolean, clock?: KVClock);
    private getMeta;
    private expired;
    private keyFilePath;
    has(key: string): Promise<boolean>;
    get(key: string): Promise<KVStoredValue | undefined>;
    put(key: string, { value, expiration, metadata }: KVStoredValue): Promise<void>;
    private deleteFiles;
    delete(key: string): Promise<boolean>;
    list({ prefix, keysFilter }?: KVStorageListOptions): Promise<KVStoredKey[]>;
}
