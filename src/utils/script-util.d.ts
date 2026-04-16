export type ScriptLine = {
    line: number;
    filename: string;
    error: Error;
    column: number;
    func: string;
};
export type TempScriptOptions = {
    encoding?: BufferEncoding;
    extension?: string;
    prefix?: string;
    suffix?: string;
    noCreate?: boolean;
};
declare class TSUtil {
    typescriptOf(filename: string): string;
    private __lineOf;
    javascriptLineOf(): ScriptLine;
    private __tsLine;
    typescriptLineOf(goBack?: number): ScriptLine;
    lineOf(goBack?: number): ScriptLine;
    urlOf(line: ScriptLine): string;
}
export declare const scriptUtil: TSUtil;
export {};
//# sourceMappingURL=script-util.d.ts.map