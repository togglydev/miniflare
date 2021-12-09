/// <reference types="node" />
import { URL } from "url";
import { Log } from "../log";
import { ScriptBlueprint } from "../scripts";
export declare const stringScriptPath = "<script>";
export declare type ModuleRuleType = "ESModule" | "CommonJS" | "Text" | "Data" | "CompiledWasm";
export interface ModuleRule {
    type: ModuleRuleType;
    include: string[];
    fallthrough?: boolean;
}
export interface ProcessedModuleRule {
    type: ModuleRuleType;
    include: RegExp[];
}
export declare const defaultModuleRules: ModuleRule[];
export interface DurableObjectOptions {
    [name: string]: string | {
        className: string;
        scriptPath?: string;
    };
}
export interface ProcessedDurableObject {
    name: string;
    className: string;
    scriptPath: string;
}
export interface ProcessedHTTPSOptions {
    key?: string;
    cert?: string;
    ca?: string;
    pfx?: string;
    passphrase?: string;
}
export interface HTTPSOptions extends ProcessedHTTPSOptions {
    keyPath?: string;
    certPath?: string;
    caPath?: string;
    pfxPath?: string;
}
export interface Options {
    script?: string;
    sourceMap?: boolean;
    log?: boolean | Log;
    wranglerConfigPath?: string;
    wranglerConfigEnv?: string;
    packagePath?: string;
    watch?: boolean;
    host?: string;
    port?: number;
    https?: boolean | string | HTTPSOptions;
    disableUpdater?: boolean;
    scriptPath?: string;
    modules?: boolean;
    modulesRules?: ModuleRule[];
    buildCommand?: string;
    buildBasePath?: string;
    buildWatchPath?: string;
    upstream?: string;
    crons?: string[];
    kvNamespaces?: string[];
    kvPersist?: boolean | string;
    cachePersist?: boolean | string;
    disableCache?: boolean;
    sitePath?: string;
    siteInclude?: string[];
    siteExclude?: string[];
    durableObjects?: DurableObjectOptions;
    durableObjectsPersist?: boolean | string;
    envPath?: string;
    bindings?: Record<string, any>;
    wasmBindings?: Record<string, string>;
}
export interface ProcessedOptions extends Options {
    scripts?: Record<string, ScriptBlueprint>;
    processedModulesRules?: ProcessedModuleRule[];
    upstreamUrl?: URL;
    validatedCrons?: string[];
    siteIncludeRegexps?: RegExp[];
    siteExcludeRegexps?: RegExp[];
    processedDurableObjects?: ProcessedDurableObject[];
    processedHttps?: ProcessedHTTPSOptions;
}
export declare function logOptions(log: Log, options: ProcessedOptions): void;
export declare function getAccessibleHosts(ipv4?: boolean): string[];
