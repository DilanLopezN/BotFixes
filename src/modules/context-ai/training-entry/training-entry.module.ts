import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingEntryService } from './training-entry.service';
import { CONTEXT_AI } from '../ormconfig';
import { TrainingEntry } from './entities/training-entry.entity';
import { TrainingEntryType } from './entities/training-entry-type.entity';
import { TrainingEntryController } from './controllers/training-entry.controller';
import { TrainingEntryTypeController } from './controllers/training-entry-type.controller';
import { TrainingEntryTypeService } from './training-entry-type.service';
import { AuthMiddleware } from '../../auth/middleware/auth.middleware';
import { AgentModule } from '../agent/agent.module';

@Module({
    imports: [TypeOrmModule.forFeature([TrainingEntry, TrainingEntryType], CONTEXT_AI), AgentModule],
    controllers: [TrainingEntryController, TrainingEntryTypeController],
    providers: [TrainingEntryService, TrainingEntryTypeService],
    exports: [TrainingEntryService, TrainingEntryTypeService],
})
export class TrainingEntryModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(TrainingEntryController, TrainingEntryTypeController);
    }
}
