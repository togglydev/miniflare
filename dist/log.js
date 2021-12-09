"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logResponse = exports.ConsoleLog = exports.NoOpLog = void 0;
const http_1 = __importDefault(require("http"));
const colors = __importStar(require("kleur/colors"));
const helpers_1 = require("./helpers");
class NoOpLog {
    log() { }
    debug() { }
    info() { }
    warn() { }
    error(data) {
        // Throw errors with NoOpLog, otherwise we'd have no way of knowing they
        // were occurring. Remove " (default..." or "(ignoring..." from error
        // message though since we're throwing instead of defaulting now.
        data = data.replace(/ \((default|ignoring).*$/, "");
        throw new helpers_1.MiniflareError(data);
    }
}
exports.NoOpLog = NoOpLog;
class ConsoleLog {
    constructor(logDebug = false) {
        this.logDebug = logDebug;
    }
    log(data) {
        console.log(data);
    }
    debug(data) {
        if (this.logDebug)
            console.log(colors.grey(`[mf:dbg] ${data}`));
    }
    info(data) {
        console.log(colors.green(`[mf:inf] ${data}`));
    }
    warn(data) {
        console.log(colors.yellow(`[mf:wrn] ${data}`));
    }
    error(data) {
        console.log(colors.red(`[mf:err] ${data}`));
    }
}
exports.ConsoleLog = ConsoleLog;
function _millisFromHRTime([seconds, nanoseconds]) {
    return `${((seconds * 1e9 + nanoseconds) / 1e6).toFixed(2)}ms`;
}
function _colourFromHTTPStatus(status) {
    if (200 <= status && status < 300)
        return colors.green;
    if (400 <= status && status < 500)
        return colors.yellow;
    if (500 <= status)
        return colors.red;
    return colors.blue;
}
async function logResponse(log, { start, method, url, status, waitUntil, }) {
    const responseTime = _millisFromHRTime(process.hrtime(start));
    // Wait for all waitUntil promises to resolve
    let waitUntilResponse;
    try {
        waitUntilResponse = await waitUntil;
    }
    catch (e) {
        log.error(e.stack);
    }
    const waitUntilTime = _millisFromHRTime(process.hrtime(start));
    log.log([
        `${colors.bold(method)} ${url} `,
        status
            ? _colourFromHTTPStatus(status)(`${colors.bold(status)} ${http_1.default.STATUS_CODES[status]} `)
            : "",
        colors.grey(`(${responseTime}`),
        // Only include waitUntilTime if there were waitUntil promises
        (waitUntilResponse === null || waitUntilResponse === void 0 ? void 0 : waitUntilResponse.length)
            ? colors.grey(`, waitUntil: ${waitUntilTime}`)
            : "",
        colors.grey(")"),
    ].join(""));
}
exports.logResponse = logResponse;
//# sourceMappingURL=log.js.map