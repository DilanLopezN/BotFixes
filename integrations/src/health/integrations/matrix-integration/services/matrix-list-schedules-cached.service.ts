import { Injectable, Logger } from '@nestjs/common';
import { Integration, IntegrationDocument } from '../../../integration/schema/integration.schema';
import { MatriListSchedulesDatailedResponse, MatrixListSchedules } from '../interfaces/patient.interface';
import { MatrixApiService } from './matrix-api.service';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IntegrationService } from '../../../integration/integration.service';
import { IntegrationType } from '../../../interfaces/integration-types';
import { IntegrationEnvironment } from '../../../integration/interfaces/integration.interface';
import * as moment from 'moment';
import { shouldRunCron } from '../../../../common/bootstrap-options';

@Injectable()
export class MatrixListSchedulesCachedService {
  private readonly logger = new Logger(MatrixListSchedulesCachedService.name);
  private readonly dateFormat = 'YYYY-MM-DDTHH:mm:ss';
  private readonly statuses = ['cancelado', 'confirmado', 'agendado'];

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

  @Cron('0 */5 * * * *')
  private async preloadCache() {
    if (!shouldRunCron()) {
      return;
    }
    this.logger.log('Executando cron de preload do cache dos agendamentos de 15 dias para trás e 15 dias para frente');
    try {
      const integrations = await this.integrationService.getModel().find({
        type: IntegrationType.MATRIX,
        environment: IntegrationEnvironment.production,
      });

      const promises: Promise<void>[] = [];

      for (let dayOffset = -15; dayOffset <= 15; dayOffset++) {
        const day = moment().add(dayOffset, 'days');
        const dataInicial = day.clone().startOf('day').format(this.dateFormat);
        const dataFinal = day.clone().endOf('day').format(this.dateFormat);

        for (const integration of integrations) {
          for (const status of this.statuses) {
            const params: MatrixListSchedules = {
              data_marcacao_inicial: dataInicial,
              data_marcacao_final: dataFinal,
              status,
            };
            this.logger.log(`Iniciando Preload Integração: ${integration.name}, params: ${JSON.stringify(params)}`);
            promises.push(this.populateCache(integration, params));
          }
        }
      }

      const results = await Promise.allSettled(promises);

      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failCount = results.length - successCount;

      this.logger.log(`Preload finalizado: ${successCount} sucesso(s), ${failCount} falha(s)`);
    } catch (err) {
      this.logger.error(`Erro ao buscar integrações para preload do cache: ${err.message}`);
    }
  }
  private async populateCache(integration: IntegrationDocument, params: MatrixListSchedules) {
    try {
      this.logger.log(`Iniciando populateCache Integração: ${integration.name}, params: ${JSON.stringify(params)}`);
      const result = await this.matrixApiService.listSchedules(integration, params);
      await this.integrationCacheUtilsService.setListSchedulesConfirmationCache(
        integration,
        moment(params.data_marcacao_inicial).format('YYYY-MM-DD'),
        params.status,
        result,
      );
      this.logger.log(`populateCache finalizado Integração: ${integration.name}, params: ${JSON.stringify(params)}`);
    } catch (err) {
      this.logger.warn(
        `Erro ao salvar cache para integração ${integration._id}, dia ${moment(params.data_marcacao_inicial).format(this.dateFormat)}, params: ${JSON.stringify(params)}: ${err.message}`,
      );
    }
  }
}
