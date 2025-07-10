import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CONTEXT_AI } from '../ormconfig';
import { AuthMiddleware } from '../../auth/middleware/auth.middleware';
import { ContextVariable } from './entities/context-variables.entity';
import { ContextVariableService } from './context-variable.service';
import { ContextVariableController } from './context-variable.controller';
import { CacheModule } from '../../_core/cache/cache.module';
import { AgentModule } from '../agent/agent.module';

@Module({
    imports: [TypeOrmModule.forFeature([ContextVariable], CONTEXT_AI), CacheModule, AgentModule],
    controllers: [ContextVariableController],
    providers: [ContextVariableService],
    exports: [ContextVariableService],
})
export class ContextVariableModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(ContextVariableController);
    }
}
