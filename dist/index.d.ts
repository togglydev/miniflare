/// <reference types="node" />
import http from "http";
import https from "https";
import { RequestInfo, RequestInit } from "@mrbbot/node-fetch";
import { MiniflareError } from "./helpers";
import { Cache, KVStorageNamespace } from "./kv";
import { Log } from "./log";
import { ResponseWaitUntil } from "./modules";
import { DurableObjectNamespace } from "./modules/do";
import { Options, ProcessedOptions } from "./options";
export declare class Miniflare {
    #private;
    readonly log: Log;
    constructor(options?: Options);
    /** @deprecated Since 1.2.0, this is just an alias for reloadOptions() */
    reloadScript(): Promise<void>;
    reloadOptions(log?: boolean): Promise<void>;
    dispatchFetch<WaitUntil extends any[] = any[]>(input: RequestInfo, init?: RequestInit): Promise<ResponseWaitUntil<WaitUntil>>;
    dispatchScheduled<WaitUntil extends any[] = any[]>(scheduledTime?: number, cron?: string): Promise<WaitUntil>;
    getOptions(): Promise<ProcessedOptions>;
    getCache(name?: string): Promise<Cache>;
    getKVNamespace(namespace: string): Promise<KVStorageNamespace>;
    getDurableObjectNamespace(objectName: string): Promise<DurableObjectNamespace>;
    dispose(): Promise<void>;
    createServer(): http.Server;
    createServer(secure: true): Promise<https.Server>;
}
export * from "./kv";
export * from "./modules";
export { Log, NoOpLog, ConsoleLog } from "./log";
export { ModuleRuleType, ModuleRule, ProcessedModuleRule, DurableObjectOptions, ProcessedDurableObject, ProcessedHTTPSOptions, HTTPSOptions, getAccessibleHosts, } from "./options";
export { Options, ProcessedOptions, MiniflareError };
