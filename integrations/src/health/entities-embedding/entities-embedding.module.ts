import { forwardRef, Module } from '@nestjs/common';
import { EntitiesEmbeddingService } from './services/entities-embedding.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { INTEGRATIONS_CONNECTION_NAME } from '../ormconfig';
import { EntitiesEmbedding } from './entities/entities-embedding.entity';
import { AiModule } from '../ai/ai.module';
import { EntitiesEmbeddingController } from './entities-embedding.controller';
import { EntitiesEmbeddingBatchService } from './services/entities-embedding-batch.service';
import { EntitiesModule } from '../entities/entities.module';
import { EntitiesEmbeddingSync } from './entities/entities-embedding-sync.entity';
import { IntegratorModule } from '../integrator/integrator.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EntitiesEmbedding, EntitiesEmbeddingSync], INTEGRATIONS_CONNECTION_NAME),
    AiModule,
    forwardRef(() => IntegratorModule),
    forwardRef(() => EntitiesModule),
  ],
  providers: [EntitiesEmbeddingService, EntitiesEmbeddingBatchService],
  controllers: [EntitiesEmbeddingController],
  exports: [EntitiesEmbeddingService, EntitiesEmbeddingBatchService],
})
export class EntitiesEmbeddingModule {}
