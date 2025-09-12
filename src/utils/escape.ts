import * as pg from "pg";

const RESERVED_WORDS = new Set([
    "all", "analyse", "analyze", "and", "any", "array", "as", "asc", "asymmetric",
    "authorization", "binary", "both", "case", "cast", "check", "collate", "column",
    "constraint", "create", "current_catalog", "current_date", "current_role",
    "current_time", "current_timestamp", "current_user", "default", "deferrable",
    "desc", "distinct", "do", "else", "end", "except", "false", "fetch", "for",
    "foreign", "from", "grant", "group", "having", "in", "initially", "intersect",
    "into", "leading", "limit", "localtime", "localtimestamp", "not", "null", "offset",
    "on", "only", "or", "order", "placing", "primary", "references", "returning",
    "select", "session_user", "some", "symmetric", "table", "then", "to", "trailing",
    "true", "union", "unique", "user", "using", "variadic", "verbose", "when", "where",
    "window", "with"
]);

const IDENTIFIER_REGEX = /^[a-z_][a-z0-9_$]*$/i; // Regra para identificadores PostgreSQL


export function oid(string: string): string {
    if (!string){
        throw new Error("Invalid Object identifier name!");
    }

    const isValidIdentifier = IDENTIFIER_REGEX.test(string);
    const isReservedWord = RESERVED_WORDS.has(string.toLowerCase());

    if (isValidIdentifier && !isReservedWord) {
        return string;
    }

    return pg.escapeIdentifier(string);
}
export function lit(string: string, type?:string ) {
    let _type = "";
    if ( !!type && typeof type === "string" ) _type = `::${type}`;
    if (string === null || string === undefined) return `null${_type}`;
    return `${pg.escapeLiteral(string)}${_type}`;
}

export const VARCHAR="varchar";
export const TEXT="text";
export const DOUBLE="double precision";
export const NUMERIC="numeric";

//
// import PGDataType from "../sql/catalog-maps";
//

//
//
//

