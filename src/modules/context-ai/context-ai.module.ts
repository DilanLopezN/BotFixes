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
import { IntentDetection } from './intent-detection/entities/intent-detection.entity';
import { IntentActions } from './intent-detection/entities/intent-actions.entity';
import { IntentDetectionUserHistory } from './intent-detection/entities/intent-detection-user-history.entity';
import { IntentDetectionModule } from './intent-detection/intent-detection.module';
import { IntentLibrary } from './intent-library/entities/intent-library.entity';
import { IntentLibraryModule } from './intent-library/intent-library.module';
import { AgentSkillsModule } from './agent-skills/agent-skills.module';
import { AgentSkills } from './agent-skills/entities/agent-skills.entity';
import { TrainingEntryType } from './training-entry/entities/training-entry-type.entity';
import { AudioTts } from './audio-tts/entities/audio.entity';
import { FileExtractModule } from './file-extract/file-extract.module';
import { FileExtract } from './file-extract/entities/file-extract.entity';
import { GuardrailsModule } from './guardrails/guardrails.module';
import { ConversationTraceEntity } from './context-ai-executor/entities/conversation-trace.entity';

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
                IntentDetection,
                IntentActions,
                IntentDetectionUserHistory,
                IntentLibrary,
                AgentSkills,
                TrainingEntryType,
                AudioTts,
                FileExtract,
                ConversationTraceEntity,
            ],
            replication: {
                master: {
                    url: process.env.POSTGRESQL_URI,
                },
                slaves: [
                    {
                        url: process.env.POSTGRESQL_READ_URI,
                    },
                ],
            },
            synchronize: synchronizePostgres,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: CONTEXT_AI,
            extra: {
                min: 1,
                max: 3,
            },
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
        IntentDetectionModule,
        IntentLibraryModule,
        AgentSkillsModule,
        FileExtractModule,
        GuardrailsModule,
    ],
})
export class ContextAiModule {}
