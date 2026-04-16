"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fieldParser = fieldParser;
const escape_1 = require("../../utils/escape");
const engine_1 = require("./engine");
function fieldParser(opts) {
    var _a;
    const name = (0, escape_1.oid)((_a = opts.dbName) !== null && _a !== void 0 ? _a : opts.name);
    const datatype = (0, engine_1.parseType)(opts);
    let defaults = "", nonnull = "";
    if (opts.isRequired)
        nonnull = " not null";
    if (opts.hasDefaultValue) {
        defaults = (0, engine_1.parseDefault)(opts, datatype.type);
    }
    if (opts.hasDefaultValue && !!defaults.length) {
        defaults = ` default ${defaults}`;
    }
    return {
        declaration: `${name} ${datatype.type}${nonnull}${defaults}`,
        serial: datatype.serial,
        name: opts.name,
        kind: opts.kind,
    };
}
//# sourceMappingURL=field.js.map