"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notice = notice;
const escape_1 = require("../utils/escape");
function notice(message) {
    return `do $$ begin raise notice '%', ${(0, escape_1.lit)(message)}; end $$;`;
}
//# sourceMappingURL=notice.js.map