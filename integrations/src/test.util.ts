import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from './app.config';
import databaseConfig from './database.config';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';

export const testUtils = {
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['../.env'],
      isGlobal: true,
      load: [appConfig, databaseConfig],
    }),
  ],
};

export const testUtilsMongo = {
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        ({
          uri: configService.get<string>('database.uri'),
          useNewUrlParser: true,
          dbName: 'kissbot-integrations-test',
        }) as MongooseModuleOptions,
      inject: [ConfigService],
    }),
  ],
};
