"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.constraintsParser = constraintsParser;
const escape_1 = require("../utils/escape");
const notice_1 = require("./notice");
function resolver(parser, opts) {
    var _a, _b;
    const name = (0, escape_1.oid)(opts.name);
    let refFields = "";
    let fieldsId = "";
    let refModel = "";
    let refModelSchema = "";
    if (!!((_a = opts.refFields) === null || _a === void 0 ? void 0 : _a.length))
        refFields = opts.refFields.map(escape_1.oid).join(`, `);
    if (!!((_b = opts.fields) === null || _b === void 0 ? void 0 : _b.length))
        fieldsId = opts.fields.map(escape_1.oid).join(`, `);
    if (!!opts.refModel)
        refModel = (0, escape_1.oid)(opts.refModel);
    if (!!opts.refModelSchema)
        refModelSchema = (0, escape_1.oid)(opts.refModelSchema);
    const EVENT_MAPS = {
        Cascade: "CASCADE",
        NoAction: "NO ACTION",
        Restrict: "RESTRICT",
        SetDefault: "SET DEFAULT",
        SetNull: "SET NULL",
    };
    return {
        create_primary: () => ([
            (0, notice_1.notice)(`CREATE PRIMARY KEY ${name} OF MODEL ${opts.model.model}`),
            `alter table if exists ${(0, escape_1.oid)(parser.shadow)}.${(0, escape_1.oid)(opts.model.temp)} add constraint ${name} primary key (${fieldsId});`,
            (0, notice_1.notice)(`CREATE PRIMARY KEY ${name} OF MODEL ${opts.model.model} OK!`),
        ]),
        create_foreign: () => {
            let onDelete = "";
            let onUpdate = "";
            if (opts.relationOnDelete)
                onDelete = ` ON DELETE ${EVENT_MAPS[opts.relationOnDelete]}`;
            if (opts.relationOnUpdate)
                onDelete = ` ON UPDATE ${EVENT_MAPS[opts.relationOnUpdate]}`;
            return [
                (0, notice_1.notice)(`CREATE FOREIGN KEY ${name} OF MODEL ${opts.model.model}`),
                `alter table if exists ${(0, escape_1.oid)(parser.shadow)}.${(0, escape_1.oid)(opts.model.temp)} add constraint ${name} foreign key (${fieldsId}) references ${refModelSchema}.${refModel} ( ${refFields} )${onDelete}${onUpdate};`,
                (0, notice_1.notice)(`CREATE FOREIGN KEY ${name} OF MODEL ${opts.model.model} OK!`),
            ];
        },
        create_unique: () => ([
            (0, notice_1.notice)(`CREATE UNIQUE KEY ${name} OF MODEL ${opts.model.model}`),
            `alter table if exists ${(0, escape_1.oid)(parser.shadow)}.${(0, escape_1.oid)(opts.model.temp)} add constraint ${name} unique (${fieldsId});`,
            (0, notice_1.notice)(`CREATE UNIQUE KEY ${name} OF MODEL ${opts.model.model} OK!`),
        ]),
        drop: () => ([
            (0, notice_1.notice)(`DROP CONSTRAINT KEY ${name} OF MODEL ${opts.model.model}`),
            `alter table if exists ${(0, escape_1.oid)(opts.model.schema)}.${(0, escape_1.oid)(opts.model.name)} drop constraint if exists ${name} cascade;`,
            (0, notice_1.notice)(`DROP CONSTRAINT KEY ${name} OF MODEL ${opts.model.model} OK!`),
        ]),
    };
}
function constraintsParser(model, parser) {
    const primary = (() => {
        var _a;
        const index = model.indexes.find(value => value.type === "id");
        if (!index)
            return;
        let localField = (_a = index.fields) === null || _a === void 0 ? void 0 : _a.map(next => {
            const field = model.fields.find(value1 => value1.name === next.name);
            if (!field)
                return next.name;
            return field.dbName || field.name;
        });
        let name = index.dbName || index.name;
        if (!name)
            name = `pk_${model.name}_${localField.join("_")}_by_prisma`;
        return resolver(parser, {
            key: "primary",
            fields: localField,
            name: name,
            parser: parser,
            model: model,
        });
    })();
    const unique = model.indexes.filter(field => {
        return field.type === "unique";
    }).map(index => {
        var _a;
        let localField = (_a = index.fields) === null || _a === void 0 ? void 0 : _a.map(next => {
            const field = model.fields.find(value1 => value1.name === next.name);
            if (!field)
                return next.name;
            return field.dbName || field.name;
        });
        let name = index.dbName || index.name;
        if (!name)
            name = `uk_${model.name}_${localField.join("_")}_by_prisma`;
        return resolver(parser, {
            key: "unique",
            fields: localField,
            name: name,
            parser: parser,
            model: model
        });
    });
    const foreign = model.fields.filter(field => {
        var _a, _b;
        return field.kind === "object"
            && !!field.relationName
            && ((_a = field.relationFromFields) === null || _a === void 0 ? void 0 : _a.length)
            && ((_b = field.relationToFields) === null || _b === void 0 ? void 0 : _b.length);
    }).map(next => {
        var _a, _b, _c;
        let localField = (_a = next.relationFromFields) === null || _a === void 0 ? void 0 : _a.map(name => {
            const field = model.fields.find(value1 => value1.name === name);
            if (!field)
                return name;
            return field.dbName || field.name;
        });
        let reference = parser.models.find(value => value.model === next.type);
        if ((_b = reference === null || reference === void 0 ? void 0 : reference.psm) === null || _b === void 0 ? void 0 : _b.view)
            return null;
        let referenceField = (_c = next.relationToFields) === null || _c === void 0 ? void 0 : _c.map(name => {
            if (!reference)
                return name;
            const field = reference.fields.find(value1 => value1.name === name);
            if (!field)
                return name;
            return field.dbName || field.name;
        });
        let name = next.relationName;
        let ref = reference === null || reference === void 0 ? void 0 : reference.temp;
        if (!name)
            name = `fk_${model.name}_${referenceField === null || referenceField === void 0 ? void 0 : referenceField.join("_")}_to_${ref}_by_prisma`;
        let refModelSchema = parser.shadow;
        return resolver(parser, {
            key: "foreign",
            fields: localField,
            name: name,
            refModel: ref,
            refFields: referenceField,
            refModelSchema: refModelSchema,
            parser: parser,
            model: model,
            relationOnDelete: next.relationOnDelete,
            relationOnUpdate: next.relationOnUpdate,
        });
    }).filter(value => !!value);
    const maps = (list, key) => {
        const fk = [];
        if (!list)
            return [];
        list.forEach(value => {
            if (!value)
                return;
            fk.push(...value === null || value === void 0 ? void 0 : value[key]());
        });
        return fk;
    };
    return {
        create_primary_keys: () => {
            const lll = maps([primary], "create_primary");
            return lll;
        },
        drop_primary_keys: () => {
            return maps([primary], "drop");
        },
        create_foreign_key: () => {
            return maps(foreign, "create_foreign");
        },
        drop_foreign_key: () => {
            return maps(foreign, "drop");
        },
        create_unique_key: () => {
            return maps(unique, "create_unique");
        },
        drop_unique_key: () => {
            return maps(unique, "drop");
        },
    };
}
//# sourceMappingURL=constraint.js.map