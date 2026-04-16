"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrate = migrate;
exports.migrated = migrated;
const pg_1 = require("pg");
const escape_1 = require("../utils/escape");
function migrate(opts) {
    return new Promise((resolve) => {
        const response = {
            messages: []
        };
        const client = new pg_1.Client(opts.url);
        client.connect(err => {
            var _a;
            if (err) {
                (_a = response.messages) === null || _a === void 0 ? void 0 : _a.push(`Connection failed: ${err.message}`);
                response.error = err;
                return resolve(response);
            }
            const query = new pg_1.Query(opts.sql);
            query.on("error", err => {
                var _a;
                response.error = err;
                (_a = response.messages) === null || _a === void 0 ? void 0 : _a.push(`${opts.label} migration failed: ${err.message}`);
                console.error(`${opts.label} migration failed`, err);
                client.end(() => { });
                resolve(response);
            });
            query.on("end", () => {
                response.success = true;
                client.end(() => { });
                resolve(response);
            });
            query.on("row", (row, result) => {
            });
            client.on("notice", notice => {
                console.log(`PSM NOTICE: ${notice.message}`);
            });
            client.query(query);
        });
    });
}
function migrated(opts) {
    return new Promise((resolve) => {
        const response = {
            messages: [],
        };
        const client = new pg_1.Client(opts.url);
        client.connect(err => {
            var _a, _b;
            if (err) {
                (_a = response.messages) === null || _a === void 0 ? void 0 : _a.push(`Connection failed: ${err.message}`);
                response.error = err;
                return resolve(response);
            }
            const sys = (0, escape_1.oid)(opts.sys || "sys");
            const values = ((_b = opts.sids) === null || _b === void 0 ? void 0 : _b.length) ? [opts.sids] : [];
            const query = new pg_1.Query({
                text: `
                    select sid, date
                      from ${sys}.migration
                     where ($1::text[] is null or sid = any($1::text[]));
                `,
                values: values.length ? values : [null],
            });
            query.on("error", err => {
                var _a;
                response.error = err;
                (_a = response.messages) === null || _a === void 0 ? void 0 : _a.push(`Load migrated failed: ${err.message}`);
                console.error(`Load migrated failed`, err);
                client.end(err1 => { });
                resolve(response);
            });
            query.on("end", result => {
                response.success = true;
                response.migrated = result.rows;
                client.end(err1 => { });
                resolve(response);
            });
            client.on("notice", notice => {
                console.log(`PSM NOTICE: ${notice.message}`);
            });
            client.query(query);
        });
    });
}
//# sourceMappingURL=index.js.map