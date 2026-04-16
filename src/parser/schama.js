"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = schema;
const escape_1 = require("../utils/escape");
function schema(parser) {
    let schemas = new Set();
    parser.models.forEach(value => {
        let schema = value.schema || "public";
        if (!schemas.has(schema))
            schemas.add(schema);
    });
    return [...schemas].map(value => {
        return `create schema if not exists ${(0, escape_1.oid)(value)};`;
    });
}
//# sourceMappingURL=schama.js.map