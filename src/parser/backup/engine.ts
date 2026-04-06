import { FieldOption, ModelOptions } from "@prisma-psm/core";
import { oid, lit, VARCHAR } from "../../utils/escape";
import { noTab } from "../../utils/tabs";
import { PostgresParserOptions } from "../def";
import { notice } from "../notice";
import { createRevision } from "../sys";
import { migrationHash } from "../../utils/sha";
import {parseType} from "../table/engine";

export function createFunctionRestoreSerial(opts: PostgresParserOptions) {
    const sys = oid(opts.sys);
    const tab = "         ";
    return noTab(
        [
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
        begin
            if exists(
              select *
                from pg_tables t
                where t.schemaname = schema
                and t.tablename = source
            ) then
                execute format( $statment$
                select max( %I ) from %I.%I
                $statment$, "from", schema, source )
                into counts;
            
                counts := coalesce( counts, 0 )+1;
                -- example district_id_seq
                sequence := coalesce( seq, format( '%I.%I', shadow, format( '%s_%s_seq', temp, "to" ) ) );
                perform setval( sequence::regclass, counts, false );
            end if;
            return next;
        end;
        $$;`,
        ],
        tab
    );
}

export interface RestoreOptions {
    source: string;
    model: ModelOptions;
    parser: PostgresParserOptions;
}

export function lockTable(opts: RestoreOptions) {
    const schema = oid(opts.model.schema);
    const source = oid(opts.source);
    const modelName = opts.model.model;
    const sSchema = lit(opts.model.schema);
    const sSource = lit(opts.source);

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

    return [notice(`PREPARING LOCK FOR MODEL ${modelName}`), sql];
}

export function restoreBackupSQL(opts: RestoreOptions): {
    data: string[];
    registry: string[];
} {
    const schema = oid(opts.model.schema);
    const source = oid(opts.source);
    const shadow = oid(opts.parser.shadow);
    const table = oid(opts.model.name);
    const temp = oid(opts.model.temp);

    if (opts.model.psm?.backup?.skip) return null as any;

    // Função auxiliar para extrair a expressão SQL do default de um campo
    function getDefaultSQL(field: FieldOption): string {
        // Se o campo não tem default, retorna NULL
        if (!field.hasDefaultValue || field.default === undefined || field.default === null) {
            return 'NULL';
        }
        const datatype = parseType( field )


        const def = field.default;

        // Caso o default seja um objeto com name e args (padrão Prisma)
        if (typeof def === 'object' && 'name' in def) {
            const name = def.name;
            const args = (def as any).args || [];

            switch (name) {
                case 'autoincrement': {
                    // Usa a sequência da tabela shadow para gerar novos valores
                    const fullTableName = `${shadow}.${temp}`; // já com aspas
                    const colNameLit = lit(field.dbName || field.name);
                    return `nextval(pg_get_serial_sequence(${lit(fullTableName)}, ${colNameLit})::regclass)`;
                }
                case 'now':
                    return 'now()';
                case 'uuid':
                    return 'gen_random_uuid()';
                case 'dbgenerated':
                    // args pode ser uma string ou array; se for array, juntamos
                    if (Array.isArray(args)) {
                        return args.join(' ');
                    }
                    return args || '';
                default:
                    // Para outras funções, tenta construir chamada com argumentos
                    const argsSql = args.map((arg: any) => {
                        if (arg === null || arg === undefined) return 'NULL';
                        if (typeof arg === 'string') return arg;
                        if (typeof arg === 'number') return String(arg);
                        if (typeof arg === 'boolean') return arg ? 'true' : 'false';
                        return String(arg);
                    }).join(', ');
                    return `${name}(${argsSql})`;
            }
        }

        // Tipos primitivos (string, number, boolean) – tratados como literais
        if (typeof def === 'string') return lit(def, datatype.type);
        if (typeof def === 'number') return String(def);
        if (typeof def === 'boolean') return def ? 'true' : 'false';

        // Outros objetos (ex: { sql: ... }) – tenta extrair propriedades comuns
        if (typeof def === 'object') {
            const obj = def as any;
            if (obj.sql && typeof obj.sql === 'string') return obj.sql;
            if (obj.expression && typeof obj.expression === 'string') return obj.expression;
            if (obj.toString && obj.toString !== Object.prototype.toString) {
                const str = obj.toString();
                if (str !== '[object Object]') return str;
            }
            if (obj.value !== undefined) {
                return getDefaultSQL({ default: obj.value } as FieldOption);
            }
        }

        // Fallback seguro
        return 'NULL';
    }

    // Filtra campos escalares (incluindo os gerados, para preservar IDs e defaults)
    const filter = (field: FieldOption) => field.kind === "scalar";
    const fields = opts.model.fields.filter(filter);

    // Lista de colunas para o INSERT (na mesma ordem dos campos)
    const columns = fields.map((f) => ` ${oid(f.dbName || f.name)}`).join(", ");

    // Constrói a lista de expressões SELECT com CASE que verifica existência da chave no JSON original
    const selectExpressions = fields
        .map((field) => {
            const colName = oid(field.dbName || field.name);
        const colNameLit = lit(field.dbName || field.name);
            const defaultValue = getDefaultSQL(field);
            const datatype = parseType( field );
            return `
                CASE 
                    WHEN original_json ? ${colNameLit} THEN s.${colName}::${datatype.type}
                    ELSE ${defaultValue||"NULL"}::${datatype.type}
                END AS ${colName}
            `.trim();
        })
        .join(",\n");

    // DEFAULT_QUERY com CTE que inclui o JSON original e aplica CASE para cada coluna
    const DEFAULT_QUERY = `
        WITH __source AS (
            SELECT
                to_jsonb(_t) AS original_json,
                (jsonb_populate_record(null::${shadow}.${temp}, to_jsonb(_t))).*
            FROM ${schema}.${source} _t
        )
        SELECT
            ${selectExpressions}
        FROM __source s
    `;

    const DEFAULT_SOURCE_CHECKER = `select 1 from pg_catalog.pg_tables t where t.tablename = ${lit(
            opts.model.name
    )} and t.schemaname = ${lit(opts.model.schema)}`;
    const DEFAULT_WHEN = `true`;
    const DEFAULT_RESOLVER = fields
        .map((f) => ` ${oid(f.dbName || f.name)}`)
        .join(", ");

    let source_exists = DEFAULT_SOURCE_CHECKER;
    let when = DEFAULT_WHEN;

    const revision_resolver = fields
        .map((field) => {
            let expression = field.psm?.restore?.expression;
            if (!expression) expression = ` ${oid(field.dbName || field.name)}`;
            return expression;
        })
        .join(", ");

    let revision_query = DEFAULT_QUERY;
    const expression = opts.model.psm?.backup?.rev?.expression;
    const exists = opts.model.psm?.backup?.rev?.exists;

    if (exists?.length) {
        source_exists = exists;
    }

    if (
        opts.model.psm?.backup?.rev?.from === "query" &&
        expression
    ) {
        revision_query = expression;
    } else if (
        opts.model.psm?.backup?.rev?.from === "query:linked" &&
        expression &&
        opts.model.psm?.query?.[expression]
    ) {
        revision_query = opts.model.psm?.query?.[expression];
    } else if (
        opts.model.psm?.backup?.rev?.from === "model" &&
        expression
    ) {
        const model = opts.parser.models.find((m) => m.model === expression);
        if (model) {
            revision_query = `select * from ${oid(
                    model.schema || "public"
            )}.${oid(model.dbName || model.name)}`;
        }
    }

    const sys = oid(opts.parser.sys);
    let revision = "null";
    const relation = `${schema}.${table}`;
    if (opts.model.psm?.backup?.rev?.version) {
        revision = lit(opts.model.psm?.backup?.rev.version);
    }

    let always_query = DEFAULT_QUERY;
    let always_resolver = DEFAULT_RESOLVER;
    if (
        opts.model.psm?.backup?.rev?.apply === "ALWAYS" &&
        revision_query &&
        revision_resolver
    ) {
        always_query = revision_query;
        always_resolver = revision_resolver;
        revision = `always-${opts.parser.migration}`;
    }

    const next = `
      do $$
        declare
          _revision character varying := ${revision}::character varying;
          _relation character varying := ${lit(relation)}::character varying;
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
            notice(`RESTORE BACKUP FOR MODEL ${opts.model.model}`),
            next,
            notice(`RESTORE BACKUP FOR MODEL ${opts.model.model} OK`),
        ],
        registry: [
            notice(`REGISTRY RESTORE OF BACKUP FOR MODEL ${opts.model.model}`),
            createRevision(opts.parser, {
                revision: opts.model.psm?.backup?.rev?.version,
                relation: relation,
                hash: migrationHash(
                    opts.parser.migration,
                    `restore:data-${relation}`
                ),
                operation: `restore:data-${relation}`,
            }).join("\n"),
            notice(
                `REGISTRY RESTORE OF BACKUP FOR MODEL ${opts.model.model} OK`
            ),
        ],
    };
}

export interface RestoreSerialOptions extends RestoreOptions {
    from: string;
    to: string;
    seq?: string;
}
export function restoreSerialSQL(opts: RestoreSerialOptions) {
    const args = [
        ` schema := ${lit(opts.model.schema, VARCHAR)}`,
        ` source := ${lit(opts.source, VARCHAR)}`,
        ` shadow := ${lit(opts.parser.shadow, VARCHAR)}`,
        ` temp := ${lit(opts.model.temp, VARCHAR)}`,
        ` "from" := ${lit(opts.from, VARCHAR)}`,
        ` "to" := ${lit(opts.to, VARCHAR)}`,
        ` "seq" := ${lit(opts.seq, VARCHAR)}`,
    ];
    return [
        notice(
            `RESTORE SEQUENCE OF FIELD ${opts.to} FROM MODEL ${opts.model.model}`
        ),
        `select * from ${oid(opts.parser.sys)}.restore_serial(\n  ${args.join(
                ",\n  "
        )}\n);`,
        notice(
            `RESTORE SEQUENCE OF FIELD ${opts.to} FROM MODEL ${opts.model.model} OK`
        ),
    ];
}