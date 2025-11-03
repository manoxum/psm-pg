import {PSMDriver, ModelOptions, PSMGenerator, PSMMigrationResult, PSMExecute} from "@prisma-psm/core";
import {parser} from "./parser/parser";
import {migrate,migrated} from "./migration";
import {sql} from "./parser/sql";
import {dump} from "./dump";



function prepare( model:ModelOptions ){
    if( !model.schema ) model.schema = "public";
}


const driver :PSMDriver = {
    migrated:( opts )=>{
        return migrated( opts );
    },
    migrator: opts => ({
        migrate:() => migrate({ sql: opts.migrate, url: opts.url, label: "NEXT" }),
        test:() => migrate({ sql: opts.check, url: opts.url, label: "TEST" }),
        core:() => migrate({ sql: opts.core, url: opts.url, label: "CORE" }),
        dump:() => dump( opts ),
        async execute(str: string): Promise<PSMExecute> {
            const execute = await migrate({ sql: str, url: opts.url, label: "EXECUTE" });
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
