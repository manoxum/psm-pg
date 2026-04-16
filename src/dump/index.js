"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.dump = dump;
const cp = __importStar(require("child_process"));
const fs = __importStar(require("node:fs"));
const os = __importStar(require("node:os"));
const Path = __importStar(require("node:path"));
function dump(opts) {
    return new Promise((resolve) => {
        const progress = cp.spawn("pg_dump", ["-cOv", "--if-exists", opts.url]);
        const tempDir = fs.mkdtempSync(Path.join(os.tmpdir(), "psm-dump-"));
        const dumpFile = Path.join(tempDir, "backup.sql");
        const output = fs.createWriteStream(dumpFile);
        let errorOutput = "";
        let error = null;
        let streamFinished = false;
        progress.stdout.pipe(output);
        // Captura stderr
        progress.stderr.on("data", (chunk) => {
            errorOutput += chunk.toString();
            console.error(chunk.toString());
        });
        progress.on("error", (err) => {
            error = err;
        });
        output.on("error", (err) => {
            error = err;
        });
        output.on("finish", () => {
            streamFinished = true;
        });
        progress.on("exit", (code) => {
            output.end();
            if (error) {
                fs.rmSync(tempDir, { recursive: true, force: true });
                resolve({ error });
            }
            else if (code !== 0) {
                fs.rmSync(tempDir, { recursive: true, force: true });
                resolve({ error: new Error(`pg_dump failed with code ${code}\n${errorOutput}`) });
            }
            else {
                const finish = () => resolve({ file: dumpFile });
                if (streamFinished)
                    finish();
                else
                    output.on("finish", finish);
            }
        });
    });
}
//# sourceMappingURL=index.js.map