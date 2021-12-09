"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatSize = exports.MiniflareError = void 0;
class MiniflareError extends Error {
    constructor(message) {
        super(message);
        // Restore prototype chain:
        // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html#support-for-newtarget
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = new.target.name;
    }
}
exports.MiniflareError = MiniflareError;
function formatSize(bytes) {
    if (bytes >= 524288)
        return `${(bytes / 1048576).toFixed(2)}MiB`;
    if (bytes >= 512)
        return `${(bytes / 1024).toFixed(2)}KiB`;
    return `${bytes}B`;
}
exports.formatSize = formatSize;
//# sourceMappingURL=helpers.js.map