# @prisma-psm/pg

PostgreSQL driver for Prisma Safe Migrate. It generates PostgreSQL-specific SQL, executes validation and migration scripts, reads migration history, creates dumps with `pg_dump`, and restores backups with `psql`.

[English](#english) | [Português](#português)

## English

### What it is

`@prisma-psm/pg` is the PostgreSQL runtime and SQL generator for Prisma Safe Migrate.

It is responsible for:

- turning parsed Prisma models into PostgreSQL SQL
- preparing the migration registry and support structures
- executing generated SQL against PostgreSQL
- checking which revisions were already applied
- creating backups with `pg_dump`
- restoring backups with `psql`

This package is meant to be used with `@prisma-psm/core`.

### Installation

```bash
npm install --save-dev @prisma-psm/core @prisma-psm/pg
```

### Requirements

- PostgreSQL
- `pg` Node.js driver
- `pg_dump` available in the shell environment
- `psql` available in the shell environment

### Prisma configuration

Point the PSM generator to the PostgreSQL driver:

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

Key capabilities:

- `generator(opts)`: creates PostgreSQL SQL for `check`, `migrate`, and `core`
- `migrator(opts)`: executes SQL, restores backups, dumps the database, and executes custom SQL resources
- `migrated(opts)`: reads applied migration IDs from `<sys>.migration`
- `prepare(model)`: normalizes model metadata before SQL generation
- `getCompletions()`: returns SQL keywords for completion-oriented tooling

### SQL generation model

The driver builds SQL from parsed Prisma metadata and produces three outputs:

- `core`: bootstrap SQL for internal support structures, including migration tracking
- `check`: validation SQL used as a safe preflight
- `migrate`: SQL used to apply the next revision

Internally, the PostgreSQL parser organizes models, indexes, dependencies, backup strategy, shadow structures, and final allocation steps.

### Migration behavior

When called through `@prisma-psm/core`, the driver typically runs in this sequence:

1. `core()` to ensure support objects exist
2. `test()` to execute `migration.next.check.sql`
3. `dump()` to create a backup
4. `migrate()` to apply the final SQL bundle

The driver executes SQL through the `pg` client and reports:

- success flag
- collected messages
- connection errors
- SQL execution errors

### Backup and restore behavior

Backup:

- uses `pg_dump -cOv --if-exists <DATABASE_URL>`
- streams output into a temporary `backup.sql`
- returns the dump file path to `@prisma-psm/core`

Restore:

- uses `psql -d <DATABASE_URL> -f <backup.sql>`
- is triggered during `psm deploy` for the first unapplied revision that carries a backup

Operational implication:

- deployment environments must have both `pg_dump` and `psql` installed
- credentials and network access must allow CLI-based PostgreSQL tools to run

### Applied revision lookup

To detect already deployed revisions, the driver queries:

```sql
select sid, date
  from <sys>.migration
 where ($1::text[] is null or sid = any($1::text[]));
```

That is how `psm deploy` knows which archives are still pending.

### Custom SQL resources

The driver can append raw SQL resources collected by `@prisma-psm/core` from:

- `psm/functions`
- `psm/triggers`
- `psm/views`

When these resources are present:

- `migrate()` appends them to the generated migration SQL
- `migrateRaw()` produces the final SQL bundle written into committed revision archives
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

### Example workflow

```bash
# Generate PostgreSQL migration artifacts
npx prisma generate

# Commit the next revision
psm commit --label "add reporting view"

# Deploy committed revisions to another environment
psm deploy
```

### Example: custom SQL rollout

```bash
# Execute only function and view resources
psm execute --groups functions views --label "reporting pack"
```

This is useful when you need to version database objects that Prisma does not model directly.

### Use cases

#### Use case 1: PostgreSQL-first teams with strict deploy control

Generate once, review SQL, commit a revision archive, and replay that same archive in downstream environments.

#### Use case 2: schema changes plus database objects

Ship Prisma model changes together with triggers, functions, and views stored under `psm/`.

#### Use case 3: safer operational restore points

Create dumps before applying committed revisions so production rollouts have a concrete recovery artifact.

### Notes

- The package is PostgreSQL-specific.
- It depends on the database URL passed by `@prisma-psm/core`.
- Backup and restore are shell-driven, so local and CI environments must expose PostgreSQL CLI tools.

### License

ISC

## Português

### O que é

`@prisma-psm/pg` é o runtime PostgreSQL e o gerador SQL do Prisma Safe Migrate.

Ele é responsável por:

- transformar models Prisma parseados em SQL específico de PostgreSQL
- preparar o registro de migrações e estruturas de suporte
- executar SQL gerado contra PostgreSQL
- verificar quais revisões já foram aplicadas
- criar backups com `pg_dump`
- restaurar backups com `psql`

Este pacote deve ser usado junto com `@prisma-psm/core`.

### Instalação

```bash
npm install --save-dev @prisma-psm/core @prisma-psm/pg
```

### Requisitos

- PostgreSQL
- Driver `pg` para Node.js
- `pg_dump` disponível no ambiente de shell
- `psql` disponível no ambiente de shell

### Configuração no Prisma

Aponte o generator PSM para o driver PostgreSQL:

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

`@prisma-psm/pg` implementa o contrato `PSMDriver` exportado por `@prisma-psm/core`.

Capacidades principais:

- `generator(opts)`: cria SQL PostgreSQL para `check`, `migrate` e `core`
- `migrator(opts)`: executa SQL, restaura backups, gera dumps e executa recursos SQL customizados
- `migrated(opts)`: lê IDs de migração aplicados em `<sys>.migration`
- `prepare(model)`: normaliza metadados do model antes da geração do SQL
- `getCompletions()`: retorna palavras-chave SQL para ferramentas com autocompletar

### Modelo de geração SQL

O driver monta SQL a partir de metadados Prisma parseados e produz três saídas:

- `core`: SQL base para estruturas internas e tracking de migração
- `check`: SQL de validação usado como preflight seguro
- `migrate`: SQL usado para aplicar a próxima revisão

Internamente, o parser PostgreSQL organiza models, índices, dependências, estratégia de backup, estruturas shadow e passos finais de alocação.

### Comportamento da migração

Quando chamado via `@prisma-psm/core`, o driver normalmente roda nesta sequência:

1. `core()` para garantir que os objetos de suporte existam
2. `test()` para executar `migration.next.check.sql`
3. `dump()` para criar um backup
4. `migrate()` para aplicar o bundle SQL final

O driver executa SQL através do cliente `pg` e reporta:

- flag de sucesso
- mensagens coletadas
- erros de conexão
- erros de execução SQL

### Comportamento de backup e restore

Backup:

- usa `pg_dump -cOv --if-exists <DATABASE_URL>`
- grava a saída em um `backup.sql` temporário
- devolve o caminho do dump para `@prisma-psm/core`

Restore:

- usa `psql -d <DATABASE_URL> -f <backup.sql>`
- é acionado durante `psm deploy` na primeira revisão pendente que contém backup

Implicação operacional:

- ambientes de deploy precisam ter `pg_dump` e `psql` instalados
- credenciais e acesso de rede precisam permitir a execução dessas ferramentas

### Consulta de revisões aplicadas

Para detectar revisões já publicadas, o driver consulta:

```sql
select sid, date
  from <sys>.migration
 where ($1::text[] is null or sid = any($1::text[]));
```

É assim que `psm deploy` identifica quais arquivos ainda estão pendentes.

### Recursos SQL customizados

O driver consegue anexar recursos SQL crus coletados pelo `@prisma-psm/core` a partir de:

- `psm/functions`
- `psm/triggers`
- `psm/views`

Quando esses recursos existem:

- `migrate()` os anexa ao SQL de migração gerado
- `migrateRaw()` produz o bundle SQL final escrito dentro dos arquivos de revisão
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

### Exemplo de workflow

```bash
# Gerar artefatos de migração PostgreSQL
npx prisma generate

# Comitar a próxima revisão
psm commit --label "add reporting view"

# Fazer deploy das revisões commitadas em outro ambiente
psm deploy
```

### Exemplo: rollout de SQL customizado

```bash
# Executar apenas functions e views
psm execute --groups functions views --label "reporting pack"
```

Isso é útil quando você precisa versionar objetos de banco que o Prisma não modela diretamente.

### Casos de uso

#### Caso de uso 1: times PostgreSQL com controle rígido de deploy

Gere uma vez, revise o SQL, faça commit do arquivo de revisão e replique exatamente esse mesmo arquivo nos ambientes seguintes.

#### Caso de uso 2: mudança de schema junto com objetos de banco

Publique alterações de models Prisma junto com triggers, functions e views guardadas em `psm/`.

#### Caso de uso 3: pontos de restauração mais seguros

Crie dumps antes de aplicar revisões commitadas para que rollouts de produção tenham um artefato concreto de recuperação.

### Observações

- O pacote é específico para PostgreSQL.
- Ele depende da URL de banco fornecida pelo `@prisma-psm/core`.
- Backup e restore são dirigidos por shell, então ambientes locais e de CI precisam expor as ferramentas de CLI do PostgreSQL.

### Licença

ISC
