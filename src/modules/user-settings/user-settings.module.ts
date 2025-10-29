import { Module, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { USER_SETTINGS_CONNECTION } from './ormconfig';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { UserSettingsEntity } from './entities/user-settings.entity';
import { UserSettingsService } from './services/user-settings.service';
import { UserSettingsController } from './controllers/user-settings.controller';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: USER_SETTINGS_CONNECTION,
            url: process.env.POSTGRESQL_URI,
            entities: [__dirname + '/entities/**/*.entity{.ts,.js}'],
            synchronize: false,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: 'user',
            extra: {
                min: 1,
                timezone: 'UTC',
            },
        }),
        TypeOrmModule.forFeature([UserSettingsEntity], USER_SETTINGS_CONNECTION),
    ],
    providers: [UserSettingsService],
    controllers: [UserSettingsController],
    exports: [UserSettingsService],
})
export class UserSettingsModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(UserSettingsController);
    }
}
