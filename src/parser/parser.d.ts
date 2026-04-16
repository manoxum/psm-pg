import { ParseModelResult, PostgresParserOptions } from "./def";
export interface ParserResult {
    options: PostgresParserOptions;
    models: string[];
    parsedList: ParseModelResult[];
    core: {
        schema: string[];
        structure: string[];
        functions: string[];
        migration: string[];
    };
    shadow: {
        create: string[];
        drop: string[];
    };
    parsed: {
        [p: string]: ParseModelResult;
    };
}
export declare function parser(opts: PostgresParserOptions): ParserResult;
//# sourceMappingURL=parser.d.ts.map