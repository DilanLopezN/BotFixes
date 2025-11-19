import { forwardRef, Inject, Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { EntitiesEmbeddingService } from './entities-embedding.service';
import { EntitiesService } from '../../entities/services/entities.service';
import { EntityType } from '../../interfaces/entity.interface';
import { castObjectId, castObjectIdToString } from '../../../common/helpers/cast-objectid';
import { EntitiesEmbeddingSync } from '../entities/entities-embedding-sync.entity';
import { Repository } from 'typeorm';
import { INTEGRATIONS_CONNECTION_NAME } from '../../ormconfig';
import { InjectRepository } from '@nestjs/typeorm';
import { OkResponse } from 'common/interfaces/ok-response.interface';
import { IntegratorService } from '../../integrator/service/integrator.service';
import { EntityDocument, ScheduleType } from '../../entities/schema';
import { IntegrationDocument } from '../../integration/schema/integration.schema';

@Injectable()
export class EntitiesEmbeddingBatchService {
  constructor(
    @InjectRepository(EntitiesEmbeddingSync, INTEGRATIONS_CONNECTION_NAME)
    private readonly entitiesEmbeddingSyncRepository: Repository<EntitiesEmbeddingSync>,
    private readonly entitiesEmbeddingService: EntitiesEmbeddingService,
    @Inject(forwardRef(() => EntitiesService))
    private readonly entitiesService: EntitiesService,
    @Inject(forwardRef(() => IntegratorService))
    private readonly integratorService: IntegratorService,
  ) {}

  async execute(integration: IntegrationDocument): Promise<OkResponse> {
    try {
      const appointmentType = await this.entitiesService.getModel(EntityType.appointmentType).findOne({
        integrationId: castObjectId(integration._id),
        activeErp: true,
        canView: true,
        'params.referenceScheduleType': ScheduleType.Exam,
      });

      if (!appointmentType) {
        return { ok: true, message: 'appointmentType not found' };
      }

      let validProcedures: EntityDocument[] = [];

      try {
        const response = await this.integratorService.getEntityList(castObjectIdToString(integration._id), {
          filter: { appointmentType: appointmentType?.toJSON() },
          cache: false,
          targetEntity: EntityType.procedure,
          patient: null,
        });

        validProcedures = response.data || [];
      } catch (error) {
        Sentry.captureEvent({
          message: `ERROR:INTEGRATOR:${integration._id}:getEntityList`,
          extra: {
            integrationId: integration._id,
            entityType: 'procedure',
            error: error,
          },
        });
        return { ok: true, message: 'Error getting procedures from integrator' };
      }

      if (!validProcedures?.length) {
        return { ok: true, message: 'No procedures found from integrator' };
      }

      const procedures = await this.entitiesService
        .getModel(EntityType.procedure)
        .find({
          integrationId: castObjectId(integration._id),
          activeErp: true,
          canView: true,
          code: { $in: validProcedures.map((procedure) => procedure.code) },
        })
        .select(['_id', 'name', 'synonyms']);

      if (!procedures?.length) {
        Sentry.captureEvent({
          message: `ERROR:INTEGRATOR:${integration._id}:EntitiesEmbeddingBatchService`,
          extra: {
            integrationId: integration._id,
            error: new Error('procedures empty'),
          },
        });
        return { ok: true, message: 'procedures empty' };
      }

      const batchSize = 50;
      const entitiesLog = { added: [], removed: [] };

      for (let i = 0; i < procedures.length; i += batchSize) {
        const batch = procedures.slice(i, i + batchSize);

        const entitiesEmbeddingsPromises = batch.map(async (entity) => {
          const savedEmbeddings = await this.entitiesEmbeddingService.getEntityEmbeddingByEntityId(
            entity._id.toString(),
          );

          const savedEmbeddingsSet = new Set<string>(
            savedEmbeddings.map((savedEmbedding) => savedEmbedding.originalName),
          );
          const uniqueWordsSet = new Set<string>([entity.name, ...(entity.synonyms ?? [])]);

          const textToAdd = new Set<string>();
          const textToRemove = new Set<string>();
          for (const item of uniqueWordsSet) {
            if (!savedEmbeddingsSet.has(item)) textToAdd.add(item);
          }
          for (const item of savedEmbeddingsSet) {
            if (!uniqueWordsSet.has(item)) textToRemove.add(item);
          }

          if ([...textToRemove].length) {
            entitiesLog.removed.push(entity._id.toString());
            await this.entitiesEmbeddingService.deleteEntityEmbedding([...textToRemove], entity._id.toString());
          }

          if ([...textToAdd].length) {
            entitiesLog.added.push(entity._id.toString());

            const promisesEmbeddingEntities = Array.from(textToAdd).map(async (text) => {
              const { embedding, tokens } = await this.entitiesEmbeddingService.getEmbeddingFromText(text);
              return { text, embedding, tokens };
            });

            const embeddingEntities = (await Promise.allSettled(promisesEmbeddingEntities))
              .filter((el) => el.status === 'fulfilled')
              .map((el: PromiseFulfilledResult<any>) => el.value);

            await this.entitiesEmbeddingService.saveEntityEmbedding(
              embeddingEntities.map(({ text, embedding, tokens }) => {
                return {
                  integrationId: castObjectIdToString(integration._id),
                  entityId: castObjectIdToString(entity._id),
                  originalName: text,
                  embedding: `[${embedding}]` as any,
                  totalTokens: tokens,
                };
              }),
            );

            return { embeddings: embeddingEntities, entity };
          }
        });

        const entitiesEmbeddings = (await Promise.allSettled(entitiesEmbeddingsPromises))
          .filter((entitiesEmbeddings) => entitiesEmbeddings.status === 'fulfilled')
          .map((entitiesEmbeddings: PromiseFulfilledResult<any>) => entitiesEmbeddings.value)
          .filter((entitiesEmbeddings) => entitiesEmbeddings);

        if (entitiesEmbeddings.length) {
          const totalTokens = entitiesEmbeddings
            .map((entityEmbeddings) => entityEmbeddings.embeddings)
            .flat()
            .reduce((sum, item) => sum + item.tokens, 0);

          await this.entitiesEmbeddingSyncRepository.insert({
            integrationId: castObjectIdToString(integration._id),
            syncedEntities: entitiesEmbeddings.map((entityEmbedding) =>
              castObjectIdToString(entityEmbedding.entity._id),
            ),
            totalTokens,
            createdAt: new Date(),
          });

          await this.delay(500);
        }
      }

      return { ok: true };
    } catch (error) {
      Sentry.captureEvent({
        message: `ERROR:INTEGRATOR:${integration._id}:synchronizeEntities`,
        extra: {
          integrationId: integration._id,
          error: error,
        },
      });
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
