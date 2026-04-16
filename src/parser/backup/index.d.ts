import { ModelOptions } from "@prisma-psm/core";
import { PostgresParserOptions } from "../def";
export declare function backupParser(model: ModelOptions, parser: PostgresParserOptions): {
    lockTable: () => string[];
    restore_backup: () => {
        data: string[];
        registry: string[];
    };
    restore_serial: () => string[];
};
//# sourceMappingURL=index.d.ts.map