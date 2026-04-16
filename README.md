# @prisma-psm/pg

PostgreSQL driver for Prisma Safe Migrate.

[English](#english) | [Português](#português)

## English

### What it is

`@prisma-psm/pg` is the PostgreSQL runtime and SQL generator for Prisma Safe Migrate.

It is the package that knows how to:

- transform parsed Prisma metadata into PostgreSQL SQL
- build bootstrap, validation, and apply scripts
- create and restore PostgreSQL backups
- query the migration registry
- execute committed revisions
- restore legacy rows into new table structures during validation and migration workflows

This package is meant to be used together with `@prisma-psm/core`.

### Installation

```bash
npm install --save-dev @prisma-psm/core @prisma-psm/pg
```

### Requirements

- PostgreSQL
- the `pg` Node.js driver
- `pg_dump` available in the shell environment
- `psql` available in the shell environment

### Prisma setup

```prisma
generator psm {
  provider = "psm generate"
  output   = "./psm"
  driver   = "@prisma-psm/pg"
  url      = env("DATABASE_URL")
  sys      = "sys"
}
```

### What the driver provides

`@prisma-psm/pg` implements the `PSMDriver` contract from `@prisma-psm/core`.

Main capabilities:

- `generator(opts)`: builds PostgreSQL SQL for `core`, `check`, and `migrate`
- `migrator(opts)`: executes SQL, dumps the database, restores backups, and appends custom SQL payloads
- `migrated(opts)`: reads applied migration ids from `<sys>.migration`
- `prepare(model)`: normalizes parsed model metadata before SQL generation
- `getCompletions()`: exposes SQL-oriented completions for tooling

### SQL model

The driver emits three main SQL bundles:

- `core`: bootstrap SQL for support objects and migration registry
- `check`: validation SQL used as a preflight script
- `migrate`: apply SQL for the next revision

Internally, the PostgreSQL parser coordinates:

- table creation
- temporary shadow allocation
- dependency ordering
- backup restore logic
- index and constraint generation
- final table allocation
- migration registry writes

### Execution sequence

When called through `@prisma-psm/core`, the typical sequence is:

1. `core()` to ensure support objects exist
2. `test()` to execute the generated `check` migration
3. `dump()` to capture a backup before commit
4. `migrate()` to apply the final SQL bundle

The driver reports:

- success flag
- collected messages
- connection errors
- SQL execution errors

### Backup and restore

#### Backup

The PostgreSQL driver creates backups using:

```bash
pg_dump -cOv --if-exists <DATABASE_URL>
```

Behavior:

- output is streamed into a temporary `backup.sql`
- the resulting file path is returned to `@prisma-psm/core`
- that file is then embedded in committed revision archives

#### Restore

The PostgreSQL driver restores backups using:

```bash
psql -d <DATABASE_URL> -f <backup.sql>
```

Restore is typically triggered:

- during `psm deploy`, for the first unapplied revision that carries a backup
- during validation flows that rebuild legacy data into temporary structures

Operational implications:

- deployment environments must expose both `pg_dump` and `psql`
- network and credentials must allow CLI-based PostgreSQL access

### Migration registry

Applied revisions are read from:

```sql
select sid, date
  from <sys>.migration
 where ($1::text[] is null or sid = any($1::text[]));
```

That is how `psm deploy` decides which archives are still pending.

### Custom SQL resources

The driver can append raw SQL resources collected by `@prisma-psm/core` from:

- `psm/functions`
- `psm/triggers`
- `psm/views`

When these resources exist:

- `migrate()` appends them to the generated SQL
- `migrateRaw()` returns the final SQL bundle stored in revision archives
- `execute()` can run them independently through `psm execute`

Example structure:

```text
prisma/
  psm/
    functions/
      audit/
        set_updated_at.sql
    triggers/
      audit_user_changes.sql
    views/
      reporting/
        customer_summary.sql
```

### Project migration sidecar support

When used with `@prisma-psm/core`, the PostgreSQL driver can consume project migration metadata from:

- `psm.migration.yml`
- `psm.migration.yaml`
- `psm.migration.json`

Current runtime support implemented in the PostgreSQL driver:

- `rules.etl.fallback`

This means the driver can use project-specific fallback rules while restoring legacy rows into a newly shaped table.

Real examples:

- old `id varchar` becoming `id int` plus `identifier varchar`
- old `status varchar` becoming `status int` plus `workflow_status varchar`
- moving values from `book_id` into `book_identifier`

Current limitation:

- structural rule families such as `rename`, `transform`, `move`, and `rls` can already be authored by the CLI in `psm.migration.yml`, but their SQL materialization is not yet executed by the PostgreSQL driver

### Safer restore behavior

The PostgreSQL driver includes restore protections designed for drift-heavy legacy migrations.

Current safeguards include:

- skipping sequence restoration when the legacy source column no longer exists
- skipping sequence restoration when the legacy source column is not sequence-compatible
- sanitizing invalid numeric and boolean legacy values before `jsonb_populate_record`
- using ETL fallback rules from `psm.migration.yml`
- delaying foreign key creation until all temporary tables exist

This is important for cases such as:

- legacy string ids like `REQ-2026-006`
- old text statuses migrated into integer status columns
- partial schema evolution where source and target types no longer match

### Real-world workflows

#### Workflow 1: normal Prisma schema migration with PostgreSQL validation

```bash
npx prisma generate
psm commit --label "add reporting view"
psm deploy
```

What happens:

- the driver builds PostgreSQL SQL
- validation is executed against PostgreSQL
- the committed revision stores migration SQL and a backup
- deploy replays the same revision archive elsewhere

#### Workflow 2: ship custom SQL with the release

```bash
psm execute --groups functions views --label "reporting pack"
```

Useful when:

- a materialized view refresh function changes
- reporting views evolve independently from Prisma models
- audit triggers need patching in the same release window

#### Workflow 3: legacy restore into normalized tables

Context:

- legacy rows still exist in a previous shape
- the new Prisma schema introduces normalized ids and audit fields

Approach:

1. declare ETL fallback rules in `psm.migration.yml`
2. run `npx prisma generate`
3. let the PostgreSQL driver validate the restore path in the shadow schema

Why this matters:

- the restore path becomes testable before commit
- project-specific logic stays out of the shared driver code

### Notes

- the package is PostgreSQL-specific
- it depends on the URL passed through `@prisma-psm/core`
- backup and restore are shell-driven
- validation behavior depends on real PostgreSQL execution when a URL is configured

### License

ISC

## Português

### O que é

`@prisma-psm/pg` é o runtime PostgreSQL e o gerador SQL do Prisma Safe Migrate.

É o pacote que sabe:

- transformar metadados Prisma parseados em SQL PostgreSQL
- montar scripts de bootstrap, validação e aplicação
- criar e restaurar backups PostgreSQL
- consultar o registro de migrações
- executar revisões commitadas
- restaurar linhas legadas em novas estruturas de tabela durante os fluxos de validação e migração

Este pacote deve ser usado junto com `@prisma-psm/core`.

### Instalação

```bash
npm install --save-dev @prisma-psm/core @prisma-psm/pg
```

### Requisitos

- PostgreSQL
- driver `pg` para Node.js
- `pg_dump` disponível no ambiente de shell
- `psql` disponível no ambiente de shell

### Configuração no Prisma

```prisma
generator psm {
  provider = "psm generate"
  output   = "./psm"
  driver   = "@prisma-psm/pg"
  url      = env("DATABASE_URL")
  sys      = "sys"
}
```

### O que o driver entrega

`@prisma-psm/pg` implementa o contrato `PSMDriver` do `@prisma-psm/core`.

Capacidades principais:

- `generator(opts)`: monta SQL PostgreSQL para `core`, `check` e `migrate`
- `migrator(opts)`: executa SQL, gera dump do banco, restaura backups e anexa payloads de SQL customizado
- `migrated(opts)`: lê ids de migração aplicados em `<sys>.migration`
- `prepare(model)`: normaliza metadados parseados antes da geração do SQL
- `getCompletions()`: expõe completions orientados a SQL para tooling

### Modelo SQL

O driver emite três bundles SQL principais:

- `core`: SQL de bootstrap para objetos de suporte e registro de migração
- `check`: SQL de validação usado como script de preflight
- `migrate`: SQL de aplicação da próxima revisão

Internamente, o parser PostgreSQL coordena:

- criação de tabelas
- alocação temporária em shadow schema
- ordenação por dependências
- lógica de restore de backup
- geração de índices e constraints
- alocação final das tabelas
- escrita no registro de migração

### Sequência de execução

Quando chamado via `@prisma-psm/core`, a sequência típica é:

1. `core()` para garantir que os objetos de suporte existam
2. `test()` para executar a migração gerada de `check`
3. `dump()` para capturar um backup antes do commit
4. `migrate()` para aplicar o bundle SQL final

O driver reporta:

- flag de sucesso
- mensagens coletadas
- erros de conexão
- erros de execução SQL

### Backup e restore

#### Backup

O driver PostgreSQL cria backups usando:

```bash
pg_dump -cOv --if-exists <DATABASE_URL>
```

Comportamento:

- a saída é gravada em um `backup.sql` temporário
- o caminho desse arquivo é devolvido ao `@prisma-psm/core`
- esse arquivo depois é embutido nos arquivos de revisão commitados

#### Restore

O driver PostgreSQL restaura backups usando:

```bash
psql -d <DATABASE_URL> -f <backup.sql>
```

O restore normalmente é acionado:

- durante `psm deploy`, para a primeira revisão pendente que possui backup
- durante fluxos de validação que reconstroem dados legados em estruturas temporárias

Implicações operacionais:

- ambientes de deploy precisam expor `pg_dump` e `psql`
- rede e credenciais precisam permitir acesso PostgreSQL via CLI

### Registro de migrações

As revisões aplicadas são lidas de:

```sql
select sid, date
  from <sys>.migration
 where ($1::text[] is null or sid = any($1::text[]));
```

É assim que `psm deploy` decide quais arquivos ainda estão pendentes.

### Recursos SQL customizados

O driver consegue anexar recursos SQL crus coletados pelo `@prisma-psm/core` a partir de:

- `psm/functions`
- `psm/triggers`
- `psm/views`

Quando esses recursos existem:

- `migrate()` os anexa ao SQL gerado
- `migrateRaw()` devolve o bundle SQL final gravado nos arquivos de revisão
- `execute()` pode executá-los isoladamente com `psm execute`

Estrutura de exemplo:

```text
prisma/
  psm/
    functions/
      audit/
        set_updated_at.sql
    triggers/
      audit_user_changes.sql
    views/
      reporting/
        customer_summary.sql
```

### Suporte ao sidecar de migração do projeto

Quando usado com `@prisma-psm/core`, o driver PostgreSQL consegue consumir metadados de migração do projeto a partir de:

- `psm.migration.yml`
- `psm.migration.yaml`
- `psm.migration.json`

Suporte atual em runtime no driver PostgreSQL:

- `rules.etl.fallback`

Isso significa que o driver pode usar regras específicas do projeto enquanto restaura linhas legadas para uma tabela com novo formato.

Exemplos reais:

- `id varchar` antigo virando `id int` mais `identifier varchar`
- `status varchar` antigo virando `status int` mais `workflow_status varchar`
- mover valores de `book_id` para `book_identifier`

Limitação atual:

- famílias estruturais como `rename`, `transform`, `move` e `rls` já podem ser escritas pela CLI em `psm.migration.yml`, mas sua materialização SQL ainda não é executada pelo driver PostgreSQL

### Comportamento de restore mais seguro

O driver PostgreSQL inclui proteções de restore pensadas para migrações legadas com bastante drift.

Proteções atuais:

- pular restauração de sequência quando a coluna antiga já não existe
- pular restauração de sequência quando a coluna antiga não é compatível com sequência
- sanitizar valores numéricos e booleanos inválidos antes de `jsonb_populate_record`
- usar regras ETL vindas de `psm.migration.yml`
- adiar criação de foreign keys até que todas as tabelas temporárias existam

Isso é importante para casos como:

- ids legados em string como `REQ-2026-006`
- status antigos em texto sendo migrados para colunas inteiras
- evolução parcial de schema em que origem e destino já não têm os mesmos tipos

### Workflows reais

#### Workflow 1: migração normal de schema Prisma com validação em PostgreSQL

```bash
npx prisma generate
psm commit --label "add reporting view"
psm deploy
```

O que acontece:

- o driver monta SQL PostgreSQL
- a validação é executada contra PostgreSQL
- a revisão commitada armazena SQL de migração e um backup
- o deploy reaplica o mesmo arquivo de revisão em outro ambiente

#### Workflow 2: publicar SQL customizado junto com a release

```bash
psm execute --groups functions views --label "reporting pack"
```

Útil quando:

- muda uma função de refresh de materialized view
- views de reporting evoluem independentemente dos models Prisma
- triggers de auditoria precisam de ajuste na mesma janela de release

#### Workflow 3: restore legado em tabelas normalizadas

Contexto:

- ainda existem linhas antigas em um formato anterior
- o novo schema Prisma introduz ids normalizados e campos de auditoria

Abordagem:

1. declarar regras ETL em `psm.migration.yml`
2. executar `npx prisma generate`
3. deixar o driver PostgreSQL validar o caminho de restore no shadow schema

Por que isso importa:

- o caminho de restore se torna testável antes do commit
- a lógica específica do projeto continua fora do driver compartilhado

### Notas

- o pacote é específico para PostgreSQL
- ele depende da URL passada pelo `@prisma-psm/core`
- backup e restore são dirigidos por shell
- o comportamento de validação depende de execução real em PostgreSQL quando existe URL configurada

### Licença

ISC
