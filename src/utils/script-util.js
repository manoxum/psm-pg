"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scriptUtil = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const REG_EXP_LINE_FUNCTION = /(.+?) \((.+?):(\d+):(\d+)\)/;
const REG_EXP_LINE_SIMPLE = /at (.+):(\d+):(\d+)/;
class TSUtil {
    typescriptOf(filename) {
        let basename = path_1.default.basename(filename, ".js");
        let tsFile = path_1.default.join(path_1.default.dirname(filename), `${basename}.ts`);
        if (fs_1.default.existsSync(tsFile))
            return tsFile;
        return null;
    }
    __lineOf(error, goBack) {
        const stackLines = error.stack.split('\n')
            .filter(value => REG_EXP_LINE_FUNCTION.test(value)
            || REG_EXP_LINE_SIMPLE.test(value));
        let line = stackLines[1 + (goBack || 0)];
        if (!stackLines.length)
            return;
        if (!line)
            return;
        let filename, row, column, func;
        let match = line.match(REG_EXP_LINE_FUNCTION);
        if (match) {
            [, func, filename, row, column] = match;
        }
        else {
            match = REG_EXP_LINE_SIMPLE.exec(line);
            [, filename, row, column] = match || [];
        }
        if (!match)
            return null;
        return {
            error: error,
            line: parseInt(row),
            column: parseInt(column),
            filename: filename,
            func: func
        };
    }
    javascriptLineOf() {
        return this.__lineOf(new Error());
    }
    __tsLine(error, goBack) {
        const sourceMapSupport = require('source-map-support');
        let line = this.__lineOf(error, goBack);
        let typescriptName = this.typescriptOf(line.filename);
        const sourceMap = sourceMapSupport.retrieveSourceMap(line.filename);
        if (!sourceMap && !!(line === null || line === void 0 ? void 0 : line.line) && !!line.filename && line.filename.endsWith(".ts"))
            return { ts: line };
        if (sourceMap) {
            const sourceMapping = sourceMapSupport.mapSourcePosition({
                line: line.line,
                column: 0, // Normalmente, você pode manter a coluna como 0 para obter a coluna correspondente.
                source: typescriptName // Substitua 'seuarquivo.ts' pelo nome correto do arquivo TypeScript.
            });
            return {
                js: line,
                ts: {
                    error: error,
                    line: sourceMapping.line,
                    column: 0,
                    func: null,
                    filename: typescriptName
                }
            };
        }
        return { js: line };
    }
    typescriptLineOf(goBack) {
        var _a;
        return (_a = this.__tsLine(new Error(), goBack)) === null || _a === void 0 ? void 0 : _a.ts;
    }
    lineOf(goBack) {
        let line = this.__tsLine(new Error(), goBack);
        if (line.ts)
            return line.ts;
        else if (line.js)
            return line.js;
    }
    urlOf(line) {
        let file = line.filename;
        let _line = line.line;
        let column = line.column;
        return `${new URL(`file://${file}:${_line}:${column}`).href}`;
    }
}
exports.scriptUtil = new TSUtil();
//# sourceMappingURL=script-util.js.map