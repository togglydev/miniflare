import { ReadableStream } from "web-streams-polyfill/ponyfill/es6";
import { KVClock } from "./helpers";
import { KVStorage } from "./storage";
export declare type KVValue<Value> = Promise<Value | null>;
export declare type KVValueWithMetadata<Value, Metadata> = Promise<{
    value: Value | null;
    metadata: Metadata | null;
}>;
export declare type KVGetValueType = "text" | "json" | "arrayBuffer" | "stream";
export declare type KVGetOptions = KVGetValueType | {
    type?: KVGetValueType;
    cacheTtl?: number;
};
export declare type KVPutValueType = string | ReadableStream | ArrayBuffer;
export interface KVPutOptions {
    expiration?: string | number;
    expirationTtl?: string | number;
    metadata?: any;
}
export interface KVListOptions {
    prefix?: string;
    limit?: number;
    cursor?: string;
}
export interface KVListResult {
    keys: {
        name: string;
        expiration?: number;
        metadata?: unknown;
    }[];
    list_complete: boolean;
    cursor: string;
}
export declare class KVStorageNamespace {
    #private;
    constructor(storage: KVStorage, clock?: KVClock);
    get(key: string, options?: {
        cacheTtl?: number;
    }): KVValue<string>;
    get(key: string, type: "text"): KVValue<string>;
    get(key: string, options: {
        type: "text";
        cacheTtl?: number;
    }): KVValue<string>;
    get<Value = unknown>(key: string, type: "json"): KVValue<Value>;
    get<Value = unknown>(key: string, options: {
        type: "json";
        cacheTtl?: number;
    }): KVValue<Value>;
    get(key: string, type: "arrayBuffer"): KVValue<ArrayBuffer>;
    get(key: string, options: {
        type: "arrayBuffer";
        cacheTtl?: number;
    }): KVValue<ArrayBuffer>;
    get(key: string, type: "stream"): KVValue<ReadableStream>;
    get(key: string, options: {
        type: "stream";
        cacheTtl?: number;
    }): KVValue<ReadableStream>;
    getWithMetadata<Metadata = unknown>(key: string, options?: {
        cacheTtl?: number;
    }): KVValueWithMetadata<string, Metadata>;
    getWithMetadata<Metadata = unknown>(key: string, type: "text"): KVValueWithMetadata<string, Metadata>;
    getWithMetadata<Metadata = unknown>(key: string, options: {
        type: "text";
        cacheTtl?: number;
    }): KVValueWithMetadata<string, Metadata>;
    getWithMetadata<Value = unknown, Metadata = unknown>(key: string, type: "json"): KVValueWithMetadata<Value, Metadata>;
    getWithMetadata<Value = unknown, Metadata = unknown>(key: string, options: {
        type: "json";
        cacheTtl?: number;
    }): KVValueWithMetadata<Value, Metadata>;
    getWithMetadata<Metadata = unknown>(key: string, type: "arrayBuffer"): KVValueWithMetadata<ArrayBuffer, Metadata>;
    getWithMetadata<Metadata = unknown>(key: string, options: {
        type: "arrayBuffer";
        cacheTtl?: number;
    }): KVValueWithMetadata<ArrayBuffer, Metadata>;
    getWithMetadata<Metadata = unknown>(key: string, type: "stream"): KVValueWithMetadata<ReadableStream, Metadata>;
    getWithMetadata<Metadata = unknown>(key: string, options: {
        type: "stream";
        cacheTtl?: number;
    }): KVValueWithMetadata<ReadableStream, Metadata>;
    put(key: string, value: KVPutValueType, { expiration, expirationTtl, metadata }?: KVPutOptions): Promise<void>;
    delete(key: string): Promise<void>;
    list({ prefix, limit, cursor, }?: KVListOptions): Promise<KVListResult>;
}
