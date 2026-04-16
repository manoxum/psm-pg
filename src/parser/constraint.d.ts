import { PostgresParserOptions } from "./def";
import { ModelOptions } from "@prisma-psm/core";
export type RelationTriggerEvent = "Cascade" | "NoAction" | "Restrict" | "SetDefault" | "SetNull";
export type ConstraintsOptions = {
    model: ModelOptions;
    name: string;
    key: "primary" | "foreign" | "unique" | "check" | "index";
    fields?: string[];
    refModel?: string;
    algorithm?: string;
    refModelSchema?: string;
    refFields?: string[];
    parser: PostgresParserOptions;
    relationOnDelete?: RelationTriggerEvent;
    relationOnUpdate?: RelationTriggerEvent;
};
export declare function constraintsParser(model: ModelOptions, parser: PostgresParserOptions): {
    create_primary_keys: () => string[];
    drop_primary_keys: () => string[];
    create_foreign_key: () => string[];
    drop_foreign_key: () => string[];
    create_unique_key: () => string[];
    drop_unique_key: () => string[];
};
//# sourceMappingURL=constraint.d.ts.map