import { ParserResult } from "./parser";
export interface SQLOptions {
    mode: "check" | "migrate" | "core";
}
export declare function sql(opts: SQLOptions, response: ParserResult): string;
//# sourceMappingURL=sql.d.ts.map