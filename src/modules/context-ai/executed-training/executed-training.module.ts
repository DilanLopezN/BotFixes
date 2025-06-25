import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CONTEXT_AI } from '../ormconfig';
import { ExecutedTraining } from './executed-training.entity';
import { ExecutedTrainingService } from './executed-training.service';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { ExecutedTrainingsController } from './executed-training.controller';
import { AuthMiddleware } from '../../auth/middleware/auth.middleware';
import { TrainingEntryModule } from '../training-entry/training-entry.module';

@Module({
    imports: [TypeOrmModule.forFeature([ExecutedTraining], CONTEXT_AI), EmbeddingsModule, TrainingEntryModule],
    controllers: [ExecutedTrainingsController],
    providers: [ExecutedTrainingService],
    exports: [ExecutedTrainingService],
})
export class ExecutedTrainingModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(ExecutedTrainingsController);
    }
}
