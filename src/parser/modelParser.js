"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelParser = modelParser;
const table_1 = require("./table");
const indexes_1 = require("./indexes");
const constraint_1 = require("./constraint");
const backup_1 = require("./backup");
function modelParser(model, parser) {
    const depends = model.fields.filter(field => {
        var _a, _b;
        return field.kind === "object"
            && !!field.relationName
            && ((_a = field.relationFromFields) === null || _a === void 0 ? void 0 : _a.length)
            && ((_b = field.relationToFields) === null || _b === void 0 ? void 0 : _b.length);
    }).map(next => {
        return next.type;
    });
    return Object.assign(Object.assign(Object.assign(Object.assign({ depends: () => {
            if (!depends)
                return [];
            return depends;
        } }, (0, backup_1.backupParser)(model, parser)), (0, table_1.tableParser)(model, parser)), (0, indexes_1.indexesParser)(model, parser)), (0, constraint_1.constraintsParser)(model, parser));
}
//# sourceMappingURL=modelParser.js.map