import { ModelOptions } from "@prisma-psm/core";
import { PostgresParserOptions } from "./def";
export declare function tableParser(model: ModelOptions, parser: PostgresParserOptions): {
    drop_table: () => string[];
    allocate_table: () => string[];
    create_table: () => string[];
};
//# sourceMappingURL=table.d.ts.map