"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tableParser = tableParser;
const escape_1 = require("../utils/escape");
const field_1 = require("./table/field");
const notice_1 = require("./notice");
function tableParser(model, parser) {
    const fieldSQL = model.fields.map(field_1.fieldParser);
    return {
        drop_table: () => ([
            (0, notice_1.notice)(`DROP TABLE ${model.schema}.${model.name} OF MODEL ${model.model}`),
            `drop table if exists ${(0, escape_1.oid)(model.schema)}.${(0, escape_1.oid)(model.name)} cascade;`,
            (0, notice_1.notice)(`DROP TABLE ${model.schema}.${model.name} OF MODEL ${model.model} OK`),
        ]),
        allocate_table: () => [
            (0, notice_1.notice)(`ALLOCATE TABLE ${model.temp} OF MODEL ${model.model}`),
            `alter table ${(0, escape_1.oid)(parser.shadow)}.${(0, escape_1.oid)(model.temp)} set schema ${(0, escape_1.oid)(model.schema)};`,
            `alter table ${(0, escape_1.oid)(model.schema)}.${(0, escape_1.oid)(model.temp)} rename to ${(0, escape_1.oid)(model.name)} ;`,
            (0, notice_1.notice)(`ALLOCATE TABLE ${model.temp} OF MODEL ${model.model} OK`),
        ],
        create_table: () => {
            let fields = [...fieldSQL.filter(value => value.kind === "scalar").map(value => `  ${value.declaration}`)].join(",\n");
            return [
                (0, notice_1.notice)(`CREATE TABLE ${model.temp} OF MODEL ${model.model}`),
                `create table ${(0, escape_1.oid)(parser.shadow)}.${(0, escape_1.oid)(model.temp)} (\n${fields} \n);`,
                (0, notice_1.notice)(`CREATE TABLE ${model.temp} OF MODEL ${model.model} OK`),
            ];
        }
    };
}
//# sourceMappingURL=table.js.map