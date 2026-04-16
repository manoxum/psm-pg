"use strict";
// import {Escape, lit, oid, SQL} from "../utils/escape";
// import {ScriptLine, scriptUtil} from "../utils/script-util";
// import {QueryBuilderResult} from "@prisma-psm/core";
//
// export function literalEscape ( value:any){
//     let textValue;
//     if( value === null || value === undefined) textValue = "null";
//     else if( typeof value === "string") textValue = lit( value );
//     else if( typeof value === "number") textValue =  value;
//     else if( typeof value === "boolean") textValue = value;
//     else if( typeof value === "object") textValue = lit( JSON.stringify( value ));
//     return textValue;
// }
//
//
//
// export type PreparedQuery = {
//     query:string,
//     values:any[],
//     line:ScriptLine
// }
//
// const CHECK =  Symbol("check" );
//
//
// export class PostgresQueryBuilderResult implements QueryBuilderResult{
//     escaped:any[];
//     piece:boolean
//     template:string[];
//     private _query:string;
//     public line:ScriptLine;
//
//     constructor(template:TemplateStringsArray|string|string[], escaped:any[], line:ScriptLine ) {
//         if( !line || !line?.filename ) throw new Error( `Script line is not declared` );
//         if( line.filename.startsWith("node:internal")){
//             throw new Error( `Invalid script line is internal capture`);
//         }
//
//         if( !escaped ) escaped = [];
//         if( !template ) template = [];
//         this.template = [];
//         this.escaped = [];
//
//         let hasTemplate = !!template?.length;
//         let hasValue = !!escaped?.length;
//         let hasCheck = !!arguments[2] || arguments[2] === CHECK;
//         if( !hasTemplate && !hasCheck ) throw new Error( "Invalid Builder" );
//
//
//         if( typeof template === "string" ){
//             this._query = template;
//         } else {
//             this.template.push( ...template);
//         }
//         this.escaped.push( ...escaped );
//         this.line = line;
//     }
//
//     get builderParts(){
//         if( this.pieces.length+1 !== this.template.length ) throw new Error( "Inconsistency template builder" );
//
//         let list:any[] = [];
//         this.template.forEach( (value, index) => {
//             list.push( value );
//             if( index < this.pieces.length ) list.push( this.pieces[ index ]);
//         });
//         return list;
//     }
//
//
//     parameterizedQuery():PreparedQuery{
//         if( !!this._query ){
//             let values = this.values.map( value => {
//                 if( value instanceof Escape ) return value.value;
//                 else return value;
//             })
//             return {
//                 query: this._query,
//                 values: values,
//                 line: this.line
//             };
//         } else {
//             let argIndex = 1;
//             let queryParts = this.builderParts.map( (value, index) => {
//                 if( (index %2) === 0 ){
//                     return value;
//                 }
//
//                 if( value instanceof Escape && value.mode === "type" && value.asArray){
//                     return '$'+(argIndex++)+"::"+value.type+"[]";
//                 } else if( value instanceof Escape && value.mode === "type" ){
//                     return '$'+(argIndex++)+"::"+value.type;
//                 }
//
//                 if( value instanceof Escape && value.mode === "identifier" ){
//                     return oid( value.value );
//                 }
//
//                 if( value === null || value === undefined){
//                     return "null";
//                 } else {
//                     return '$'+(argIndex++);
//                 }
//             });
//
//             let values = this.values.filter( value => {
//                 if( value instanceof Escape && value.mode === "identifier" ) return;
//                 else return value !== null && value !== undefined;
//             }).map( value => {
//                 if( value instanceof Escape  ) {
//                     if( value.value === null || value.value === undefined ) return null;
//                     if( value.type === "jsonb" && typeof value.value === "object" ) return JSON.stringify( value.value );
//                     if( value.type === "json" && typeof value.value === "object" ) return JSON.stringify( value.value );
//                     return value.value;
//                 }
//                 else return value;
//             })
//
//             return {
//                 query: queryParts.join(""),
//                 values: values,
//                 line: this.line
//             }
//         }
//     }
//
//     add( sqlPart:string, sqlValue:any ){
//         this.template.push( sqlPart );
//         this.values.push( sqlValue );
//     }
//     noParameterizedQuery():PreparedQuery{
//         if( !!this._query ){
//             return {
//                 line: this.line,
//                 query: this._query,
//                 values: null
//             };
//         } else {
//             let queryParts = this.builderParts.map( (value, index) => {
//                 let _scape;
//                 if ((index % 2) === 0) {
//                     return value;
//
//                 }else if( value instanceof Escape && value.mode === "literal") {
//                     return lit( value.value?.toString?.()||null )
//                 } else if( value instanceof Escape && (value.mode === "unsafe" ||  value.mode === "keyword")){
//                     _scape = value.value;
//                 } else if( value instanceof Escape && value.mode === "type" ){
//                     let preEscape = value.literal();
//                     let textValue = literalEscape( preEscape );
//                     // let textValue = value.literal();
//                     let _as = "";
//                     if( value.type && value.type.length && value.asArray ) _as = `::${value.type}[]`;
//                     else if( value.type && value.type.length ) _as = `::${value.type}`;
//                     _scape =  textValue+_as;
//                 } else if( value instanceof Escape && value.mode === "identifier" ){
//                     _scape= oid( value.value );
//                 } else {
//                     _scape = literalEscape( value )
//                 }return _scape;
//             });
//
//             let str = queryParts.join("");
//             return {
//                 query: str,
//                 values: null,
//                 line: this.line
//             }
//         }
//     }
//
//
//     push( ...builders:QueryBuilderResult[] ){
//         let _push = ( outsideBuilder:QueryBuilderResult)=>{
//             let checkOutsideBuilder = this.checkSupportedJoin( outsideBuilder );
//             if( !checkOutsideBuilder ) throw new Error( "Unsupported outside builder" );
//             let checkSelfBuilder = this.checkSupportedJoin( this );
//             if( !checkSelfBuilder ) {
//                 throw new Error("Current builder no support join");
//             }
//
//             if( !checkSelfBuilder.hasTemplate ) {
//                 this.template = [];
//                 if( checkSelfBuilder.hasQuery ){
//                     this.template.push( this._query );
//                     this._query = null;
//                 }
//             }
//
//             let selfTemplate = this.template;
//             let outsideTemplate = outsideBuilder.template;
//             if( !checkOutsideBuilder.hasTemplate ){
//                 outsideTemplate = [ outsideBuilder._query ];
//             }
//
//             outsideTemplate.forEach((element, elementIndex) => {
//                 if(selfTemplate.length > 0 && elementIndex===0 ){
//                     let lastElementResult = selfTemplate[selfTemplate.length - 1];
//                     lastElementResult = lastElementResult.trimEnd();
//                     if( lastElementResult[lastElementResult.length-1] !== ";" && !outsideBuilder.piece ) lastElementResult+= ";"
//                     selfTemplate[selfTemplate.length - 1] = lastElementResult+ "\n\n"+ element.trimStart();
//                     return
//                 }
//                 selfTemplate.push( element );
//
//             });
//             this.values.push( ... outsideBuilder.values );
//         }
//         builders.forEach( value => _push( value ) );
//     }
//
//     private checkSupportedJoin( builder:PostgresQueryBuilderResult ){
//         let hasTemplate = !!builder.template && !!builder.template.length;
//         let hasQuery = !!builder._query && !!builder._query.length;
//         let hasValues = !!builder.values && !!builder.values.length && builder.values.length > 0
//         if( !hasTemplate && hasValues ) return false;
//         return { hasTemplate, hasQuery, hasValues };
//
//     }
// }
// export function sql( sqlTemplate:TemplateStringsArray, ...values:any[]):QueryBuilderResult{
//     let line = scriptUtil.lineOf( 1 );
//     return new PostgresQueryBuilderResult(sqlTemplate, values.map(value => {
//         if (value instanceof Escape) return value
//         else return SQL.any(value)
//     }), line);
// }
//
//
// sql.joins = ( ...builders:QueryBuilderResult[] )=>{
//     let builder = builders.shift();
//     if( !!builder && builders.length ) builder.push( ...builders );
//     return builder;
// }
//
// sql.join = ( builders:QueryBuilderResult[] )=>{
//     return sql.joins( ...(builders||[]) );
// }
//
// export function noAutoEscapeSql( sqlTemplate:TemplateStringsArray, ...values):PostgresQueryBuilderResult{
//     let line = scriptUtil.lineOf( 1 );
//     return new PostgresQueryBuilderResult( sqlTemplate, values, line );
// }
//
// export function queryJoin( ...prepared:QueryBuilderResult[] ):PostgresQueryBuilderResult {
//     if( !prepared || !prepared.length ) throw new Error( "Query join is empty!");
//     let superList = prepared;
//     // @ts-ignore
//     let joins = new QueryBuilderResult(undefined,undefined, prepared[ 0 ].line );
//     superList.forEach( builder => {
//         joins.push( builder );
//     });
//     return joins;
// }
//# sourceMappingURL=sql-builder.js.map