//
//
// export function ObjectArray <T>( value:{[p:string]:T}, callback:( key, value:T )=> void){
//     if( !value ) return;
//     Object.entries( value ).forEach( ([key, value ]) => {
//         callback( key, value );
//     })
// }
//
//
// export function literalArray( value:any, type:string, recursive?:boolean, recursiveSystanx?:boolean ):string {
//     if( value === null || value === undefined ) return  `null`;
//     if( !Array.isArray( value ) ) throw new Error( `Value of ${ value?.toString?.() } is not array` );
//     let cast = ( next:any )=>{
//         let isArray:boolean;
//         if( recursive && Array.isArray( next ) ){
//             next = next.map( element => cast( element ) );
//             isArray = true;
//         } else if( recursive && !!next && typeof  next === "object" && !Array.isArray( next ) ){
//             ObjectArray( next, ( key, element ) => {
//                 next[ key ] = cast( element );
//             });
//         }
//         let literal = JSON.stringify( next );
//         if( recursive && recursiveSystanx && isArray ) literal = `{${literal.substring(1, literal.length-1 )}}`;
//         return literal;
//     }
//
//     let result = cast( value );
//     result =  `{${result.substring(1, result.length-1 )}}`;
//     return  result;
// }
//
//
// export class Escape<S> {
//     type:string;
//     mode:"type"|"identifier"|"unsafe"|"keyword"|"literal";
//     value:S;
//     asArray:boolean
//     variadic:boolean
//     constructor(type: string, mode: "type" | "identifier" | "unsafe" | "keyword"|"literal", value: S, array:boolean, variadic:boolean ) {
//         if( mode === "identifier" && !value ) throw new Error ( "Valor invalido para identifier");
//         if( typeof value === "number" && Number.isNaN( value ) ) throw new Error( `Number values is NaN!` );
//
//         this.type = type;
//         this.mode = mode;
//         this.value = value;
//         this.asArray = array;
//         this.variadic = variadic;
//
//         try {
//             JSON.stringify( this.value );
//         } catch (e) {
//             console.error( `Parse value error: Value`, this.value );
//             throw e;
//         }
//     }
//
//     literal(){
//         if( this.mode === "unsafe" ) return this.value;
//         if( this.mode === "keyword" ) return this.value;
//         if( this.mode === "literal" ) return lit( this.value?.toString?.()||null );
//
//         // console.log( "//Resolve nulls")
//         if( this.value === null || this.value === undefined ) return  `null`;
//
//         // console.log( "//Resolve JSON arrays", this.asArray, this.type)
//         if( this.asArray && [ "json", "jsonb" ].includes( this.type ) ) return literalArray( this.value, this.type, false, false );
//
//         // console.log( "//Resolve arrays", this.asArray, this.type)
//         if( this.asArray ) return  literalArray( this.value, this.type, true, true );
//
//         // console.log( "//Resolve numbers types")
//         if( typeof this.value === "number" ) return `${ this.value }`;
//
//         // console.log("//Resolve string")
//         if( typeof this.value === "string" ) return this.value;
//
//         // console.log( "//Resolve boolean")
//         if( typeof this.value === "boolean" ) return `${Boolean(this.value)}`;
//
//         // console.log("//Resolve other types")
//         if( typeof this.value === "object" ) return JSON.stringify( this.value );
//
//         throw  new Error( `Valor não esperado para ser tratado ${ this.value } as type ${ this.type } in mode ${ this.mode }!` );
//     }
// }
//
// export const TypeFamilyCollection = {
//     UUID :[ "uuid" ] as const,
//     Integer :[ "int2", "smallint", "int", "int4", "integer", "int8", "bigint" ] as const,
//     Real :[ "double", "numeric", "float", "money" ] as const,
//     Text :[ "varchar", "character varying", "text" ] as const,
//     Document : [ "json", "jsonb" ] as const,
//     DocumentArray : [ "json_array", "jsonb_array" ] as const,
//     Time :[ "time", "timetz" ] as const,
//     Date :[ "date" ] as const,
//     DateTime :[ "timestamp", "timestamptz" ] as const,
//     Boolean: [ "boolean", "bool" ] as const
// } as const;
//
// type EscapeMap = {
//     [ K in typeof TypeFamilyCollection[keyof typeof TypeFamilyCollection ][number]&keyof PGDataType]:(
//         args: PGDataType[K]|(PGDataType[K])[]
//     ) => Escape<PGDataType[K]>
// } & {
//     identifier( object:string):Escape<string>
//     unsafe( expression:string):Escape<string>
//     keyword( keyword:string):Escape<string>
//     literal( keyword:string):Escape<string>
//     any<T>( object:T ):Escape<T>
//     anyOf<T>( object:T, format:string ):Escape<T>
// }
//
// let checkIsValidNumber=( arg )=>{
//     if( arg === null ) return true;
//     let num:number = Number( arg );
//     return  !Number.isNaN( num ) && Number.isFinite( num);
// }
//
//
// function transformValues( array, transform:( original )=> any ){
//     return array.map( check => {
//         if( check === undefined || check === null ) return null;
//         if( Array.isArray( check ) ) return transformValues( check, transform );
//         return  transform(check);
//     });
// }
//
// function hasInvalidValueInArray( array:any[], check:( arg )=> boolean ){
//     return !!array.find(value => {
//         if (value === null) return false;
//         if (Array.isArray(value)) return hasInvalidValueInArray(value, check);
//         let valid = check(value);
//         return !valid;
//     });
// }
//
// function createEscape( value, type, variadic, transform:( original )=>any, check:( arg )=> boolean ){
//     if( value === null || value === undefined )
//         return  new Escape( type, "type", value, false, variadic );
//     if( Array.isArray( value ) ){
//         let array = transformValues( value, transform );
//         if( hasInvalidValueInArray( array , check ) )  throw new Error( `Invalid scape value ${ value } ${type} in array` );
//         return new Escape( type, "type", value, true, variadic );
//     }
//     let checked = transformValues([ value ], transform );
//     if( hasInvalidValueInArray( checked, check ) ) throw new Error( `Invalid scape value ${ value } TO ${type}`  );
//     return  new Escape( type, "type", checked[ 0 ], false, false );
// }
// export const SQL:EscapeMap= {} as any;
//
// [
//     TypeFamilyCollection.Integer,
//     TypeFamilyCollection.Real,
// ].forEach( collection => {
//     collection.forEach( type => {
//         SQL[ type ] = ( value, variadic )=>{
//             return createEscape(value, type, variadic, original => Number(original), checkIsValidNumber);
//         }
//     });
// });
//
//
// [
//     TypeFamilyCollection.Text,
//     TypeFamilyCollection.UUID,
// ].forEach( collection => {
//     collection.forEach( type => {
//         SQL[ type ] = (( value, variadic )=>{
//             return createEscape( value, type, variadic, original => original, arg => typeof arg === "string" );
//         }) as any
//     });
// });
//
//
//
// [
//     TypeFamilyCollection.Document,
// ].forEach( collection => {
//     collection.forEach( type => {
//         SQL[ type ] = (( value, variadic )=>{
//             let escape =  createEscape( value, type, variadic, original => original, arg => true );
//             escape.asArray = false;
//             return escape;
//         }) as any
//
//         SQL[ `${type}_array` ] = (( value, variadic )=>{
//             let escape =  createEscape( value, type, variadic, original => original, arg => true );
//             escape.asArray = true;
//             return escape;
//         }) as any
//     });
// });
//
// [
//     TypeFamilyCollection.Time,
//     TypeFamilyCollection.Date,
//     TypeFamilyCollection.DateTime
// ].forEach( collection => {
//     collection.forEach( type => {
//         SQL[ type ] = ( value, variadic )=>{
//             return createEscape( value, type, variadic, original => original, arg => true );
//         }
//     });
// });
//
// [
//     TypeFamilyCollection.Boolean
// ].forEach( collection => {
//     collection.forEach( type => {
//         SQL[ type ] =( ( value, variadic )=>{
//             return createEscape( value, type, variadic, original => !!original, arg => true );
//         }) as any
//     });
// });
//
//
//
// export function anyNumber( value ){
//     if( Number.isNaN( value ) ) return SQL.numeric( value );
//     let _asReal = ()=>{
//
//         /*
//         //TODO reforçar outras validação para double precision|real|decimal
//         decimal	variable	user-specified precision, exact	up to 131072 digits before the decimal point; up to 16383 digits after the decimal point
//         numeric	variable	user-specified precision, exact	up to 131072 digits before the decimal point; up to 16383 digits after the decimal point
//         real	4 bytes	variable-precision, inexact	6 decimal digits precision
//         double precision	8 bytes	variable-precision, inexact	15 decimal digits precision
//          */
//         return SQL.numeric( value );
//     }
//     let _asInteger = ()=>{
//         let _subtype:("numeric"|"integer"|"bigint") & keyof typeof SQL = "integer";
//         /*
//             //TODO reforçar outras validação para smallint|integer|bigint
//             smallint	2 bytes	small-range integer	-32768 to +32767
//             integer	4 bytes	typical choice for integer	-2147483648 to +2147483647
//             bigint	8 bytes	large-range integer	-9223372036854775808 to 9223372036854775807
//          */
//
//         if( value >= -2147483648 && value <= +2147483647 ) _subtype = "integer";
//         else if( value >= -9223372036854775808 && value <= 9223372036854775807 ) _subtype = "bigint";
//         else _subtype = "numeric";
//         // @ts-ignore
//         return SQL[_subtype]( value );
//     }
//
//     let parts = `${ value }`.split(".");
//     if( parts.length === 2 ) return _asReal()
//     else return _asInteger();
//
// }
//
// export function anyObject( value:any ){
//     if( Array.isArray( value ) ) {
//         let _determineType = ( next:any[] )=>{
//             let determined = next.map( element => {
//                 if( typeof element === "string" ) return "text";
//                 if( typeof element === "boolean" ) return "boolean";
//                 if( typeof element === "number" ) return "number";
//                 if( !element && typeof element === "object" && !Array.isArray( element ) ) return "jsonb";
//                 if( Array.isArray( element ) ) return _determineType( element );
//             }).filter( determined => !!determined );
//             if( determined.length ) return determined[0];
//             return null;
//         };
//
//         let type = _determineType( value );
//         if( !type ) type = "text";
//         return SQL[type](value);
//     } else return SQL.jsonb( value );
// }
//
//
//
// //Any Type Scape
// SQL["any"]=<T>( value:T )=>{
//     if( value === null || value === undefined ) return  SQL.text( value as string );
//     if( typeof value === "string" ) return SQL.text( value );
//     if( typeof value === "boolean" ) return SQL.boolean( value );
//     if( typeof value === "number" ) return anyNumber( value );
//     if( typeof value === "object" ) return anyObject( value );
//     throw  new Error( `Valor não esperado para ser tratado ${ value }!` );
// }
//
// //Any Type Scape
// SQL["anyOf"]=<T>( value:T, format:string )=>{
//     let any = SQL.any( value );
//     any.type = format;
//     return any;
// }
//
//
// //Special Scape
// SQL["identifier"]=( value:string )=>{
//     if( !value ) throw new Error( "Invalid Value for Identifier" );
//     return new Escape( null, "identifier", value, false, false );
// }
//
// SQL["unsafe"]=( value:string )=>{
//     return new Escape( null, "unsafe", value, false, false );
// }
//
// SQL["keyword"]=( value:string )=>{
//     return new Escape( null, "keyword", value, false, false );
// }
// SQL["literal"]=( value:string )=>{
//     return new Escape( null, "literal", value, false, false );
// }
