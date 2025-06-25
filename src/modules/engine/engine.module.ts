import { AuthMiddleware } from './../auth/middleware/auth.middleware';
import { forwardRef, Module, MiddlewareConsumer } from '@nestjs/common';
import { EngineController } from './engine.controller';
import { EngineService } from './engine.service';
import { BotsModule } from '../bots/bots.module';
import { EntitiesModule } from '../entities/entities.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { CacheModule } from './../_core/cache/cache.module';
import { EventsModule } from '../events/events.module';
import { ExternalDataService } from './services/external-data.service';

@Module({
    controllers: [EngineController],
    imports: [
        forwardRef(() => BotsModule),
        EntitiesModule,
        WorkspacesModule,
        CacheModule,
        EventsModule,
    ],
    providers: [EngineService, ExternalDataService],
})
export class EngineModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(EngineController);
    }
}
