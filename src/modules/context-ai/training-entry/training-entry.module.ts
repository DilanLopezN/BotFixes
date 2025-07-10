import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingEntryService } from './training-entry.service';
import { CONTEXT_AI } from '../ormconfig';
import { TrainingEntry } from './entities/training-entry.entity';
import { TrainingEntryController } from './training-entry.controller';
import { AuthMiddleware } from '../../auth/middleware/auth.middleware';
import { AgentModule } from '../agent/agent.module';

@Module({
    imports: [TypeOrmModule.forFeature([TrainingEntry], CONTEXT_AI), AgentModule],
    controllers: [TrainingEntryController],
    providers: [TrainingEntryService],
    exports: [TrainingEntryService],
})
export class TrainingEntryModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(TrainingEntryController);
    }
}
