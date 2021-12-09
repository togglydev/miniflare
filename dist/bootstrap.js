#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = __importDefault(require("child_process"));
const path_1 = __importDefault(require("path"));
/* Spawn a new process using the same Node.js executable and passing the same
 * command line arguments, but with the "--experimental-vm-modules" flag which
 * is required for modules support.
 *
 * This is the only cross-platform way of enabling VM modules I can think of.
 * On Mac/Linux, we can use "#!/usr/bin/env -S node --experimental-vm-modules"
 * as a shebang, but this won't work on Windows (or older Linux versions, e.g.
 * Ubuntu 18.04). If you can think of a better way of doing this, please open a
 * GitHub issue.
 * */
child_process_1.default
    .spawn(process.execPath, [
    "--experimental-vm-modules",
    path_1.default.join(__dirname, "cli.js"),
    ...process.argv.slice(2),
], { stdio: "inherit" })
    .on("exit", (code) => process.exit(code !== null && code !== void 0 ? code : 0));
//# sourceMappingURL=bootstrap.js.map