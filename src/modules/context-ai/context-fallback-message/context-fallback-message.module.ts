import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CONTEXT_AI } from '../ormconfig';
import { ContextFallbackMessage } from './entities/context-fallback-message.entity';
import { ContextFallbackMessageService } from './context-fallback-message.service';
import { ContextFallbackMessageController } from './context-fallback-message.controller';
import { AuthMiddleware } from '../../auth/middleware/auth.middleware';

@Module({
    imports: [TypeOrmModule.forFeature([ContextFallbackMessage], CONTEXT_AI)],
    providers: [ContextFallbackMessageService],
    exports: [ContextFallbackMessageService],
    controllers: [ContextFallbackMessageController],
})
export class ContextFallbackMessagesModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(ContextFallbackMessageController);
    }
}
