import {PSMDriver, ModelOptions, PSMGenerator, PSMMigrationResult, PSMExecute, CustomScript} from "@prisma-psm/core";
import {parser} from "./parser/parser";
import {migrate,migrated} from "./migration";
import {sql} from "./parser/sql";
import {dump} from "./dump";
import * as child from "node:child_process";




function prepare( model:ModelOptions ){
    if( !model.schema ) model.schema = "public";
}

function executeRaw( scripts: CustomScript[] ): string{
    const sql:string[] = [];
    if( !!scripts && !Array.isArray( scripts ) ) throw new Error(`dsds ds dsdsdsds ${typeof scripts}`);
    if( !scripts || !Array.isArray(scripts) || !scripts.length ) return null;
    scripts.forEach(value => {
        const filename:string = value.filename;
        sql.push(`-- =============================== ${value.filename } ========================================` );
        sql.push(`do $$ begin  raise notice '%', format( 'Iniciando a execução do script ${filename}...'); end; $$;`);
        sql.push( value.raw.endsWith(";")? value.raw: `${value.raw};`)
        sql.push(`do $$ begin  raise notice '%', format( 'Iniciando a execução do script ${filename}... [OK]'); end; $$;`);
        sql.push("" );
        sql.push("" );
        sql.push("" );
    });
    return sql.join("\n");
}

const driver :PSMDriver = {
    migrated:( opts )=>{
        return migrated( opts );
    },
    migrator: opts =>({
        restore(backup: string) {
            return  new Promise( resolve => {
                console.log(`RESTORE ${backup} TO ${opts.url}`);
                const psql = child.spawn( "psql", [
                    "-d", `${opts.url}`,
                    "-f", backup
                ]);
                psql.stdout.on( "data", chunk => {
                    console.log( `psql>> ${chunk.toString()} `);
                });
                psql.stderr.on( "data", chunk => {
                    console.log( `psql:err>> ${chunk.toString()} `);
                });
                psql.on( "exit", code => {
                    if( code === 0 ) return resolve({result:true})
                    else resolve({result:false})
                });
            });

        },
        migrate:( custom ) => {
            const sql = [];
            sql.push( opts.migrate );
            [ "functions", "triggers", "views" ].forEach( group => {
                const raw = executeRaw( custom?.resources?.[group])
                if( !!raw ) sql.push( raw );
            });

            return migrate({ sql: sql.join(";\n"), url: opts.url, label: "NEXT" });
        },
        migrateRaw:( custom ) => {
            const sql = [];
            sql.push( opts.migrate );
            [ "functions", "triggers", "views" ].forEach( group => {
                const raw = executeRaw( custom?.resources?.[group])
                if( !!raw ) sql.push( raw );
            });
            return sql.join(";\n");
        },
        test:() => migrate({ sql: opts.check, url: opts.url, label: "TEST" }),
        core:() => migrate({ sql: opts.core, url: opts.url, label: "CORE" }),
        dump:() => dump( opts ),
        executeRaw,
        async execute(str: CustomScript[]): Promise<PSMExecute> {
            const execute = await migrate({
                sql: executeRaw(str),
                url: opts.url,
                label: "EXECUTE"
            });
            return {
                error: execute.error,
                messages: execute.messages,
                success: !execute.error
            }
        }
    }),

    generator:(opts) => {
        let response = parser(opts);
        const generator: PSMGenerator = {
            migrate: () => sql( { mode: "migrate" }, response),
            check: () => sql( { mode: "check" }, response),
            core: () => sql( { mode: "core" }, response)
        }
        return generator;
    },
    prepare,
}
export = driver
