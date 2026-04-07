import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger, HttpException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BotdesignerPublicTransaction,
  BotdesignerPublicTransactionStatus,
} from '../entities/botdesigner-public-transaction.entity';
import { BotdesignerApiService } from '../../services/botdesigner-api.service';
import { IntegrationService } from '../../../../integration/integration.service';
import { getQueueName } from '../../../../../common/queue-name';
import { INTEGRATIONS_CONNECTION_NAME } from '../../../../ormconfig';
import { ListAvailableSchedulesFilters, CreateSchedule } from 'kissbot-health-core';
import { IGravarAgendamento } from '../interfaces/gravar-agendamento.interface';

export interface PublicScheduleQueueMessage {
  requestId: string;
  integrationId: string;
  originalPayload: IGravarAgendamento;
}

interface TryCreateScheduleResult {
  appointment: any;
  selectedSchedule: any;
  scheduleToCreate: CreateSchedule;
}

@Injectable()
export class PublicScheduleConsumerService {
  private readonly logger = new Logger(PublicScheduleConsumerService.name);

  constructor(
    @InjectRepository(BotdesignerPublicTransaction, INTEGRATIONS_CONNECTION_NAME)
    private readonly publicTransactionRepository: Repository<BotdesignerPublicTransaction>,
    private readonly moduleRef: ModuleRef,
    private readonly integrationService: IntegrationService,
  ) {}

