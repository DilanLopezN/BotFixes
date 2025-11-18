import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Appointment } from 'kissbot-entities';

const synchronize = process.env.NODE_ENV === 'local';

export const INTEGRATIONS_ORM_CONFIG: TypeOrmModuleOptions = {
  type: 'postgres',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize,
  migrationsRun: false,
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  schema: 'integrations',
};

export const ANALYTICS_ORM_CONFIG: TypeOrmModuleOptions = {
  type: 'postgres',
  synchronize: false,
  migrationsRun: false,
  schema: 'analytics',
  entities: [Appointment],
};

export const ANALYTICS_CONNECTION_NAME = 'analytics';
export const INTEGRATIONS_CONNECTION_NAME = 'integrations';
