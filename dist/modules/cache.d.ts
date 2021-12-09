import { Cache, NoOpCache } from "../kv";
import { KVStorageFactory } from "../kv/helpers";
import { Log } from "../log";
import { ProcessedOptions } from "../options";
import { Context, Module } from "./module";
export declare class CacheModule extends Module {
    private storageFactory;
    constructor(log: Log, storageFactory?: KVStorageFactory);
    getCache(name?: string, persist?: boolean | string): Cache;
    buildSandbox(options: ProcessedOptions): Context;
    dispose(): void;
}
export { Cache, NoOpCache };
