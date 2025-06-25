import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DATABASE_MIGRATIONS_CONNECTION } from './config/datasource';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: DATABASE_MIGRATIONS_CONNECTION,
            url: process.env.POSTGRESQL_URI,
            synchronize: false,
            logging: process.env.NODE_ENV !== 'production',
            entities: [],
            migrations:
                process.env.NODE_ENV === 'production'
                    ? ['dist/modules/database-migrations/migrations/*.js']
                    : ['dist/modules/database-migrations/migrations/*.js'],
            migrationsRun: process.env.NODE_ENV !== 'test',
            autoLoadEntities: false,
        }),
    ],
})
export class DatabaseMigrationsModule {}