  @RabbitSubscribe({
    exchange: process.env.EVENT_EXCHANGE_NAME,
    routingKey: 'public.schedule.create',
    queue: getQueueName('public-schedule'),
    queueOptions: {
      durable: true,
      arguments: {
        'x-single-active-consumer': true,
      },
      channel: PublicScheduleConsumerService.name,
    },
  })
  async processScheduleCreation(message: PublicScheduleQueueMessage): Promise<void> {
    const { requestId, integrationId, originalPayload } = message;

    let filters: ListAvailableSchedulesFilters;

    try {
      await this.updateTransactionStatus(requestId, BotdesignerPublicTransactionStatus.PROCESSING);

      const integration = await this.integrationService.getOne(integrationId);

      if (!integration || !integration.enabled) {
        throw new Error('Integration not found or disabled');
      }

      const botdesignerApiService = this.moduleRef.get<BotdesignerApiService>(BotdesignerApiService, { strict: false });

      filters = {
        params: {
          startDate: originalPayload.dataAgendamentoInicial,
          endDate: originalPayload.dataAgendamentoFinal,
          startHour: '00:00',
          endHour: '23:59',
          insuranceCode: originalPayload.codigoConvenio,
          insurancePlanCode: originalPayload.codigoConvenioPlano,
          insuranceCategoryCode: originalPayload.codigoConvenioCategoria,
          organizationUnitCode: originalPayload.codigoUnidade ? [originalPayload.codigoUnidade] : undefined,
          doctorCode: originalPayload.codigoMedico ? [originalPayload.codigoMedico] : undefined,
          specialityCode: originalPayload.codigoEspecialidade,
          procedureCode: originalPayload.codigoProcedimento,
          appointmentTypeCode: originalPayload.codigoTipoAgendamento,
          patientCode: originalPayload.pacienteCodigo,
          patientAge: originalPayload.pacienteIdade ? Number(originalPayload.pacienteIdade) : undefined,
          patientSex: originalPayload.pacienteGenero,
          patientWeight: originalPayload.pacientePeso,
          patientHeight: originalPayload.pacienteAltura,
          generalLimit: 3,
          perDayLimit: 1,
          extra: { codigoAgenda: originalPayload.codigoAgenda || null },
        },
        limit: 3,
      };

      const availableSchedules = await botdesignerApiService.listAvailableSchedules(integration, filters);

      if (availableSchedules?.length === 0) {
        // Marcar como completed mas sem horário disponível - não é um erro
        await this.publicTransactionRepository.update(
          { requestId },
          {
            status: BotdesignerPublicTransactionStatus.COMPLETED,
            outputPayload: { codigoAgendamento: null } as any,
            data: {
              message: 'Nenhum horário disponível encontrado para os filtros informados',
              hasSchedule: false,
            } as any,
            extra: {
              message: 'Nenhum horário disponível encontrado para os filtros informados',
              filters: filters,
              originalMessage: message,
            } as any,
          },
        );

        this.logger.log(`No available schedules found for requestId: ${requestId}`);
        return;
      }

      const MAX_RETRY_ATTEMPTS = 3;
      const INITIAL_SCHEDULE_INDEX = 0;
      const INITIAL_ATTEMPT = 1;

      const tryCreateSchedule = async (scheduleIndex: number, attempt: number): Promise<TryCreateScheduleResult> => {
        if (attempt > MAX_RETRY_ATTEMPTS) {
          throw new Error(`Maximum retry attempts reached (${MAX_RETRY_ATTEMPTS} attempts)`);
        }

        if (scheduleIndex >= availableSchedules.length) {
          throw new Error('No more available schedules to try');
        }

        const selectedSchedule = availableSchedules[scheduleIndex];

        const scheduleToCreate: CreateSchedule = {
          data: {
            scheduleCode: selectedSchedule.scheduleCode ? String(selectedSchedule.scheduleCode) : null,
            scheduleDate: selectedSchedule.scheduleDate ? String(selectedSchedule.scheduleDate) : null,
            duration: 0,
            organizationUnitCode: selectedSchedule.organizationUnitCode
              ? String(selectedSchedule.organizationUnitCode)
              : null,
            doctorCode: selectedSchedule.doctorCode ? String(selectedSchedule.doctorCode) : null,
            insuranceCode: selectedSchedule.insuranceCode ? String(selectedSchedule.insuranceCode) : null,
            insurancePlanCode: originalPayload.codigoConvenioPlano ? String(originalPayload.codigoConvenioPlano) : null,
            insuranceSubPlanCode: null,
            insuranceCategoryCode: originalPayload.codigoConvenioCategoria
              ? String(originalPayload.codigoConvenioCategoria)
              : null,
            appointmentTypeCode: originalPayload.codigoTipoAgendamento || null,
            specialityCode: selectedSchedule.specialityCode ? String(selectedSchedule.specialityCode) : null,
            procedureCode: selectedSchedule.procedureCode ? String(selectedSchedule.procedureCode) : null,
            classificationCode: selectedSchedule.classificationCode
              ? String(selectedSchedule.classificationCode)
              : null,
            typeOfServiceCode: selectedSchedule.typeOfServiceCode ? String(selectedSchedule.typeOfServiceCode) : null,
            occupationAreaCode: selectedSchedule.occupationAreaCode
              ? String(selectedSchedule.occupationAreaCode)
              : null,
            patientCode: originalPayload.pacienteCodigo ? String(originalPayload.pacienteCodigo) : null,
            patientInsuranceNumber: null,
            patientHeight: originalPayload.pacienteAltura || null,
            patientWeight: originalPayload.pacientePeso || null,
            data: null,
          },
        };

        try {
          const appointment = await botdesignerApiService.createSchedule(integration, scheduleToCreate);

          if (!appointment || !appointment.scheduleCode) {
            const nextScheduleIndex = scheduleIndex + 1;
            const nextAttempt = attempt + 1;
            return tryCreateSchedule(nextScheduleIndex, nextAttempt);
          }

          return { appointment, selectedSchedule, scheduleToCreate };
        } catch (error) {
          const isScheduleConflict =
            (error instanceof HttpException && error.getStatus() === 409) ||
            error?.response?.status === 409 ||
            error?.status === 409;

          if (isScheduleConflict) {
            const nextScheduleIndex = scheduleIndex + 1;
            const nextAttempt = attempt + 1;
            return tryCreateSchedule(nextScheduleIndex, nextAttempt);
          }

          throw error;
        }
      };

      const { appointment, selectedSchedule, scheduleToCreate } = await tryCreateSchedule(
        INITIAL_SCHEDULE_INDEX,
        INITIAL_ATTEMPT,
      );

      const outputPayload = {
        codigoAgendamento: appointment?.scheduleCode || null,
      };

      const extra = {
        codigoAgendamento: appointment?.scheduleCode || null,
        appointmentData: appointment,
        selectedSchedule,
        scheduleToCreate,
        filters,
        originalMessage: message,
      };

      await this.publicTransactionRepository.update(
        { requestId },
        {
          status: BotdesignerPublicTransactionStatus.COMPLETED,
          outputPayload: outputPayload as any,
          extra: extra as any,
          data: {
            codigoAgendamento: appointment?.scheduleCode || null,
          } as any,
        },
      );
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      this.logger.error(`Error processing schedule creation for requestId: ${requestId}`, error.stack);

      await this.publicTransactionRepository.update(
        { requestId },
        {
          status: BotdesignerPublicTransactionStatus.FAILED,
          errorMessage: errorMessage,
          extra: {
            error: errorMessage,
            originalError: error.message,
            stack: error.stack,
            filters,
            originalMessage: message,
          } as any,
        },
      );
    }
  }

  private async updateTransactionStatus(requestId: string, status: BotdesignerPublicTransactionStatus): Promise<void> {
    await this.publicTransactionRepository.update(
      { requestId },
      {
        status,
      },
    );
  }

  private extractErrorMessage(error: any): string {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      if (typeof response === 'object' && response !== null) {
        return JSON.stringify(response);
      }
      return String(response);
    }
    return error?.message || String(error);
  }
}
