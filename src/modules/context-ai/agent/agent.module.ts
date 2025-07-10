import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent } from './entities/agent.entity';
import { AgentService } from './services/agent.service';
import { AgentController } from './controllers/agent.controller';
import { CONTEXT_AI } from '../ormconfig';
import { AuthMiddleware } from '../../auth/middleware/auth.middleware';

@Module({
    imports: [TypeOrmModule.forFeature([Agent], CONTEXT_AI)],
    controllers: [AgentController],
    providers: [AgentService],
    exports: [AgentService],
})
export class AgentModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(AgentController);
    }
}
