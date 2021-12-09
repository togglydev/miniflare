import chokidar from "chokidar";
import { Log } from "../log";
import { Options, ProcessedOptions } from "./index";
export declare type OptionsWatchCallback = (options: ProcessedOptions) => void | Promise<void>;
export declare class OptionsWatcher {
    private log;
    private callback;
    private initialOptions;
    private watchOptions?;
    private _processor;
    private _options?;
    private _watcher?;
    private _watchedPaths?;
    private _extraWatchedPaths?;
    private _building;
    readonly initPromise: Promise<void>;
    constructor(log: Log, callback: OptionsWatchCallback, initialOptions: Options, watchOptions?: chokidar.WatchOptions | undefined);
    private _getWatchedPaths;
    private _updateWatchedPaths;
    setExtraWatchedPaths(paths?: Set<string>): void;
    private _init;
    private _watchedPathCallback;
    reloadOptions(log?: boolean): Promise<void>;
    dispose(): Promise<void>;
}
