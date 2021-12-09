/// <reference types="node" />
import { KVClock } from "../helpers";
import { KVStorage, KVStorageListOptions, KVStoredKey, KVStoredValue } from "./storage";
export declare class MemoryKVStorage extends KVStorage {
    private map;
    private clock;
    constructor(map?: Map<string, KVStoredValue<Buffer>>, clock?: KVClock);
    private expired;
    has(key: string): Promise<boolean>;
    get(key: string): Promise<KVStoredValue | undefined>;
    put(key: string, value: KVStoredValue): Promise<void>;
    delete(key: string): Promise<boolean>;
    list({ prefix, keysFilter }?: KVStorageListOptions): Promise<KVStoredKey[]>;
}
