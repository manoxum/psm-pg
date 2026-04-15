import {ParserResult} from "./parser";

export interface SQLOptions {
    mode: "check"|"migrate"|"core"
}
export function sql( opts: SQLOptions, response: ParserResult ) {
    const commands:string[] = [];
    const includeCore = opts.mode === "core";
    const includeShadow = opts.mode !== "core";
    const includeMigrate = opts.mode === "migrate";
    const includeCheck = opts.mode === "check";
    const parsed = response.parsedList;

    commands.push( `/*
      @PSM - Prisma SAFE MIGRATE
      @author zootakuxy
      @automation cli psm
      @mode ${ opts.mode }
      @date ${ new Date().toISOString() }
    */`);

    if (includeCore) {
        commands.push(...response.core.structure);
        commands.push(...response.core.functions);
    }
    if (includeMigrate) commands.push(...response.core.migration);
    if (includeShadow) commands.push(...response.shadow.create);

    for (const value of parsed) {
        if (includeMigrate || includeCheck) {
            if (value.table.create.length) commands.push(...value.table.create);

            if (value.backup?.restore?.data?.length) {
                if (includeMigrate && value.backup.lock.length) commands.push(...value.backup.lock);
                commands.push(...value.backup.restore.data);
                if (includeMigrate && value.backup.restore.registry.length) {
                    commands.push(...value.backup.restore.registry);
                }
            }

            if (value.backup.restore_serial.length) commands.push(...value.backup.restore_serial);
            if (value.indexes.create.length) commands.push(...value.indexes.create);
            if (value.primary.create.length) commands.push(...value.primary.create);
            if (value.unique.create.length) commands.push(...value.unique.create);
            if (value.foreign.create.length) commands.push(...value.foreign.create);
        }
    }

    if (includeMigrate) {
        commands.push(...response.core.schema);
        for (const value of parsed) {
            if (value.foreign.drop.length) commands.push(...value.foreign.drop);
            if (value.unique.drop.length) commands.push(...value.unique.drop);
            if (value.primary.drop.length) commands.push(...value.primary.drop);
            if (value.indexes.drop.length) commands.push(...value.indexes.drop);
            if (value.table.drop.length) commands.push(...value.table.drop);
            if (value.table.allocate.length) commands.push(...value.table.allocate);
            if (value.backup.clean.length) commands.push(...value.backup.clean);
        }
    }

    if (includeShadow) commands.push(...response.shadow.drop);

    return commands.join("\n");
}
