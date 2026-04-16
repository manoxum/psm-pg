import { ModelOptions } from "@prisma-psm/core";
import { PostgresParserOptions } from "../def";
export declare function createFunctionRestoreSerial(opts: PostgresParserOptions): string[];
export interface RestoreOptions {
    source: string;
    model: ModelOptions;
    parser: PostgresParserOptions;
}
export declare function lockTable(opts: RestoreOptions): string[];
export declare function restoreBackupSQL(opts: RestoreOptions): {
    data: string[];
    registry: string[];
};
export interface RestoreSerialOptions extends RestoreOptions {
    from: string;
    to: string;
    seq?: string;
}
export declare function restoreSerialSQL(opts: RestoreSerialOptions): string[];
//# sourceMappingURL=engine.d.ts.map