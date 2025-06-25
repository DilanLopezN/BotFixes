import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '../_core/cache/cache.module';
import { ConfigModule } from '../../config/config.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AUTO_ASSIGN_CONNECTION } from './ormconfig';
import { AutoAssignConversationService } from './services/auto-assign-conversation.service';
import { ContactAutoAssignService } from './services/contact-auto-assign.service';
import { ExternalDataService } from './services/external-data.service';
import { AutoAssignConversationController } from './controllers/auto-assign-conversation.controller';
import { ContactAutoAssignController } from './controllers/contact-auto-assign.controller';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { AutoAssignConversation } from './models/auto-assign-conversation.entity';
import { ContactAutoAssign } from './models/contact-auto-assign.entity';
import { synchronizePostgres } from '../../common/utils/sync';
import { AutoAssignHealthCheckService } from './services/auto-assign-health-check.service';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: AUTO_ASSIGN_CONNECTION,
            url: process.env.POSTGRESQL_URI,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: synchronizePostgres || true,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: AUTO_ASSIGN_CONNECTION,
        }),
        TypeOrmModule.forFeature([AutoAssignConversation, ContactAutoAssign], AUTO_ASSIGN_CONNECTION),
        CacheModule,
    ],
    providers: [
        AutoAssignConversationService,
        ContactAutoAssignService,
        ExternalDataService,
        AutoAssignHealthCheckService,
    ],
    exports: [AutoAssignConversationService],
    controllers: [AutoAssignConversationController, ContactAutoAssignController],
})
export class AutoAssignModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(AutoAssignConversationController, ContactAutoAssignController);
    }
}
