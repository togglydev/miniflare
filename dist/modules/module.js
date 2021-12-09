"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Module = void 0;
class Module {
    constructor(log) {
        this.log = log;
    }
    // The sandbox is everything that's always in global scope
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    buildSandbox(options) {
        return {};
    }
    // The environment is everything that's included in env arguments when
    // using modules, and in the global scope otherwise
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    buildEnvironment(options) {
        return {};
    }
    // Cleans up this module, disposing of any resources/connections
    dispose() { }
}
exports.Module = Module;
//# sourceMappingURL=module.js.map