"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseType = parseType;
exports.parseDefault = parseDefault;
const escape_1 = require("../../utils/escape");
const PRISMA_DEFAULTS = {
    now: (opts) => {
        return `now()`;
    },
    uuid: (opts) => {
        return `gen_random_uuid()`;
    },
    autoincrement: (opts) => {
        return ``;
    },
    dbgenerated: (opts) => {
        return ` ${opts.args}`;
    }
};
const PRISMA_TYPE_MAP = {
    String: "varchar",
    DateTime: "timestamptz",
    Json: "json",
    Float: "double precision",
    SmallInt: "int2",
    Int: "int4",
    BigInt: "int8",
    Boolean: "boolean",
    Bytes: "bytea",
    Decimal: "numeric",
    Uuid: "uuid",
    Timestamptz: "timestamptz",
    JsonB: "jsonb",
    VarChar: "varchar",
    Integer: "int4",
    Oid: "oid",
};
function formatCast(type) {
    let cleanType = type.toLowerCase().trim();
    // 1. Mapeamento direto de nomes complexos ou pseudotipos
    const mapping = {
        'serial': 'int',
        'serial[]': 'int[]',
        'bigserial': 'bigint',
        'bigserial[]': 'bigint[]',
        'smallserial': 'smallint',
        'smallserial[]': 'smallint[]',
        'double precision': 'float8',
        'timestamp with time zone': 'timestamptz',
        'timestamp without time zone': 'timestamp',
        'character varying': 'varchar',
        'character': 'char'
    };
    // Verifica se existe no mapa (lidando com espaços extras)
    if (mapping[cleanType])
        return mapping[cleanType] || type;
    // 2. Lógica para tipos com (n) como varchar(50) -> mantém o tipo
    // mas se for algo como serial dentro de um array ou algo exótico
    if (cleanType.includes('serial')) {
        return cleanType.replace('serial', 'int') || type;
    }
    return cleanType || type;
}
function parseType(opts) {
    var _a, _b, _c, _d;
    let type = "";
    let autoincrement = ((_a = opts === null || opts === void 0 ? void 0 : opts.default) === null || _a === void 0 ? void 0 : _a.name) === "autoincrement";
    let native = (_b = opts.nativeType) === null || _b === void 0 ? void 0 : _b[0];
    if (!!native)
        native = PRISMA_TYPE_MAP[native] || native;
    let primatype = opts.type;
    let datatype = native || PRISMA_TYPE_MAP[primatype] || primatype;
    let serial = false;
    if (datatype === "int2" && autoincrement) {
        type = "serial2";
        serial = true;
    }
    else if (datatype === "int4" && autoincrement) {
        type = "serial";
        serial = true;
    }
    else if (datatype === "int8" && autoincrement) {
        type = "serial8";
        serial = true;
    }
    else if (datatype === "oid" && autoincrement) {
        type = "serial";
        serial = true;
    }
    else if (!!opts.nativeType) {
        let args = "";
        if (((_c = opts.nativeType) === null || _c === void 0 ? void 0 : _c[1].length) > 0)
            args = `(${(_d = opts.nativeType) === null || _d === void 0 ? void 0 : _d[1].join(", ")})`;
        type = `${native}${args}`;
    }
    else if (!!PRISMA_TYPE_MAP[opts.type]) {
        type = PRISMA_TYPE_MAP[opts.type];
    }
    else
        type = opts.type;
    if (!type)
        type = "text";
    if (opts.isList)
        type = `${type}[]`;
    return {
        type: type,
        serial: serial,
        cast: formatCast(type)
    };
}
function parseDefault(opts, typed) {
    let defaults = "";
    if (opts.hasDefaultValue && !!opts.default && Array.isArray(opts.default)) {
        defaults = opts.default.map(value => (0, escape_1.lit)(value)).join(", ");
        defaults = ` array[ ${defaults} ]`;
    }
    else if (opts.hasDefaultValue && !!opts.default && typeof opts.default === "object" && !Array.isArray(opts.default)) {
        defaults = PRISMA_DEFAULTS[opts.default.name](opts.default);
    }
    else if (opts.hasDefaultValue && !!opts.default) {
        defaults = (0, escape_1.lit)(opts.default + "");
    }
    if (!(defaults === null || defaults === void 0 ? void 0 : defaults.length))
        return "";
    return `${defaults}::${typed}`;
}
//# sourceMappingURL=engine.js.map