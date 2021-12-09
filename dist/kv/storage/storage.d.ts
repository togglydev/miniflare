/// <reference types="node" />
export interface KVStoredValue<Value = Buffer> {
    value: Value;
    expiration?: number;
    metadata?: any;
}
export interface KVStoredKey {
    name: string;
    expiration?: number;
    metadata?: any;
}
export declare type KVStoredValueOnly = Pick<KVStoredValue, "value">;
export declare type KVStoredKeyOnly = Pick<KVStoredKey, "name">;
export interface KVStorageListOptions {
    skipMetadata?: boolean;
    prefix?: string;
    keysFilter?: (keys: KVStoredKey[]) => KVStoredKey[];
}
export declare abstract class KVStorage {
    abstract has(key: string): Promise<boolean>;
    abstract get(key: string, skipMetadata?: false): Promise<KVStoredValue | undefined>;
    abstract get(key: string, skipMetadata: true): Promise<KVStoredValueOnly | undefined>;
    abstract put(key: string, value: KVStoredValue): Promise<void>;
    abstract delete(key: string): Promise<boolean>;
    abstract list(options?: KVStorageListOptions): Promise<KVStoredKey[]>;
    hasMany(keys: string[]): Promise<number>;
    getMany(keys: string[], skipMetadata?: false): Promise<(KVStoredValue | undefined)[]>;
    getMany(keys: string[], skipMetadata: true): Promise<(KVStoredValueOnly | undefined)[]>;
    putMany(data: [key: string, value: KVStoredValue][]): Promise<void>;
    deleteMany(keys: string[]): Promise<number>;
}
