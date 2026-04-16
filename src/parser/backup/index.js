"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupParser = backupParser;
const engine_1 = require("./engine");
const field_1 = require("../table/field");
function backupParser(model, parser) {
    const fieldSQL = model.fields.map(field_1.fieldParser);
    return {
        lockTable: () => (0, engine_1.lockTable)({
            source: model.name,
            model: model,
            parser: parser,
        }),
        restore_backup: () => (0, engine_1.restoreBackupSQL)({
            source: model.name,
            model: model,
            parser: parser,
        }),
        restore_serial: () => {
            const sequences = [];
            fieldSQL.filter(f => f.serial).map(f => (0, engine_1.restoreSerialSQL)({
                source: model.name,
                parser: parser,
                model: model,
                from: f.name,
                to: f.name,
            })).forEach(value => {
                sequences.push(...value);
            });
            return sequences;
        },
    };
}
//# sourceMappingURL=index.js.map