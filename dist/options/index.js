"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccessibleHosts = exports.logOptions = exports.defaultModuleRules = exports.stringScriptPath = void 0;
const os_1 = require("os");
const path_1 = __importDefault(require("path"));
exports.stringScriptPath = "<script>";
exports.defaultModuleRules = [
    { type: "ESModule", include: ["**/*.mjs"] },
    { type: "CommonJS", include: ["**/*.js", "**/*.cjs"] },
];
function logOptions(log, options) {
    var _a, _b, _c, _d;
    // Log final parsed options
    const entries = {
        "Build Command": options.buildCommand,
        // Make path undefined if relative path resolves to empty string (is cwd)
        "Build Base Path": options.buildBasePath
            ? path_1.default.relative("", options.buildBasePath) || undefined
            : undefined,
        Scripts: options.scripts
            ? Object.values(options.scripts).map((script) => path_1.default.relative("", script.fileName))
            : undefined,
        Modules: options.modules || undefined,
        "Modules Rules": options.modules
            ? (_a = options.processedModulesRules) === null || _a === void 0 ? void 0 : _a.map((rule) => `{${rule.type}: ${rule.include.join(", ")}}`)
            : undefined,
        Upstream: (_b = options.upstreamUrl) === null || _b === void 0 ? void 0 : _b.origin,
        Crons: options.validatedCrons,
        "KV Namespaces": options.kvNamespaces,
        "KV Persistence": options.kvPersist,
        "Cache Persistence": options.cachePersist,
        "Cache Disabled": options.disableCache,
        "Workers Site Path": options.sitePath,
        "Workers Site Include": options.siteIncludeRegexps,
        // Only include excludeRegexps if there are no includeRegexps
        "Workers Site Exclude": ((_c = options.siteIncludeRegexps) === null || _c === void 0 ? void 0 : _c.length)
            ? undefined
            : options.siteExcludeRegexps,
        "Durable Objects": (_d = options.processedDurableObjects) === null || _d === void 0 ? void 0 : _d.map(({ name }) => name),
        "Durable Objects Persistence": options.durableObjectsPersist,
        Bindings: options.bindings ? Object.keys(options.bindings) : undefined,
        HTTPS: !options.https
            ? undefined
            : typeof options.https === "object"
                ? "Custom"
                : options.https === true
                    ? "Self-Signed"
                    : `Self-Signed: ${options.https}`,
    };
    log.debug("Options:");
    for (const [key, value] of Object.entries(entries)) {
        if (value !== undefined && (!Array.isArray(value) || (value === null || value === void 0 ? void 0 : value.length) > 0)) {
            log.debug(`- ${key}: ${Array.isArray(value) ? value.join(", ") : value}`);
        }
    }
}
exports.logOptions = logOptions;
function getAccessibleHosts(ipv4 = false) {
    const hosts = [];
    Object.values(os_1.networkInterfaces()).forEach((net) => net === null || net === void 0 ? void 0 : net.forEach(({ family, address }) => {
        if (!ipv4 || family === "IPv4")
            hosts.push(address);
    }));
    return hosts;
}
exports.getAccessibleHosts = getAccessibleHosts;
//# sourceMappingURL=index.js.map