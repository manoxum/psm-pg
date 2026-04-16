import { FieldOption } from "@prisma-psm/core";
export declare function parseType(opts: FieldOption): {
    type: string;
    serial: boolean;
    cast: any;
};
export declare function parseDefault(opts: FieldOption, typed: string): string;
//# sourceMappingURL=engine.d.ts.map