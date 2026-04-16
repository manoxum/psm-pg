import { PostgresParserOptions } from "./def";
import { ModelOptions } from "@prisma-psm/core";
export type IndexesOptions = {
    model: ModelOptions;
    name: string;
    fields?: string[];
    algorithm?: string;
};
export declare function indexesParser(model: ModelOptions, parser: PostgresParserOptions): {
    create_index_key: () => string[];
    drop_index_key: () => string[];
};
//# sourceMappingURL=indexes.d.ts.map