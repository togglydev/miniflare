"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptionsWatcher = void 0;
const path_1 = __importDefault(require("path"));
const chokidar_1 = __importDefault(require("chokidar"));
const processor_1 = require("./processor");
const index_1 = require("./index");
function pathSetToString(set) {
    return [...set]
        .map((filePath) => path_1.default.relative("", filePath))
        .sort()
        .join(", ");
}
class OptionsWatcher {
    constructor(log, callback, initialOptions, watchOptions) {
        this.log = log;
        this.callback = callback;
        this.initialOptions = initialOptions;
        this.watchOptions = watchOptions;
        this._building = false;
        this._processor = new processor_1.OptionsProcessor(log, initialOptions);
        // Setup initial options
        this.initPromise = this._init();
    }
    _getWatchedPaths() {
        var _a, _b, _c, _d, _e, _f, _g;
        const watchedPaths = new Set(this._extraWatchedPaths);
        watchedPaths.add(this._processor.wranglerConfigPath);
        watchedPaths.add(this._processor.packagePath);
        if ((_a = this._options) === null || _a === void 0 ? void 0 : _a.envPath)
            watchedPaths.add(this._options.envPath);
        if ((_b = this._options) === null || _b === void 0 ? void 0 : _b.buildWatchPath)
            watchedPaths.add(this._options.buildWatchPath);
        if ((_c = this._options) === null || _c === void 0 ? void 0 : _c.scriptPath)
            watchedPaths.add(this._options.scriptPath);
        for (const durableObject of (_e = (_d = this._options) === null || _d === void 0 ? void 0 : _d.processedDurableObjects) !== null && _e !== void 0 ? _e : []) {
            if (durableObject.scriptPath)
                watchedPaths.add(durableObject.scriptPath);
        }
        for (const wasmPath of Object.values((_g = (_f = this._options) === null || _f === void 0 ? void 0 : _f.wasmBindings) !== null && _g !== void 0 ? _g : {})) {
            watchedPaths.add(wasmPath);
        }
        return watchedPaths;
    }
    _updateWatchedPaths() {
        // Update watched paths only if we're watching files
        if (this._watcher && this._watchedPaths) {
            // Store changed paths for logging
            const unwatchedPaths = new Set();
            const watchedPaths = new Set();
            const newWatchedPaths = this._getWatchedPaths();
            // Unwatch paths that should no longer be watched
            for (const watchedPath of this._watchedPaths) {
                if (!newWatchedPaths.has(watchedPath)) {
                    unwatchedPaths.add(watchedPath);
                    this._watcher.unwatch(watchedPath);
                }
            }
            // Watch paths that should now be watched
            for (const newWatchedPath of newWatchedPaths) {
                if (!this._watchedPaths.has(newWatchedPath)) {
                    watchedPaths.add(newWatchedPath);
                    this._watcher.add(newWatchedPath);
                }
            }
            this._watchedPaths = newWatchedPaths;
            if (unwatchedPaths.size > 0) {
                this.log.debug(`Unwatching ${pathSetToString(unwatchedPaths)}...`);
            }
            if (watchedPaths.size > 0) {
                this.log.debug(`Watching ${pathSetToString(watchedPaths)}...`);
            }
        }
    }
    setExtraWatchedPaths(paths) {
        this._extraWatchedPaths = paths;
        this._updateWatchedPaths();
    }
    async _init() {
        var _a;
        // Yield initial values
        this._options = await this._processor.getProcessedOptions(true);
        index_1.logOptions(this.log, this._options);
        await this.callback(this._options);
        // Stop here if we're not watching files
        if (!((_a = this._options) === null || _a === void 0 ? void 0 : _a.watch))
            return;
        // Get an array of watched file paths, storing them so we can tell if they
        // change later
        this._watchedPaths = this._getWatchedPaths();
        this.log.debug(`Watching ${pathSetToString(this._watchedPaths)}...`);
        // Create watcher
        const boundCallback = this._watchedPathCallback.bind(this);
        this._watcher = chokidar_1.default
            .watch([...this._watchedPaths], {
            ...this.watchOptions,
            awaitWriteFinish: {
                stabilityThreshold: 100
            },
            ignoreInitial: true,
        })
            .on("add", boundCallback)
            .on("change", boundCallback)
            .on("unlink", boundCallback);
    }
    async _watchedPathCallback(eventPath) {
        var _a, _b;
        if (((_a = this._options) === null || _a === void 0 ? void 0 : _a.buildWatchPath) &&
            eventPath.startsWith(this._options.buildWatchPath)) {
            if (this._options.buildCommand) {
                this.log.debug(`${path_1.default.relative("", eventPath)} changed, rebuilding...`);
                // Re-run build, this should change a script triggering the watcher
                // again
                this._building = true;
                try {
                    const succeeded = await this._processor.runCustomBuild(this._options.buildCommand, this._options.buildBasePath);
                    if (succeeded)
                        await this.reloadOptions(false);
                }
                finally {
                    // Wait a little bit before starting to process watch events again
                    // to allow built file changes to come through
                    setTimeout(() => (this._building = false), 50);
                }
            }
        }
        else if (!this._building) {
            // If the path isn't in buildWatchPath, reload options and scripts,
            // provided we're not currently building
            this.log.debug(`${path_1.default.relative("", eventPath)} changed, reloading...`);
            // Log options is this was an options file, we don't want to spam the log
            // with script changes
            const log = eventPath === this._processor.wranglerConfigPath ||
                eventPath === this._processor.packagePath ||
                eventPath === ((_b = this._options) === null || _b === void 0 ? void 0 : _b.envPath);
            await this.reloadOptions(log);
        }
    }
    async reloadOptions(log = true) {
        this._options = await this._processor.getProcessedOptions();
        if (log)
            index_1.logOptions(this.log, this._options);
        this._updateWatchedPaths();
        await this.callback(this._options);
    }
    async dispose() {
        var _a;
        await ((_a = this._watcher) === null || _a === void 0 ? void 0 : _a.close());
    }
}
exports.OptionsWatcher = OptionsWatcher;
//# sourceMappingURL=watcher.js.map