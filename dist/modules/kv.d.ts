import { KVStorageNamespace } from "../kv";
import { KVStorageFactory } from "../kv/helpers";
import { Log } from "../log";
import { ProcessedOptions } from "../options";
import { Context, Module } from "./module";
export declare class KVModule extends Module {
    private storageFactory;
    constructor(log: Log, storageFactory?: KVStorageFactory);
    getNamespace(namespace: string, persist?: boolean | string): KVStorageNamespace;
    buildEnvironment(options: ProcessedOptions): Context;
    dispose(): void;
}
