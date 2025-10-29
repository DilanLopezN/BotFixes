import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { AgentSkills } from './entities/agent-skills.entity';
import { AgentSkillsService } from './agent-skills.service';
import { AgentSkillsController } from './agent-skills.controller';
import { CONTEXT_AI } from '../ormconfig';
import { AuthMiddleware } from '../../auth/middleware/auth.middleware';
import { ListDoctorsSkill, ListDoctorsApi, ListAppointmentsSkill, ListAppointmentsApi } from './skills';
import { ListAppointmentsCacheService } from './skills/implementations/list-appointments/list-appointments-cache.service';
import { AiProviderModule } from '../ai-provider/ai.module';
import { SkillSessionService } from './skills/services/skill-session.service';
import { RedisModule } from '../../../common/redis/redis.module';
import { DataExtractionUtil } from '../data-extractors/data-extraction.util';
import { LLMDataExtractor } from '../data-extractors/llm-data-extractor.util';
import { SkillRegistry } from './skills/registry/skill-registry.service';
import { RagSearchService } from './services/rag-search.service';
import { EmbeddingsModule } from '../embeddings/embeddings.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([AgentSkills], CONTEXT_AI),
        HttpModule,
        AiProviderModule,
        RedisModule,
        EmbeddingsModule,
    ],
    controllers: [AgentSkillsController],
    providers: [
        AgentSkillsService,
        SkillRegistry,
        ListDoctorsSkill,
        ListDoctorsApi,
        ListAppointmentsSkill,
        ListAppointmentsApi,
        ListAppointmentsCacheService,
        SkillSessionService,
        DataExtractionUtil,
        LLMDataExtractor,
        RagSearchService,
    ],
    exports: [AgentSkillsService, SkillSessionService, RagSearchService],
})
export class AgentSkillsModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(AgentSkillsController);
    }
}
