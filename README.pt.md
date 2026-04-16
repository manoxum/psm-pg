# @prisma-psm/pg

Driver PostgreSQL do Prisma Safe Migrate.

Para a documentação completa, detalhada e bilíngue, veja [README.md](./README.md).

## O que esta documentação cobre

- arquitetura do driver PostgreSQL
- geração de SQL `core`, `check` e `migrate`
- backup com `pg_dump`
- restore com `psql`
- leitura de revisões aplicadas
- recursos SQL customizados
- suporte atual a `psm.migration.yml`
- proteções de restore para cenários legados
- workflows reais e limitações atuais

## Instalação

```bash
npm install --save-dev @prisma-psm/core @prisma-psm/pg
```

## Configuração básica

```prisma
generator psm {
  provider = "psm generate"
  output   = "./psm"
  driver   = "@prisma-psm/pg"
  url      = env("DATABASE_URL")
  sys      = "sys"
}
```

## Suporte ao sidecar

Quando usado com `@prisma-psm/core`, o driver lê:

- `psm.migration.yml`
- `psm.migration.yaml`
- `psm.migration.json`

Hoje, o suporte em runtime já implementado no driver é:

- `rules.etl.fallback`

As famílias `rename`, `transform`, `move` e `rls` já podem ser registradas pela CLI no sidecar, mas sua materialização SQL ainda não é executada pelo driver PostgreSQL.

## Licença

ISC
