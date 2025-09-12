import Path from "path";
import fs from "fs";

export type ScriptLine = {
    line:number,
    filename: string,
    error:Error,
    column:number,
    func:string
}

export type TempScriptOptions = {
    encoding?: BufferEncoding;
    extension?:string,
    prefix?:string,
    suffix?:string,
    noCreate?:boolean
}

const REG_EXP_LINE_FUNCTION = /(.+?) \((.+?):(\d+):(\d+)\)/;
const REG_EXP_LINE_SIMPLE = /at (.+):(\d+):(\d+)/;


class TSUtil {
    typescriptOf( filename:string ){
        let basename = Path.basename( filename, ".js" );
        let tsFile = Path.join( Path.dirname( filename ), `${basename}.ts` );
        if( fs.existsSync( tsFile ) )  return tsFile;
        return  null;
    } private __lineOf( error:Error, goBack?:number ):ScriptLine{
        const stackLines = error.stack.split('\n')
            .filter(
                value => REG_EXP_LINE_FUNCTION.test( value )
                || REG_EXP_LINE_SIMPLE.test( value )
            );

        let line = stackLines[1 + (goBack||0)];
        if( !stackLines.length ) return;
        if( !line ) return;

        let filename, row, column, func;
        let match = line.match(REG_EXP_LINE_FUNCTION);
        if ( match ) {
            [, func, filename, row, column] = match;
        } else {
            match = REG_EXP_LINE_SIMPLE.exec(line);
            [, filename, row, column ] = match||[];
        }

        if( !match ) return null;
        return  {
            error: error,
            line: parseInt( row ),
            column: parseInt( column ),
            filename: filename,
            func: func
        }
    } javascriptLineOf(){
        return this.__lineOf( new Error() );
    } private __tsLine( error:Error, goBack:number ):{
        ts?:ScriptLine,
        js?:ScriptLine
    }{
        const sourceMapSupport = require( 'source-map-support' );
        let line = this.__lineOf( error, goBack );
        let typescriptName = this.typescriptOf( line.filename);
        const sourceMap = sourceMapSupport.retrieveSourceMap( line.filename );
        if( !sourceMap && !!line?.line && !!line.filename && line.filename.endsWith(".ts")) return { ts:line };

        if (sourceMap) {
            const sourceMapping = sourceMapSupport.mapSourcePosition({
                line: line.line,
                column: 0, // Normalmente, você pode manter a coluna como 0 para obter a coluna correspondente.
                source: typescriptName // Substitua 'seuarquivo.ts' pelo nome correto do arquivo TypeScript.
            });
            return  {
                js: line,
                ts:{
                    error:error,
                    line: sourceMapping.line,
                    column: 0,
                    func: null,
                    filename: typescriptName
                }
            }
        }
        return { js: line };
    } typescriptLineOf( goBack?:number ):ScriptLine{
        return this.__tsLine( new Error(), goBack)?.ts;
    } lineOf( goBack?:number ):ScriptLine {
        let line = this.__tsLine( new Error(), goBack );
        if( line.ts ) return line.ts;
        else if( line.js ) return line.js;
    }
    urlOf( line:ScriptLine ){
        let file = line.filename;
        let _line = line.line;
        let column = line.column;
        return `${ new URL(`file://${file}:${_line}:${column}`).href }`;
    }

}

export const scriptUtil = new TSUtil();

