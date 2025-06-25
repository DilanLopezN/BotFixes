import { ConnectionOptions } from 'typeorm';

const isProduction = process.env.NODE_ENV === 'production';

const config: ConnectionOptions = {
    type: 'postgres',
    url: process.env.POSTGRESQL_URI,
    synchronize: false,
    logging: process.env.NODE_ENV !== 'production',
    entities: [],
    migrations: [
        isProduction
            ? 'dist/modules/database-migrations/migrations/*.js'
            : 'src/modules/database-migrations/migrations/*.ts',
    ],
    migrationsTableName: 'typeorm_migrations',
    cli: {
        migrationsDir: isProduction
            ? 'dist/modules/database-migrations/migrations'
            : 'src/modules/database-migrations/migrations',
    },
};

export = config;
