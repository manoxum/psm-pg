import { PSMDumpResponse } from "@prisma-psm/core";
import * as cp from "child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as Path from "node:path";

export interface DumpOptions {
    url: string;
}

export function dump(opts: DumpOptions): Promise<PSMDumpResponse> {
    return new Promise((resolve) => {
        const progress = cp.spawn("pg_dump", ["-cOv", "--if-exists", opts.url]);
        const tempDir = fs.mkdtempSync(Path.join(os.tmpdir(), "psm-dump-"));
        const dumpFile = Path.join(tempDir, "backup.sql");
        const output = fs.createWriteStream(dumpFile);
        let errorOutput = "";
        let error: Error | null = null;
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
            } else if (code !== 0) {
                fs.rmSync(tempDir, { recursive: true, force: true });
                resolve({ error: new Error(`pg_dump failed with code ${code}\n${errorOutput}`) });
            } else {
                const finish = () => resolve({ file: dumpFile });
                if (streamFinished) finish();
                else output.on("finish", finish);
            }
        });
    });
}
