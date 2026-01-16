import { Injectable, Logger } from '@nestjs/common';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { MatriListSchedulesDatailedResponse, MatrixListSchedules } from '../interfaces/patient.interface';
import { MatrixApiService } from './matrix-api.service';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import {
  LIST_SCHEDULES_TO_CONFIRM_PAST_DATE,
  LIST_SCHEDULES_TO_CONFIRM_FUTURE_DATE,
} from '../../../integration-cache-utils/cache-expirations';
import { Cron } from '@nestjs/schedule';
import { IntegrationService } from '../../../integration/integration.service';
import { IntegrationType } from '../../../interfaces/integration-types';
import { IntegrationEnvironment } from '../../../integration/interfaces/integration.interface';
import * as moment from 'moment';
import { shouldRunCron } from '../../../../common/bootstrap-options';

@Injectable()
export class MatrixListSchedulesCachedService {
  private readonly logger = new Logger(MatrixListSchedulesCachedService.name);
  private readonly dateFormat = 'YYYY-MM-DDTHH:mm:ss';
  private readonly allStatuses = ['confirmado', 'agendado'];

  constructor(
    private readonly matrixApiService: MatrixApiService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
    private readonly integrationService: IntegrationService,
  ) {}

  async listSchedules(
    integration: IntegrationDocument,
    params: MatrixListSchedules,
  ): Promise<MatriListSchedulesDatailedResponse['agendamentosDetalhados']> {
    try {
      const allSchedules: MatriListSchedulesDatailedResponse['agendamentosDetalhados'] = [];

      const startDate = moment(params.data_marcacao_inicial);
      const endDate = moment(params.data_marcacao_final);

      for (let date = startDate.clone(); date.isSameOrBefore(endDate); date.add(1, 'day')) {
        const formattedDate = date.format('YYYY-MM-DD');

        const result = await this.integrationCacheUtilsService.getListSchedulesConfirmationCache(
          integration,
          formattedDate,
          params.status,
        );

        if (result) {
          allSchedules.push(...result);
        }
      }

      return allSchedules;
    } catch (e) {
      return [];
    }
  }

  @Cron('*/20 6-20 * * *')
  async preloadCache() {
    if (!shouldRunCron()) {
      return;
    }

    const lockKey = 'matrix:preload-cache:lock';
    const lockTtl = 20 * 60;

    try {
      const lockAcquired = await this.integrationCacheUtilsService.acquireLock(lockKey, lockTtl);

      if (!lockAcquired) {
        return;
      }

      const integrations = await this.integrationService.getModel().find({
        type: IntegrationType.MATRIX,
        environment: IntegrationEnvironment.production,
        enabled: true,
      });

      const promises: Promise<void>[] = [];
      const today = moment().startOf('day');

      for (let dayOffset = -7; dayOffset <= 15; dayOffset++) {
        const day = moment().add(dayOffset, 'days');
        const isPastDate = day.isBefore(today);

        const dataInicial = day.clone().startOf('day').format(this.dateFormat);
        const dataFinal = day.clone().endOf('day').format(this.dateFormat);

        for (const integration of integrations) {
          for (const status of this.allStatuses) {
            const params: MatrixListSchedules = {
              data_marcacao_inicial: dataInicial,
              data_marcacao_final: dataFinal,
              status,
            };

            if (isPastDate) {
              promises.push(this.populateCacheIfNotExists(integration, params, isPastDate));
            } else {
              promises.push(this.populateCache(integration, params, isPastDate));
            }
          }
        }
      }

      this.logger.log(`Executando ${promises.length} operações de cache`);

      const concurrencyLimit = 10;
      const results = [];

      for (let i = 0; i < promises.length; i += concurrencyLimit) {
        const chunk = promises.slice(i, i + concurrencyLimit);
        this.logger.debug(
          `Processando chunk ${Math.floor(i / concurrencyLimit) + 1}/${Math.ceil(promises.length / concurrencyLimit)} (${chunk.length} operações)`,
        );

        const chunkResults = await Promise.allSettled(chunk);
        results.push(...chunkResults);

        if (i + concurrencyLimit < promises.length) {
          await new Promise((resolve) => setTimeout(resolve, 10_000));
        }
      }

      this.logger.log('Preload do cache Matrix concluído');
    } catch (err) {
      this.logger.error(`Erro ao buscar integrações para preload do cache: ${err.message}`);
    } finally {
      await this.integrationCacheUtilsService.releaseLock(lockKey);
    }
  }

  private async populateCacheIfNotExists(
    integration: IntegrationDocument,
    params: MatrixListSchedules,
    isPastDate: boolean,
  ) {
    try {
      const dateKey = moment(params.data_marcacao_inicial).format('YYYY-MM-DD');

      const existingCache = await this.integrationCacheUtilsService.getListSchedulesConfirmationCache(
        integration,
        dateKey,
        params.status,
      );

      if (existingCache?.length > 0) {
        return;
      }

      await this.populateCache(integration, params, isPastDate);
    } catch (err) {
      this.logger.warn(
        `Erro ao verificar/popular cache para integração ${integration._id}, dia ${moment(params.data_marcacao_inicial).format(this.dateFormat)}, params: ${JSON.stringify(params)}: ${err.message}`,
      );
    }
  }

  private async populateCache(integration: IntegrationDocument, params: MatrixListSchedules, isPastDate: boolean) {
    try {
      const result = await this.matrixApiService.listSchedules(integration, params);
      const ttl = isPastDate ? LIST_SCHEDULES_TO_CONFIRM_PAST_DATE : LIST_SCHEDULES_TO_CONFIRM_FUTURE_DATE;

      await this.integrationCacheUtilsService.setListSchedulesConfirmationCache(
        integration,
        moment(params.data_marcacao_inicial).format('YYYY-MM-DD'),
        params.status,
        result,
        ttl,
      );
    } catch (err) {
      this.logger.warn(
        `Erro ao salvar cache para integração ${integration._id}, dia ${moment(params.data_marcacao_inicial).format(this.dateFormat)}, params: ${JSON.stringify(params)}: ${err.message}`,
      );
    }
  }
}
