import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContextMessage } from './context-message/entities/context-message.entity';
import { synchronizePostgres } from '../../common/utils/sync';
import { CONTEXT_AI } from './ormconfig';
import { TrainingEntry } from './training-entry/entities/training-entry.entity';
import { ContextMessagesModule } from './context-message/context-message.module';
import { ContextAiImplementorModule } from './context-ai-executor/context-ai-implementor.module';
import { EmbeddingsModule } from './embeddings/embeddings.module';
import { ContextVariableModule } from './context-variable/context-variable.module';
import { ContextVariable } from './context-variable/entities/context-variables.entity';
import { ExecutedTrainingModule } from './executed-training/executed-training.module';
import { ExecutedTraining } from './executed-training/executed-training.entity';
import { ContextFallbackMessagesModule } from './context-fallback-message/context-fallback-message.module';
import { ContextFallbackMessage } from './context-fallback-message/entities/context-fallback-message.entity';
import { TrainingEntryModule } from './training-entry/training-entry.module';
import { AudioTranscriptionModule } from './audio-transcription/audio-transcription.module';
import { AudioTranscription } from './audio-transcription/models/audio-transcription.entity';
import { Agent } from './agent/entities/agent.entity';
import { AgentModule } from './agent/agent.module';
import { AiProviderModule } from './ai-provider/ai.module';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: CONTEXT_AI,
            url: process.env.POSTGRESQL_URI,
            entities: [
                ContextMessage,
                TrainingEntry,
                ContextVariable,
                ExecutedTraining,
                ContextFallbackMessage,
                AudioTranscription,
                Agent,
            ],
            synchronize: synchronizePostgres,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: CONTEXT_AI,
        }),
        ContextMessagesModule,
        ContextAiImplementorModule,
        TrainingEntryModule,
        ExecutedTrainingModule,
        EmbeddingsModule,
        ContextVariableModule,
        ContextFallbackMessagesModule,
        AudioTranscriptionModule,
        AgentModule,
        AiProviderModule,
    ],
})
export class ContextAiModule {}
