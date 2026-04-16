"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexesParser = indexesParser;
const escape_1 = require("../utils/escape");
function resolver(parser, opts) {
    var _a;
    const name = (0, escape_1.oid)(opts.name);
    let fieldsId = "";
    let algorithm = "";
    if (!!((_a = opts.fields) === null || _a === void 0 ? void 0 : _a.length))
        fieldsId = opts.fields.map(escape_1.oid).join(`, `);
    if (!!opts.algorithm)
        algorithm = ` using ${opts.algorithm}`;
    return {
        create_index: () => `create index ${name} on ${(0, escape_1.oid)(parser.shadow)}.${(0, escape_1.oid)(opts.model.temp)}${algorithm} (${fieldsId});`,
        drop_index: () => `drop index if exists ${name} cascade;`,
    };
}
function indexesParser(model, parser) {
    const indexes = model.indexes.filter(field => {
        return field.type === "normal";
    }).map(index => {
        var _a;
        let localField = (_a = index.fields) === null || _a === void 0 ? void 0 : _a.map(next => {
            const field = model.fields.find(value1 => value1.name === next.name);
            if (!field)
                return next.name;
            return field.dbName || field.name;
        });
        let name = index.dbName || index.name;
        let schema = model.schema || "public";
        if (!name)
            name = `idx_${schema}_${model.name}_${localField.join("_")}_by_prisma`;
        return resolver(parser, {
            algorithm: index.algorithm,
            fields: localField,
            name: name,
            model: model,
        });
    });
    return {
        create_index_key: () => {
            if (!indexes)
                return [];
            return indexes.map(value => value.create_index());
        },
        drop_index_key: () => {
            if (!indexes)
                return [];
            return indexes.map(value => value.drop_index());
        },
    };
}
//# sourceMappingURL=indexes.js.map