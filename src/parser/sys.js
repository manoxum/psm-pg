"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareCore = prepareCore;
exports.createMigration = createMigration;
exports.createRevision = createRevision;
const escape_1 = require("../utils/escape");
const tabs_1 = require("../utils/tabs");
function prepareCore(opts) {
    const sys = (0, escape_1.oid)(opts.sys);
    const tab = "         ";
    return (0, tabs_1.noTab)([
        `create schema if not exists ${sys};`,
        `create table if not exists ${sys}.migration(
            sid character varying not null primary key,
            date timestamptz not null default clock_timestamp()
         );`,
        `create table if not exists ${sys}.revision(
            hash character varying not null primary key,
            migration_sid character varying not null references ${sys}.migration,
            date timestamptz not null default clock_timestamp(),
            operation character varying not null,
            relation character varying not null,
            revision character varying
         );`,
    ], tab);
}
function createMigration(opts) {
    const sys = (0, escape_1.oid)(opts.sys);
    const migration = (0, escape_1.lit)(opts.migration);
    const tab = "         ";
    return (0, tabs_1.noTab)([
        `insert into ${sys}.migration ( sid ) values ( ${migration} );`,
    ], tab);
}
function createRevision(opts, operation) {
    const sys = (0, escape_1.oid)(opts.sys);
    const tab = "         ";
    operation = Object.assign(Object.assign({}, operation), { migration_sid: opts.migration });
    const keys = Object.keys(operation);
    const columns = keys.map(value => (0, escape_1.oid)(value)).join(", ");
    const values = keys.map(value => {
        if (!operation[value])
            return `null`;
        return (0, escape_1.lit)(operation[value]);
    }).join(", ");
    return (0, tabs_1.noTab)([
        `insert into ${sys}.revision ( ${columns} ) values ( ${values} );`,
    ], tab);
}
//# sourceMappingURL=sys.js.map