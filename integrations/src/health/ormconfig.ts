import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Appointment } from 'kissbot-entities';
import { BotdesignerFakePatient } from './integrations/botdesigner-fake-integration/entities/botdesigner-fake-patient.entity';
import { BotdesignerFakeAppointment } from './integrations/botdesigner-fake-integration/entities/botdesigner-fake-appointment.entity';

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

export const BOTDESIGNER_FAKE_ORM_CONFIG: TypeOrmModuleOptions = {
  type: 'postgres',
  synchronize,
  migrationsRun: false,
  schema: 'botdesigner_fake_integration',
  entities: [BotdesignerFakePatient, BotdesignerFakeAppointment],
};

export const ANALYTICS_CONNECTION_NAME = 'analytics';
export const INTEGRATIONS_CONNECTION_NAME = 'integrations';
export const BOTDESIGNER_FAKE_CONNECTION_NAME = 'botdesigner_fake_integration';
