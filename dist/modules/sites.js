"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SitesModule = void 0;
const kv_1 = require("../kv");
const module_1 = require("./module");
class SitesModule extends module_1.Module {
    buildEnvironment(options) {
        if (!options.sitePath)
            return {};
        // Create file KV storage with sanitisation DISABLED so paths containing
        // /'s resolve correctly
        const storage = new kv_1.FileKVStorage(options.sitePath, false);
        return {
            __STATIC_CONTENT: new kv_1.FilteredKVStorageNamespace(storage, {
                readOnly: true,
                include: options.siteIncludeRegexps,
                exclude: options.siteExcludeRegexps,
            }),
            // Empty manifest means @cloudflare/kv-asset-handler will use the request
            // path as the file path and won't edge cache files
            __STATIC_CONTENT_MANIFEST: {},
        };
    }
}
exports.SitesModule = SitesModule;
//# sourceMappingURL=sites.js.map