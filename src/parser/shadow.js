"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create_shadow = create_shadow;
exports.drop_shadow = drop_shadow;
const escape_1 = require("../utils/escape");
const notice_1 = require("./notice");
function create_shadow(opts) {
    return [
        (0, notice_1.notice)(`CREATE SHADOW SCHEMA ${opts.shadow}`),
        `create schema ${(0, escape_1.oid)(opts.shadow)};`,
        (0, notice_1.notice)(`CREATE SHADOW SCHEMA ${opts.shadow} OK!`),
    ];
}
function drop_shadow(opts) {
    return [
        (0, notice_1.notice)(`DROP SHADOW SCHEMA ${opts.shadow}`),
        `drop schema ${(0, escape_1.oid)(opts.shadow)} cascade;`,
        (0, notice_1.notice)(`DROP SHADOW SCHEMA ${opts.shadow} OK!`),
    ];
}
//# sourceMappingURL=shadow.js.map