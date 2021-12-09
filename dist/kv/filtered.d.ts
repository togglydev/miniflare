import { KVClock } from "./helpers";
import { KVGetOptions, KVListOptions, KVListResult, KVPutOptions, KVPutValueType, KVStorageNamespace, KVValue, KVValueWithMetadata } from "./namespace";
import { KVStorage } from "./storage";
export interface FilteredKVStorageNamespaceOptions {
    readOnly?: boolean;
    include?: RegExp[];
    exclude?: RegExp[];
}
export declare class FilteredKVStorageNamespace extends KVStorageNamespace {
    #private;
    constructor(storage: KVStorage, options?: FilteredKVStorageNamespaceOptions, clock?: KVClock);
    get(key: string, options?: KVGetOptions): KVValue<any>;
    getWithMetadata<Metadata = unknown>(key: string, options?: KVGetOptions): KVValueWithMetadata<any, Metadata>;
    put(key: string, value: KVPutValueType, options?: KVPutOptions): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: KVListOptions): Promise<KVListResult>;
}
