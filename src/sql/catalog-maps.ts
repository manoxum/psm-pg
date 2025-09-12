// export const PGDataTypeMapCheck = {
//     number(arg) {
//         let number = Number(arg);
//         return Number.isFinite(number) && !Number.isNaN(number);
//     },
//     string(arg) {
//         return typeof arg === 'string';
//     },
//     boolean(arg) {
//         return typeof arg === 'boolean';
//     },
//     Buffer(arg) {
//         return Buffer.isBuffer(arg);
//     },
//     Date(arg) {
//         return arg instanceof Date;
//     },
//     "any"( ) {
//         return true;
//     },
//     "any[]"( arg ) {
//         return Array.isArray(arg);
//     },
//     void( arg ) {
//         return arg === undefined || arg === null;
//     }
// };
//
// export const PGDataTypeMap = {
//     bigint: "number",
//     bigserial: "number",
//     bit: "string",
//     "bit varying": "string",
//     boolean: "boolean",
//     bool: "boolean",
//     box: "string",
//     bytea: "Buffer",
//     '"char"': "string",
//     "char": "string",
//     character: "string",
//     bpchar: "string",
//     "character varying": "string",
//     cid: "string",
//     cidr: "string",
//     circle: "string",
//     date: "Date",
//     "double precision": "number",
//     inet: "string",
//     integer: "number",
//     int8: "number",
//     interval: "string",
//     json: "any",
//     jsonb: "any",
//     line: "string",
//     lseg: "string",
//     macaddr: "string",
//     money: "number",
//     numeric: "number",
//     oid: "number",
//     path: "string",
//     pg_lsn: "string",
//     point: "string",
//     polygon: "string",
//     real: "number",
//     record: "any",
//     regtype: "string",
//     smallint: "number",
//     int2: "number",
//     smallserial: "number",
//     serial: "number",
//     int4: "number",
//     float8: "number",
//     text: "string",
//     varchar: "string",
//     time: "string",
//     regprocedure: "string",
//     regproc: "string",
//     trigger: "void",
//     internal: "void",
//     anyelement: "any",
//     regclass: "string",
//     anyarray: "any[]",
//     timestamp: "Date",
//     "timestamptz": "Date",
//     "timestamp with time zone": "Date",
//     "timestamp without time zone": "Date",
//     tid: "string",
//     tsquery: "string",
//     tsvector: "string",
//     txid_snapshot: "string",
//     uuid: "string",
//     xid: "string",
//     void: "void",
//     xml: "string",
//     name: "string",
//     regdictionary: "string",
//     aclitem: "string",
//     pg_node_tree: "pg_node_tree"
// };
//
// export type PGDataType = {
//     bigint: number;
//     bigserial: number;
//     bit: string;
//     "bit varying": string;
//     boolean: boolean;
//     bool: boolean;
//     box: string;
//     bytea: Buffer;
//     '"char"': string;
//     "char": string;
//     character: string;
//     bpchar: string;
//     "character varying": string;
//     cid: string;
//     cidr: string;
//     circle: string;
//     date: Date;
//     "double precision": number;
//     inet: string;
//     integer: number;
//     int8: number;
//     interval: string;
//     json: any;
//     jsonb: any;
//     line: string;
//     lseg: string;
//     macaddr: string;
//     money: number;
//     numeric: number;
//     oid: number;
//     path: string;
//     pg_lsn: string;
//     point: string;
//     polygon: string;
//     real: number;
//     record: any; // Adicionado
//     regtype: string; // Adicionado
//     smallint: number;
//     int2: number;
//     smallserial: number;
//     serial: number;
//     int4: number;
//     float8: number;
//     text: string;
//     varchar: string;
//     time: string;
//     regproc: string;
//     regprocedure: string;
//     trigger: void;
//     internal: void;
//     anyelement: any;
//     regclass: string;
//     anyarray: any[];
//     timestamp: Date;
//     "timestamptz": Date;
//     "timestamp with time zone": Date;
//     "timestamp without time zone": Date;
//     tid: string;
//     tsquery: string;
//     tsvector: string;
//     txid_snapshot: string;
//     uuid: string;
//     xid: string;
//     void: void;
//     xml: string;
//     name:string
//     regdictionary:string
//     aclitem:string
//     pg_node_tree:string
// };
//
// export default PGDataType;
//
// export type CatalogTypesMap< T extends keyof PGDataType> = PGDataType[T];
//
//
// export type FunctionOf< F extends FunctionOf<F> > = {
//     [ schema in keyof F ]:F[schema]
// }
//
//
// export type TableOf<T extends  TableOf< T>> = {
//     [ schema in keyof T ]:T[schema]
// }
//
// export type ViewOf<V extends ViewOf<V>> = {
//     [ schema in keyof V ]:V[schema]
// }
//
// export type RelationOf< R extends &RelationOf< R> > = {
//     [ schema in keyof R ]:R[schema]
// }
//
// export type MaterializesOf< R extends &RelationOf< R> > = {
//     [ schema in keyof R ]:R[schema]
// }
//
// export type CompositeTypeOf<  CT extends  CompositeTypeOf<CT> > = {
//     [ schema in keyof CT ]:CT[schema]
// }
//
// export type EnumOf<E extends EnumOf< E> > = {
//     [ schema in keyof E ]:E[ schema ]
// }
//
// export type CatalogOf<R extends CatalogOf<R>> = {
//
//     schemas?:(R["schemas"][number])[],
//     types?: { [S in keyof R["types"]]:R["types"][S]  },
//
//     functions?: {
//         [S in (keyof R["functions"])]:{
//             [K in keyof R["functions"][S]]:R["functions"][S][K]
//         }
//     }, functionsRefs?: {
//         [K in keyof R["functionsRefs"]]:R["functionsRefs"][K]
//     },
//
//     functionsProps?: {
//         [S in (keyof R["functionsProps"])]:{
//             [K in keyof R["functionsProps"][S]]:R["functionsProps"][S][K]
//         }
//     }, functionsPropsRefs?: {
//         [K in keyof R["functionsPropsRefs"]]:{
//             args:R["functionsPropsRefs"][K]["args"]
//             options:R["functionsPropsRefs"][K]["options"]
//             returns:R["functionsPropsRefs"][K]["returns"]
//             returnsType:R["functionsPropsRefs"][K]["returnsType"]
//         }
//     },
//
//     tables?: {
//         [S in (keyof R["tables"])]:{
//             [K in keyof R["tables"][S]]:R["tables"][S][K]
//         }
//     },
//     tablesRefs?: {
//         [K in keyof R["tablesRefs"]]:R["tablesRefs"][K]
//     },
//
//     views?: {
//         [S in (keyof R["views"])]:{
//             [K in keyof R["views"][S]]:R["views"][S][K]
//         }
//     }, viewsRefs?: {
//         [S in (keyof R["viewsRefs"])]:R["viewsRefs"][S]
//     },
//
//     materializes?: {
//         [S in (keyof R["materializes"])]:{
//             [K in keyof R["materializes"][S]]:R["materializes"][S][K]
//         }
//     }, materializesRefs?: {
//         [S in (keyof R["materializesRefs"])]:R["materializesRefs"][S]
//     },
//
//     relations?: {
//         [S in (keyof R["relations"])]:{
//             [K in keyof R["relations"][S]]:R["relations"][S][K]
//         }
//     }, relationsRefs?: {
//         [S in (keyof R["relationsRefs"])]:R["relationsRefs"][S]
//     },
//
//     composites?: {
//         [S in (keyof R["composites"])]:{
//             [K in keyof R["composites"][S]]:R["composites"][S][K]
//         }
//     }, compositesRefs?: {
//         [S in (keyof R["compositesRefs"])]:R["compositesRefs"][ S ]
//     },
//
//     enums?: {
//         [S in (keyof R["enums"])]:{
//             [K in keyof R["enums"][S]]:R["enums"][S][K]
//         }
//     }, enumsRefs?: {
//         [S in (keyof R["enumsRefs"])]:R["enumsRefs"][ S ]
//     }
// }