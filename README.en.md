# @prisma-psm/pg

PostgreSQL driver for Prisma Safe Migrate.

For the full detailed bilingual documentation, see [README.md](./README.md).

## What this documentation covers

- PostgreSQL driver architecture
- `core`, `check`, and `migrate` SQL generation
- backups with `pg_dump`
- restores with `psql`
- applied revision lookup
- custom SQL resources
- current support for `psm.migration.yml`
- restore safeguards for legacy scenarios
- real workflows and current limitations

## Installation

```bash
npm install --save-dev @prisma-psm/core @prisma-psm/pg
```

## Basic setup

```prisma
generator psm {
  provider = "psm generate"
  output   = "./psm"
  driver   = "@prisma-psm/pg"
  url      = env("DATABASE_URL")
  sys      = "sys"
}
```

## Sidecar support

When used with `@prisma-psm/core`, the driver reads:

- `psm.migration.yml`
- `psm.migration.yaml`
- `psm.migration.json`

The runtime support already implemented in the driver is:

- `rules.etl.fallback`

The `rename`, `transform`, `move`, and `rls` rule families can already be authored by the CLI in the sidecar, but their SQL materialization is not yet executed by the PostgreSQL driver.

## License

ISC
