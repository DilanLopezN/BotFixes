# Database Migrations Module

Este módulo gerencia as migrações do banco de dados PostgreSQL usando TypeORM 0.2.x.

## Estrutura

```
src/modules/database-migrations/
├── config/
│   └── datasource.ts                     # Configuração de conexão TypeORM
├── migrations/                           # Diretório das migrações
│   └── 1714091288000-InitialMigration.ts
├── database-migrations.module.ts         # Configurações do modulo
└── README.md                             # Esta documentação
```

## Comandos CLI (via Makefile)

### Criar uma nova migração
```bash
make create-migration name=NomeDaMigracao
```

### Executar migrações pendentes
```bash
make run-migration
```

### Reverter a última migração
```bash
make revert-migration
```

### Verificar status das migrações
```bash
make show-migration
```

## Boas Práticas

1. **Nomenclatura**: Use nomes descritivos para as migrações, indicando claramente o propósito.
2. **Verificação**: Sempre teste suas migrações em ambiente de desenvolvimento antes de aplicá-las em produção.
3. **Rollback**: Certifique-se de que a função `down()` desfaça corretamente todas as alterações da função `up()`.
4. **Controle de Versão**: Mantenha os arquivos de migração no controle de versão junto com o código.
5. **Transações**: Considere usar transações para garantir a integridade dos dados durante as migrações.

## Exemplo de Uso

```bash
# Criar uma nova migração para adicionar tabela de usuários
make create-migration name=CreateUsersTable

# Verificar se a migração foi criada
make show-migration

# Executar a migração
make run-migration

# Se necessário, reverter
make revert-migration
```
