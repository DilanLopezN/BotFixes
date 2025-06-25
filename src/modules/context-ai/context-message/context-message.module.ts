import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CONTEXT_AI } from '../ormconfig';
import { ContextMessage } from './entities/context-message.entity';
import { ContextMessageService } from './context-message.service';
import { AuthMiddleware } from '../../auth/middleware/auth.middleware';
import { ContextMessageController } from './context-message.controller';

@Module({
    imports: [TypeOrmModule.forFeature([ContextMessage], CONTEXT_AI)],
    controllers: [ContextMessageController],
    providers: [ContextMessageService],
    exports: [ContextMessageService],
})
export class ContextMessagesModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(ContextMessageController);
    }
}
