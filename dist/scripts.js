"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptLinker = exports.ModuleScriptInstance = exports.ScriptScriptInstance = exports.ScriptBlueprint = exports.createScriptContext = void 0;
const assert_1 = __importDefault(require("assert"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const vm_1 = __importDefault(require("vm"));
const cjstoesm_1 = require("cjstoesm");
const typescript_1 = require("typescript");
const helpers_1 = require("./helpers");
const options_1 = require("./options");
function createScriptContext(sandbox) {
    return vm_1.default.createContext(sandbox, {
        codeGeneration: { strings: false },
    });
}
exports.createScriptContext = createScriptContext;
class ScriptBlueprint {
    constructor(code, fileName) {
        this.code = code;
        this.fileName = fileName;
    }
    async buildScript(context) {
        const script = new vm_1.default.Script(this.code, { filename: this.fileName });
        return new ScriptScriptInstance(context, script);
    }
    async buildModule(context, linker) {
        if (!("SourceTextModule" in vm_1.default)) {
            throw new helpers_1.MiniflareError("Modules support requires the --experimental-vm-modules flag");
        }
        const module = new vm_1.default.SourceTextModule(this.code, {
            identifier: this.fileName,
            context,
        });
        await module.link(linker);
        return new ModuleScriptInstance(module);
    }
}
exports.ScriptBlueprint = ScriptBlueprint;
class ScriptScriptInstance {
    constructor(context, script) {
        this.context = context;
        this.script = script;
    }
    async run() {
        this.script.runInContext(this.context);
    }
}
exports.ScriptScriptInstance = ScriptScriptInstance;
class ModuleScriptInstance {
    constructor(module) {
        this.module = module;
    }
    async run() {
        await this.module.evaluate({ breakOnSigint: true });
    }
    get exports() {
        return this.module.namespace;
    }
}
exports.ModuleScriptInstance = ModuleScriptInstance;
const commonJsTransformer = cjstoesm_1.cjsToEsm();
const commonJsCompilerOptions = {
    allowJs: true,
    module: typescript_1.ModuleKind.ESNext,
    sourceMap: true,
    target: typescript_1.ScriptTarget.ES2018,
};
class ScriptLinker {
    constructor(moduleRules) {
        this.moduleRules = moduleRules;
        this.referencedPaths = new Set();
        this._referencedPathsSizes = new Map();
        this._moduleCache = new Map();
        this.extraSourceMaps = new Map();
        this.linker = this._linker.bind(this);
    }
    get referencedPathsTotalSize() {
        // Make sure we only include each module once, even if it's referenced
        // from multiple scripts
        const sizes = Array.from(this._referencedPathsSizes.values());
        return sizes.reduce((total, size) => total + size, 0);
    }
    async _linker(specifier, referencingModule) {
        const errorBase = `Unable to resolve "${path_1.default.relative("", referencingModule.identifier)}" dependency "${specifier}"`;
        if (referencingModule.identifier === options_1.stringScriptPath) {
            throw new helpers_1.MiniflareError(`${errorBase}: imports unsupported with string script`);
        }
        // Get path to specified module relative to referencing module and make
        // sure it's within the root modules path
        const modulePath = path_1.default.resolve(path_1.default.dirname(referencingModule.identifier), specifier);
        const cached = this._moduleCache.get(modulePath);
        if (cached)
            return cached;
        // Find first matching module rule
        const rule = this.moduleRules.find((rule) => rule.include.some((regexp) => modulePath.match(regexp)));
        if (rule === undefined) {
            throw new helpers_1.MiniflareError(`${errorBase}: no matching module rules`);
        }
        // Load module based on rule type
        this.referencedPaths.add(modulePath);
        const data = await fs_1.promises.readFile(modulePath);
        this._referencedPathsSizes.set(modulePath, data.byteLength);
        const moduleOptions = {
            identifier: modulePath,
            context: referencingModule.context,
        };
        let result;
        switch (rule.type) {
            case "ESModule":
                result = new vm_1.default.SourceTextModule(data.toString("utf8"), moduleOptions);
                break;
            case "CommonJS":
                // TODO: (low priority) try do this without TypeScript
                // Convert CommonJS module to an ESModule one
                const transpiled = typescript_1.transpileModule(data.toString("utf8"), {
                    transformers: commonJsTransformer,
                    compilerOptions: commonJsCompilerOptions,
                    fileName: modulePath,
                });
                // Store ESModule -> CommonJS source map
                assert_1.default(transpiled.sourceMapText);
                this.extraSourceMaps.set(modulePath, transpiled.sourceMapText);
                result = new vm_1.default.SourceTextModule(transpiled.outputText, moduleOptions);
                break;
            case "Text":
                result = new vm_1.default.SyntheticModule(["default"], function () {
                    this.setExport("default", data.toString("utf8"));
                }, moduleOptions);
                break;
            case "Data":
                result = new vm_1.default.SyntheticModule(["default"], function () {
                    this.setExport("default", data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
                }, moduleOptions);
                break;
            case "CompiledWasm":
                result = new vm_1.default.SyntheticModule(["default"], function () {
                    this.setExport("default", new WebAssembly.Module(data));
                }, moduleOptions);
                break;
            default:
                throw new helpers_1.MiniflareError(`${errorBase}: ${rule.type} modules are unsupported`);
        }
        this._moduleCache.set(modulePath, result);
        return result;
    }
}
exports.ScriptLinker = ScriptLinker;
//# sourceMappingURL=scripts.js.map