import { ModelOptions } from "@prisma-psm/core";
import { PostgresParserOptions } from "./def";
export declare function modelParser(model: ModelOptions, parser: PostgresParserOptions): {
    create_primary_keys: () => string[];
    drop_primary_keys: () => string[];
    create_foreign_key: () => string[];
    drop_foreign_key: () => string[];
    create_unique_key: () => string[];
    drop_unique_key: () => string[];
    create_index_key: () => string[];
    drop_index_key: () => string[];
    drop_table: () => string[];
    allocate_table: () => string[];
    create_table: () => string[];
    lockTable: () => string[];
    restore_backup: () => {
        data: string[];
        registry: string[];
    };
    restore_serial: () => string[];
    depends: () => string[];
};
//# sourceMappingURL=modelParser.d.ts.map