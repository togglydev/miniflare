import { Log } from "../log";
import { ProcessedOptions } from "../options";
export declare type Context = Record<string, any>;
export declare abstract class Module {
    protected log: Log;
    constructor(log: Log);
    buildSandbox(options: ProcessedOptions): Context;
    buildEnvironment(options: ProcessedOptions): Context;
    dispose(): void | Promise<void>;
}
