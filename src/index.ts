import {PSMDriver, ModelOptions, PSMGenerator, PSMMigrationResult} from "@prisma-psm/core";
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
        dump:() => dump( opts )
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
