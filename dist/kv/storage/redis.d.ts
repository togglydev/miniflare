import { Commands } from "ioredis";
import { KVStorage, KVStorageListOptions, KVStoredKey, KVStoredValue } from "./storage";
export declare class RedisKVStorage extends KVStorage {
    readonly namespace: string;
    readonly redis: Commands;
    private readonly boundKey;
    private readonly boundMetaKey;
    constructor(namespace: string, redis: Commands);
    private key;
    private metaKey;
    private throwPipelineErrors;
    has(key: string): Promise<boolean>;
    hasMany(keys: string[]): Promise<number>;
    get(key: string, skipMetadata?: boolean): Promise<KVStoredValue | undefined>;
    getMany(keys: string[], skipMetadata?: boolean): Promise<(KVStoredValue | undefined)[]>;
    put(key: string, value: KVStoredValue): Promise<void>;
    putMany(data: [key: string, value: KVStoredValue][]): Promise<void>;
    delete(key: string): Promise<boolean>;
    deleteMany(keys: string[]): Promise<number>;
    list({ prefix, keysFilter, skipMetadata, }?: KVStorageListOptions): Promise<KVStoredKey[]>;
}
