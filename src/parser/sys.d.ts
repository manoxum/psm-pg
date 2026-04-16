import { PostgresParserOptions } from "./def";
export declare function prepareCore(opts: PostgresParserOptions): string[];
export declare function createMigration(opts: PostgresParserOptions): string[];
export interface OperationOptions {
    hash: string;
    operation?: string;
    relation?: string;
    revision?: string;
}
export declare function createRevision(opts: PostgresParserOptions, operation: OperationOptions): string[];
//# sourceMappingURL=sys.d.ts.map