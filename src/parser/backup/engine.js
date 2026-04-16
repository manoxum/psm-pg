"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFunctionRestoreSerial = createFunctionRestoreSerial;
exports.lockTable = lockTable;
exports.restoreBackupSQL = restoreBackupSQL;
exports.restoreSerialSQL = restoreSerialSQL;
const escape_1 = require("../../utils/escape");
const tabs_1 = require("../../utils/tabs");
const notice_1 = require("../notice");
const sys_1 = require("../sys");
const sha_1 = require("../../utils/sha");
const engine_1 = require("../table/engine");
function createFunctionRestoreSerial(opts) {
    const sys = (0, escape_1.oid)(opts.sys);
    const tab = "         ";
    return (0, tabs_1.noTab)([
        `create or replace function ${sys}.restore_serial(
            schema character varying,
            source character varying,
            shadow character varying,
            temp character varying,
            "from" character varying,
            "to" character varying,
            "seq" character varying
        ) returns table( sequence character varying, counts int8 )
        language plpgsql as $$
        declare
            source_type character varying;
        begin
            if exists(
              select *
                from pg_tables t
                where t.schemaname = schema
                and t.tablename = source
            ) then
                if exists(
                  select *
                    from information_schema.columns c
                    where c.table_schema = schema
                    and c.table_name = source
                    and c.column_name = "from"
                ) then
                    select c.data_type
                      into source_type
                      from information_schema.columns c
                     where c.table_schema = schema
                       and c.table_name = source
                       and c.column_name = "from"
                     limit 1;

                    if coalesce(source_type, '') not in ('smallint', 'integer', 'bigint') then
                        raise notice 'COLUMN %.%.% TYPE % IS NOT SEQUENCE-COMPATIBLE, SKIPPING SEQUENCE RESTORE', schema, source, "from", coalesce(source_type, '<unknown>');
                        return;
                    end if;

                    execute format( $statment$
                    select max( %I ) from %I.%I
                    $statment$, "from", schema, source )
                    into counts;
            
                    counts := coalesce( counts, 0 )+1;
                    -- example district_id_seq
                    sequence := coalesce( seq, format( '%I.%I', shadow, format( '%s_%s_seq', temp, "to" ) ) );
                    perform setval( sequence::regclass, counts, false );
                else
                    raise notice 'COLUMN %.%.% NOT FOUND, SKIPPING SEQUENCE RESTORE', schema, source, "from";
                end if;
            end if;
            return next;
        end;
        $$;`,
    ], tab);
}
function getLegacyFallbackSQL(opts, item) {
    var _a, _b, _c, _d;
    const fieldName = item.field.dbName || item.field.name;
    const modelRules = ((_b = (_a = opts.parser.fallbacks) === null || _a === void 0 ? void 0 : _a.models) === null || _b === void 0 ? void 0 : _b[opts.model.model]) || ((_d = (_c = opts.parser.fallbacks) === null || _c === void 0 ? void 0 : _c.models) === null || _d === void 0 ? void 0 : _d[opts.model.name]);
    const rule = modelRules === null || modelRules === void 0 ? void 0 : modelRules[fieldName];
    if (!rule)
        return null;
    const sources = Array.isArray(rule.from) ? rule.from : [rule.from];
    const fallbacks = sources.map((source) => `nullif(raw_json->>${(0, escape_1.lit)(source)}, '')::${item.type.cast}`);
    if (!fallbacks.length)
        return null;
    return `coalesce(${fallbacks.join(", ")})`;
}
function getSanitizeCondition(item, expression) {
    const cast = item.type.cast.toLowerCase();
    const value = `${expression}->>${item.columnLiteral}`;
    if (["int", "int2", "int4", "int8", "integer", "smallint", "bigint", "oid"].includes(cast)) {
        return `${expression} ? ${item.columnLiteral}
                    AND coalesce(${value}, '') <> ''
                    AND ${value} !~ '^-?\\d+$'`;
    }
    if (["numeric", "decimal", "float4", "float8", "double precision"].includes(cast)) {
        return `${expression} ? ${item.columnLiteral}
                    AND coalesce(${value}, '') <> ''
                    AND ${value} !~ '^-?(\\d+|\\d+\\.\\d+|\\.\\d+)$'`;
    }
    if (cast === "boolean") {
        return `${expression} ? ${item.columnLiteral}
                    AND coalesce(${value}, '') <> ''
                    AND lower(${value}) NOT IN ('true', 'false', 't', 'f', '1', '0')`;
    }
    return null;
}
function getSafeSourceCondition(item) {
    const invalidCondition = getSanitizeCondition(item, "source_json");
    if (!invalidCondition) {
        return `source_json ? ${item.columnLiteral}`;
    }
    return `source_json ? ${item.columnLiteral} AND NOT (${invalidCondition})`;
}
function lockTable(opts) {
    const schema = (0, escape_1.oid)(opts.model.schema);
    const source = (0, escape_1.oid)(opts.source);
    const modelName = opts.model.model;
    const sSchema = (0, escape_1.lit)(opts.model.schema);
    const sSource = (0, escape_1.lit)(opts.source);
    const sql = `
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 
                FROM pg_catalog.pg_class c
                JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = ${sSchema}
                AND c.relname = ${sSource}
            ) THEN
                LOCK TABLE ${schema}.${source} IN SHARE MODE;
                RAISE NOTICE 'LOCK TABLE FOR SHARE MODE TO MODEL ${modelName} [OK]';
            ELSE
                RAISE NOTICE 'TABLE ${schema}.${source} NOT FOUND, SKIPPING LOCK';
            END IF;
        END $$;`.trim();
    return [(0, notice_1.notice)(`PREPARING LOCK FOR MODEL ${modelName}`), sql];
}
function restoreBackupSQL(opts) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8;
    const schema = (0, escape_1.oid)(opts.model.schema);
    const source = (0, escape_1.oid)(opts.source);
    const shadow = (0, escape_1.oid)(opts.parser.shadow);
    const table = (0, escape_1.oid)(opts.model.name);
    const temp = (0, escape_1.oid)(opts.model.temp);
    const scalarFields = opts.model.fields
        .filter((field) => field.kind === "scalar")
        .map((field) => ({
        field,
        columnName: (0, escape_1.oid)(field.dbName || field.name),
        columnLiteral: (0, escape_1.lit)(field.dbName || field.name),
        type: (0, engine_1.parseType)(field),
    }));
    if ((_b = (_a = opts.model.psm) === null || _a === void 0 ? void 0 : _a.backup) === null || _b === void 0 ? void 0 : _b.skip)
        return null;
    function getDefaultSQL(item) {
        const field = item.field;
        if (!field.hasDefaultValue || field.default === undefined || field.default === null) {
            return 'NULL';
        }
        const def = field.default;
        if (typeof def === 'object' && 'name' in def) {
            const name = def.name;
            const args = def.args || [];
            switch (name) {
                case 'autoincrement': {
                    const fullTableName = `${shadow}.${temp}`;
                    return `nextval(pg_get_serial_sequence(${(0, escape_1.lit)(fullTableName)}, ${item.columnLiteral})::regclass)`;
                }
                case 'now':
                    return 'now()';
                case 'uuid':
                    return 'gen_random_uuid()';
                case 'dbgenerated':
                    if (Array.isArray(args)) {
                        return args.join(' ');
                    }
                    return args || '';
                default:
                    const argsSql = args.map((arg) => {
                        if (arg === null || arg === undefined)
                            return 'NULL';
                        if (typeof arg === 'string')
                            return arg;
                        if (typeof arg === 'number')
                            return String(arg);
                        if (typeof arg === 'boolean')
                            return arg ? 'true' : 'false';
                        return String(arg);
                    }).join(', ');
                    return `${name}(${argsSql})`;
            }
        }
        if (typeof def === 'string')
            return (0, escape_1.lit)(def, item.type.type);
        if (typeof def === 'number')
            return String(def);
        if (typeof def === 'boolean')
            return def ? 'true' : 'false';
        if (Array.isArray(def) && def.length === 0)
            return `array[]::${item.type.cast}`;
        if (typeof def === 'object') {
            const obj = def;
            if (obj.sql && typeof obj.sql === 'string')
                return obj.sql;
            if (obj.expression && typeof obj.expression === 'string')
                return obj.expression;
            if (obj.toString && obj.toString !== Object.prototype.toString) {
                const str = obj.toString();
                if (str !== '[object Object]')
                    return str;
            }
            if (obj.value !== undefined) {
                return getDefaultSQL(Object.assign(Object.assign({}, item), { field: Object.assign(Object.assign({}, field), { default: obj.value }) }));
            }
        }
        return 'NULL';
    }
    const columns = scalarFields.map((item) => ` ${item.columnName}`).join(", ");
    const selectExpressions = scalarFields
        .map((item) => {
        const defaultValue = getDefaultSQL(item);
        const legacyFallback = getLegacyFallbackSQL(opts, item);
        const safeSourceCondition = getSafeSourceCondition(item);
        return `
                CASE 
                    WHEN ${safeSourceCondition} THEN s.${item.columnName}::${item.type.cast}
                    ${legacyFallback ? `ELSE coalesce(${legacyFallback}, ${defaultValue}::${item.type.cast})` : `ELSE ${defaultValue}::${item.type.cast}`}
                END AS ${item.columnName}
            `.trim();
    })
        .join(",\n");
    const sanitizeRemovals = scalarFields
        .map((item) => {
        const condition = getSanitizeCondition(item, "raw_json");
        if (!condition)
            return null;
        return `CASE WHEN ${condition} THEN ${item.columnLiteral} END`;
    })
        .filter(Boolean);
    const sanitizedJson = sanitizeRemovals.length
        ? `raw_json - array_remove(array[
                ${sanitizeRemovals.join(",\n                ")}
            ]::text[], null)`
        : `raw_json`;
    function buildRestoreQuery(sourceQuery) {
        return `
        WITH __raw AS (
            SELECT
                to_jsonb(_t) AS raw_json
            FROM (
                ${sourceQuery}
            ) _t
        ),
        __source AS (
            SELECT
                raw_json,
                ${sanitizedJson} AS source_json,
                (jsonb_populate_record(null::${shadow}.${temp}, ${sanitizedJson})).*
            FROM __raw
        )
        SELECT
            ${selectExpressions}
        FROM __source s
    `;
    }
    const DEFAULT_QUERY = buildRestoreQuery(`select * from ${schema}.${source}`);
    const DEFAULT_SOURCE_CHECKER = `select 1 from pg_catalog.pg_tables t where t.tablename = ${(0, escape_1.lit)(opts.model.name)} and t.schemaname = ${(0, escape_1.lit)(opts.model.schema)}`;
    const DEFAULT_WHEN = `true`;
    const DEFAULT_RESOLVER = scalarFields
        .map((item) => ` ${item.columnName}`)
        .join(", ");
    let source_exists = DEFAULT_SOURCE_CHECKER;
    let when = DEFAULT_WHEN;
    const revision_resolver = scalarFields
        .map((item) => {
        var _a, _b;
        let expression = (_b = (_a = item.field.psm) === null || _a === void 0 ? void 0 : _a.restore) === null || _b === void 0 ? void 0 : _b.expression;
        if (!expression)
            expression = ` ${item.columnName}`;
        return expression;
    })
        .join(", ");
    let revision_query = DEFAULT_QUERY;
    const expression = (_e = (_d = (_c = opts.model.psm) === null || _c === void 0 ? void 0 : _c.backup) === null || _d === void 0 ? void 0 : _d.rev) === null || _e === void 0 ? void 0 : _e.expression;
    const exists = (_h = (_g = (_f = opts.model.psm) === null || _f === void 0 ? void 0 : _f.backup) === null || _g === void 0 ? void 0 : _g.rev) === null || _h === void 0 ? void 0 : _h.exists;
    if (exists === null || exists === void 0 ? void 0 : exists.length) {
        source_exists = exists;
    }
    if (((_l = (_k = (_j = opts.model.psm) === null || _j === void 0 ? void 0 : _j.backup) === null || _k === void 0 ? void 0 : _k.rev) === null || _l === void 0 ? void 0 : _l.from) === "query" &&
        expression) {
        revision_query = buildRestoreQuery(expression);
    }
    else if (((_p = (_o = (_m = opts.model.psm) === null || _m === void 0 ? void 0 : _m.backup) === null || _o === void 0 ? void 0 : _o.rev) === null || _p === void 0 ? void 0 : _p.from) === "query:linked" &&
        expression &&
        ((_r = (_q = opts.model.psm) === null || _q === void 0 ? void 0 : _q.query) === null || _r === void 0 ? void 0 : _r[expression])) {
        revision_query = buildRestoreQuery((_t = (_s = opts.model.psm) === null || _s === void 0 ? void 0 : _s.query) === null || _t === void 0 ? void 0 : _t[expression]);
    }
    else if (((_w = (_v = (_u = opts.model.psm) === null || _u === void 0 ? void 0 : _u.backup) === null || _v === void 0 ? void 0 : _v.rev) === null || _w === void 0 ? void 0 : _w.from) === "model" &&
        expression) {
        const model = ((_x = opts.parser.modelMap) === null || _x === void 0 ? void 0 : _x.get(expression)) || opts.parser.models.find((m) => m.model === expression);
        if (model) {
            revision_query = buildRestoreQuery(`select * from ${(0, escape_1.oid)(model.schema || "public")}.${(0, escape_1.oid)(model.dbName || model.name)}`);
        }
    }
    const sys = (0, escape_1.oid)(opts.parser.sys);
    let revision = "null";
    const relation = `${schema}.${table}`;
    if ((_0 = (_z = (_y = opts.model.psm) === null || _y === void 0 ? void 0 : _y.backup) === null || _z === void 0 ? void 0 : _z.rev) === null || _0 === void 0 ? void 0 : _0.version) {
        revision = (0, escape_1.lit)((_2 = (_1 = opts.model.psm) === null || _1 === void 0 ? void 0 : _1.backup) === null || _2 === void 0 ? void 0 : _2.rev.version);
    }
    let always_query = DEFAULT_QUERY;
    let always_resolver = DEFAULT_RESOLVER;
    if (((_5 = (_4 = (_3 = opts.model.psm) === null || _3 === void 0 ? void 0 : _3.backup) === null || _4 === void 0 ? void 0 : _4.rev) === null || _5 === void 0 ? void 0 : _5.apply) === "ALWAYS" &&
        revision_query &&
        revision_resolver) {
        always_query = revision_query;
        always_resolver = revision_resolver;
        revision = `always-${opts.parser.migration}`;
    }
    const next = `
      do $$
        declare
          _revision character varying := ${revision}::character varying;
          _relation character varying := ${(0, escape_1.lit)(relation)}::character varying;
          ___whenX1025475 boolean;
        begin
          if not exists( ${source_exists} ) then
            return;
          end if;
          
          ___whenX1025475 := (${when});
          if not coalesce( ___whenX1025475, true ) then
            return;
          end if;
          
          if _revision is not null and not exists(
            select 1
              from ${sys}.revision r
              where r.revision = _revision
                and operation = 'restore:data'
                and relation = _relation
          ) then 
            with __restore as (
              ${revision_query}
            ) insert into ${shadow}.${temp} (${columns})
              select 
                  ${revision_resolver}
                from __restore r;
          elsif _revision is null then 
            with __restore as (
              ${always_query}
            ) insert into ${shadow}.${temp} (${columns})
              select 
                  ${always_resolver}
                from __restore r;
          else 
            raise exception 'cannot restore revision';
          end if;
        end;
      $$;
    `.split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => line.replace(/^ {6}/, ""))
        .join("\n");
    return {
        data: [
            (0, notice_1.notice)(`RESTORE BACKUP FOR MODEL ${opts.model.model}`),
            next,
            (0, notice_1.notice)(`RESTORE BACKUP FOR MODEL ${opts.model.model} OK`),
        ],
        registry: [
            (0, notice_1.notice)(`REGISTRY RESTORE OF BACKUP FOR MODEL ${opts.model.model}`),
            (0, sys_1.createRevision)(opts.parser, {
                revision: (_8 = (_7 = (_6 = opts.model.psm) === null || _6 === void 0 ? void 0 : _6.backup) === null || _7 === void 0 ? void 0 : _7.rev) === null || _8 === void 0 ? void 0 : _8.version,
                relation: relation,
                hash: (0, sha_1.migrationHash)(opts.parser.migration, `restore:data-${relation}`),
                operation: `restore:data-${relation}`,
            }).join("\n"),
            (0, notice_1.notice)(`REGISTRY RESTORE OF BACKUP FOR MODEL ${opts.model.model} OK`),
        ],
    };
}
function restoreSerialSQL(opts) {
    const args = [
        ` schema := ${(0, escape_1.lit)(opts.model.schema, escape_1.VARCHAR)}`,
        ` source := ${(0, escape_1.lit)(opts.source, escape_1.VARCHAR)}`,
        ` shadow := ${(0, escape_1.lit)(opts.parser.shadow, escape_1.VARCHAR)}`,
        ` temp := ${(0, escape_1.lit)(opts.model.temp, escape_1.VARCHAR)}`,
        ` "from" := ${(0, escape_1.lit)(opts.from, escape_1.VARCHAR)}`,
        ` "to" := ${(0, escape_1.lit)(opts.to, escape_1.VARCHAR)}`,
        ` "seq" := ${(0, escape_1.lit)(opts.seq, escape_1.VARCHAR)}`,
    ];
    return [
        (0, notice_1.notice)(`RESTORE SEQUENCE OF FIELD ${opts.to} FROM MODEL ${opts.model.model}`),
        `select * from ${(0, escape_1.oid)(opts.parser.sys)}.restore_serial(\n  ${args.join(",\n  ")}\n);`,
        (0, notice_1.notice)(`RESTORE SEQUENCE OF FIELD ${opts.to} FROM MODEL ${opts.model.model} OK`),
    ];
}
//# sourceMappingURL=engine.js.map