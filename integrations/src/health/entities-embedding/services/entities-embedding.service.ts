import { Injectable } from '@nestjs/common';
import { AiEmbeddingService } from '../../ai/ai-embedding.service';
import { InjectRepository } from '@nestjs/typeorm';
import { EntitiesEmbedding } from '../entities/entities-embedding.entity';
import { INTEGRATIONS_CONNECTION_NAME } from '../../ormconfig';
import { In, Repository } from 'typeorm';

@Injectable()
export class EntitiesEmbeddingService {
  constructor(
    @InjectRepository(EntitiesEmbedding, INTEGRATIONS_CONNECTION_NAME)
    private entitiesEmbeddingRepository: Repository<EntitiesEmbedding>,
    private readonly aiEmbeddingService: AiEmbeddingService,
  ) {}

  async getEmbeddingFromText(text: string): Promise<{ embedding: number[]; tokens: number }> {
    try {
      const { embedding, tokens } = await this.aiEmbeddingService.generateEmbeddings(text);
      return { embedding, tokens };
    } catch (error) {
      console.error(error);
      return { embedding: [], tokens: 0 };
    }
  }

  async getEntityEmbeddingByEntityId(entityId: string): Promise<EntitiesEmbedding[]> {
    try {
      return this.entitiesEmbeddingRepository.findBy({ entityId });
    } catch (error) {
      console.error(error);
    }
  }

  async deleteEntityEmbedding(texts: string[], entityId: string) {
    const result = await this.entitiesEmbeddingRepository.softDelete({
      originalName: In(texts),
      entityId,
    });

    return result;
  }

  public async insertEntityEmbedding(
    entitiesEmbedding: Omit<EntitiesEmbedding, 'id' | 'deletedAt' | 'createdAt'>[],
  ): Promise<EntitiesEmbedding[]> {
    const createdAt = new Date();

    const result = await this.entitiesEmbeddingRepository.save(
      entitiesEmbedding.map((entity) => ({
        ...entity,
        deletedAt: null,
        createdAt,
      })),
    );

    return result;
  }

  public async saveEntityEmbedding(
    entitiesEmbedding: Omit<EntitiesEmbedding, 'id' | 'deletedAt' | 'createdAt'>[],
  ): Promise<void> {
    const createdAt = new Date();

    await this.entitiesEmbeddingRepository.manager.transaction(async (transactionalEntityManager) => {
      for (const entity of entitiesEmbedding) {
        await transactionalEntityManager.save(EntitiesEmbedding, {
          ...entity,
          deletedAt: null,
          createdAt,
        });
      }
    });
  }

  public async listEmbeddingsByWorkspaceId(
    integrationId: string,
    textToSearch: string,
    entitiesIds?: string[],
  ): Promise<string[]> {
    const questionEmbedding = await this.getEmbeddingFromText(textToSearch);

    const limit = 15;
    const minimalSimilarity = 0.4;
    const embedding = `${JSON.stringify(questionEmbedding.embedding)}`;

    const queryBuilder = this.entitiesEmbeddingRepository
      .createQueryBuilder('e')
      .select('DISTINCT ON (e.entity_id) e.id, e.original_name, e.entity_id')
      .addSelect('e.embedding <=> CAST(:embedding AS VECTOR)', 'similarity')
      .where('e.integration_id = :integrationId')
      .andWhere('e.deleted_at IS NULL')
      .andWhere('e.embedding <=> CAST(:embedding AS VECTOR) <= :threshold');

    if (entitiesIds?.length) {
      queryBuilder.andWhere('e.entity_id IN (:...entitiesIds)').setParameter('entitiesIds', entitiesIds);
    }

    const results = await queryBuilder
      .addOrderBy('similarity', 'ASC')
      .orderBy('e.entity_id', 'ASC')
      .limit(limit)
      .setParameters({
        embedding,
        integrationId,
        threshold: minimalSimilarity,
      })
      .execute();

    const entityIds = results.map((el) => el.entity_id);

    return entityIds;
  }
}
