/// <reference types="node" />
import vm, { ModuleLinker } from "vm";
import { ProcessedModuleRule } from "./options";
export declare function createScriptContext(sandbox: vm.Context): vm.Context;
export declare class ScriptBlueprint {
    readonly code: string;
    readonly fileName: string;
    constructor(code: string, fileName: string);
    buildScript(context: vm.Context): Promise<ScriptScriptInstance>;
    buildModule<Exports = any>(context: vm.Context, linker: vm.ModuleLinker): Promise<ModuleScriptInstance<Exports>>;
}
export interface ScriptInstance {
    run(): Promise<void>;
}
export declare class ScriptScriptInstance implements ScriptInstance {
    private context;
    private script;
    constructor(context: vm.Context, script: vm.Script);
    run(): Promise<void>;
}
export declare class ModuleScriptInstance<Exports = any> implements ScriptInstance {
    private module;
    constructor(module: vm.SourceTextModule<Exports>);
    run(): Promise<void>;
    get exports(): Exports;
}
export declare class ScriptLinker {
    private moduleRules;
    readonly referencedPaths: Set<string>;
    private _referencedPathsSizes;
    private _moduleCache;
    readonly extraSourceMaps: Map<string, string>;
    readonly linker: ModuleLinker;
    constructor(moduleRules: ProcessedModuleRule[]);
    get referencedPathsTotalSize(): number;
    private _linker;
}
