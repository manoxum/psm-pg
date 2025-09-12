import { PSMDumpResponse } from "@prisma-psm/core";
import * as cp from "child_process";

export interface DumpOptions {
    url: string;
}

export function dump(opts: DumpOptions): Promise<PSMDumpResponse> {
    return new Promise((resolve) => {
        const progress = cp.spawn("pg_dump", ["-cOv", "--if-exists", opts.url]);

        const chunks: Buffer[] = []; // guarda chunks de stdout
        let errorOutput = "";
        let error: Error | null = null;

        // Captura stdout em chunks de Buffer
        progress.stdout.on("data", (chunk: Buffer) => {
            chunks.push(chunk);
        });

        // Captura stderr
        progress.stderr.on("data", (chunk) => {
            errorOutput += chunk.toString();
            console.error(chunk.toString());
        });

        progress.on("error", (err) => {
            error = err;
        });

        progress.on("exit", (code) => {
            if (error) {
                resolve({ error });
            } else if (code !== 0) {
                resolve({ error: new Error(`pg_dump failed with code ${code}\n${errorOutput}`) });
            } else {
                const output = Buffer.concat(chunks).toString("utf-8");
                resolve({ output: output });
            }
        });
    });
}
