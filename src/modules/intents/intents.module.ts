import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '../_core/cache/cache.module';
import { ConfigModule } from '../../config/config.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { IntentsController } from './controller/intents.controller';
import { IntentsService } from './services/intents.service';

@Module({
    imports: [ConfigModule, CacheModule],
    providers: [IntentsService],
    exports: [IntentsService],
    controllers: [IntentsController],
})
export class IntentsModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(IntentsController);
    }
}
