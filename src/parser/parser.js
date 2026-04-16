"use strict";
//filename: src/libs/migrate/index.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.parser = parser;
const shadow_1 = require("./shadow");
const sys_1 = require("./sys");
const dependencies_1 = require("./dependencies");
const modelParser_1 = require("./modelParser");
const engine_1 = require("./backup/engine");
const schama_1 = require("./schama");
function parser(opts) {
    const indexMap = new Map();
    const modelMap = new Map();
    for (const index of opts.indexes) {
        const current = indexMap.get(index.model);
        if (current)
            current.push(index);
        else
            indexMap.set(index.model, [index]);
    }
    for (const model of opts.models) {
        modelMap.set(model.model, model);
    }
    opts.indexMap = indexMap;
    opts.modelMap = modelMap;
    let response = {
        options: opts,
        parsed: {},
        models: [],
        parsedList: [],
        core: {
            schema: (0, schama_1.schema)(opts),
            structure: (0, sys_1.prepareCore)(opts),
            functions: (0, engine_1.createFunctionRestoreSerial)(opts),
            migration: (0, sys_1.createMigration)(opts),
        },
        shadow: {
            create: [...(0, shadow_1.create_shadow)(opts)],
            drop: [...(0, shadow_1.drop_shadow)(opts)],
        }
    };
    opts.models.forEach((model) => {
        var _a, _b, _c;
        if ((_a = model.psm) === null || _a === void 0 ? void 0 : _a.view)
            return;
        model.indexes = indexMap.get(model.model) || [];
        const modelDDL = (0, modelParser_1.modelParser)(model, opts);
        const parsed = {
            model: model,
            backup: {
                create: [],
                restore: null,
                restore_serial: [],
                lock: [],
                clean: []
            },
            table: { create: [], drop: [], allocate: [] },
            primary: { create: [], drop: [] },
            foreign: { create: [], drop: [] },
            unique: { create: [], drop: [] },
            indexes: { create: [], drop: [] },
            dependencies: [],
            dependents: [],
        };
        let backup = true;
        if ((_c = (_b = model.psm) === null || _b === void 0 ? void 0 : _b.backup) === null || _c === void 0 ? void 0 : _c.skip)
            backup = false;
        if (backup) {
            parsed.backup.lock = modelDDL.lockTable();
            parsed.backup.restore = modelDDL.restore_backup();
            parsed.backup.restore_serial.push(...modelDDL.restore_serial());
        }
        parsed.table.create.push(...modelDDL.create_table());
        parsed.primary.create.push(...modelDDL.create_primary_keys());
        parsed.foreign.create.push(...modelDDL.create_foreign_key());
        parsed.unique.create.push(...modelDDL.create_unique_key());
        parsed.indexes.create.push(...modelDDL.create_index_key());
        parsed.table.drop.push(...modelDDL.drop_table());
        parsed.table.allocate.push(...modelDDL.allocate_table());
        parsed.foreign.drop.push(...modelDDL.drop_foreign_key());
        parsed.unique.drop.push(...modelDDL.drop_unique_key());
        parsed.primary.drop.push(...modelDDL.drop_primary_keys());
        parsed.indexes.drop.push(...modelDDL.drop_index_key());
        parsed.dependencies.push(...modelDDL.depends());
        response.parsed[model.name] = parsed;
        response.models.push(model.name);
        response.parsedList.push(parsed);
    });
    (0, dependencies_1.reverseDependencies)(response.parsedList);
    return response;
}
//# sourceMappingURL=parser.js.map