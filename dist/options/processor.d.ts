/// <reference types="node" />
import { URL } from "url";
import { Log } from "../log";
import { ScriptBlueprint } from "../scripts";
import { Options, ProcessedDurableObject, ProcessedHTTPSOptions, ProcessedModuleRule, ProcessedOptions } from "./index";
export declare class OptionsProcessor {
    private log;
    private initialOptions;
    private defaultCertRoot;
    private clock;
    _scriptBlueprints: Record<string, ScriptBlueprint>;
    private _buildMutex;
    readonly wranglerConfigPath: string;
    readonly packagePath: string;
    constructor(log: Log, initialOptions: Options, defaultCertRoot?: string, clock?: import("../kv/helpers").KVClock);
    private _globsToRegexps;
    private _readFile;
    addScriptBlueprint(scriptPath: string): Promise<void>;
    runCustomBuild(command: string, basePath?: string): Promise<boolean>;
    getWranglerOptions(): Promise<Options>;
    getPackageScript(modules?: boolean): Promise<string | undefined>;
    getScriptPath(options: Options): Promise<string>;
    getProcessedDurableObjects(options: Options): ProcessedDurableObject[];
    getProcessedModulesRules(options: Options): ProcessedModuleRule[];
    getEnvBindings(options: Options): Promise<{
        envPath: string;
        envBindings: Record<string, string>;
    }>;
    getWasmBindings(options: Options): Promise<Record<string, WebAssembly.Module>>;
    getUpstreamUrl(options: Options): URL | undefined;
    getValidatedCrons(options: Options): string[];
    getHttpsOptions({ https, }: Options): Promise<ProcessedHTTPSOptions | undefined>;
    getProcessedOptions(initial?: boolean): Promise<ProcessedOptions>;
}
