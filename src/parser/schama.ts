import {PostgresParserOptions} from "./def";
import {oid} from "../utils/escape";

export function schema( parser:PostgresParserOptions ){
    let schemas = new Set<string>();
    parser.models.forEach( value => {
        let schema = value.schema||"public";
        if( !schemas.has( schema ) ) schemas.add( schema);
    });

    return [...schemas].map( value => {
        return `create schema if not exists ${oid(value)};`
    });
}