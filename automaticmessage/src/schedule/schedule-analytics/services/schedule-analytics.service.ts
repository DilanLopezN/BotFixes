import { Injectable } from '@nestjs/common';
import { ScheduleMessageResponseType } from '../../models/schedule-message.entity';
import {
  ResultNpsScheduleAnalytics,
  ResultScheduleAnalytics,
  ResultScheduleCancelReasonAnalytics,
  ScheduleAnalyticsFilters,
} from '../interfaces/schedule-analytics-filters';
import { ScheduleMessageService } from '../../services/schedule-message/schedule-message.service';
import { ExtractResumeType } from '../../models/extract-resume.entity';
import { CancelReason } from '../../models/cancel-reason.entity';
import { ScheduleFilterListData } from '../../interfaces/schedule-filter-list-data.interface';
import { ScheduleService } from '../../services/schedule/schedule.service';
import * as moment from 'dayjs';

@Injectable()
export class ScheduleAnalyticsService {
  constructor(
    private readonly scheduleMessageService: ScheduleMessageService,
    private readonly scheduleService: ScheduleService,
  ) {}

  private formatResultAnalytics(
    type: ExtractResumeType,
    queryResult: any[],
  ) {
    let baseResult = {
      invalidNumber: 0,
      notAnswered: 0,
      open_cvs: 0,
      no_recipient: 0,
      invalid_recipient: 0,
      total: 0,
    };

    let result: any = { ...baseResult };

    switch (type) {
      case ExtractResumeType.confirmation:
        result = {
          ...baseResult,
          confirmed: 0,
          canceled: 0,
          individual_cancel: 0,
          reschedule: 0,
        };
        break;
      case ExtractResumeType.recover_lost_schedule:
        result = {
          ...baseResult,
          start_reschedule_recover: 0,
          cancel_reschedule_recover: 0,
          confirm_reschedule_recover: 0,
        };
        break;
      default:
        // Outros tipos só têm o baseResult mesmo
        break;
    }

    result.total = queryResult.reduce((prev, curr) => {
      return Number(prev) + Number(curr?.count || 0);
    }, 0);
    result.invalidNumber = Number(
      queryResult.find(
        (currResult) =>
          currResult.response_type ===
          ScheduleMessageResponseType.invalid_number,
      )?.count || 0,
    );
    result.notAnswered = Number(
      queryResult.find(
        (currResult) => currResult.response_type === 'not_answered',
      )?.count || 0,
    );
    result.open_cvs = Number(
      queryResult.find(
        (currResult) =>
          currResult.response_type === ScheduleMessageResponseType.open_cvs,
      )?.count || 0,
    );
    result.no_recipient = Number(
      queryResult.find(
        (currResult) =>
          currResult.response_type === ScheduleMessageResponseType.no_recipient,
      )?.count || 0,
    );
    result.invalid_recipient = Number(
      queryResult.find(
        (currResult) =>
          currResult.response_type ===
          ScheduleMessageResponseType.invalid_recipient,
      )?.count || 0,
    );

    switch (type) {
      case ExtractResumeType.confirmation:
        result.confirmed = Number(
          queryResult.find(
            (currResult) =>
              currResult.response_type ===
              ScheduleMessageResponseType.confirmed,
          )?.count || 0,
        );
        result.canceled = Number(
          queryResult.find(
            (currResult) =>
              currResult.response_type === ScheduleMessageResponseType.canceled,
          )?.count || 0,
        );
        result.individual_cancel = Number(
          queryResult.find(
            (currResult) =>
              currResult.response_type ===
              ScheduleMessageResponseType.individual_cancel,
          )?.count || 0,
        );
        result.reschedule = Number(
          queryResult.find(
            (currResult) =>
              currResult.response_type ===
              ScheduleMessageResponseType.reschedule,
          )?.count || 0,
        );
        break;
      case ExtractResumeType.recover_lost_schedule:
        result.start_reschedule_recover = Number(
          queryResult.find(
            (currResult) =>
              currResult.response_type ===
              ScheduleMessageResponseType.start_reschedule_recover,
          )?.count || 0,
        );
        result.cancel_reschedule_recover = Number(
          queryResult.find(
            (currResult) =>
              currResult.response_type ===
              ScheduleMessageResponseType.cancel_reschedule_recover,
          )?.count || 0,
        );
        result.confirm_reschedule_recover = Number(
          queryResult.find(
            (currResult) =>
              currResult.response_type ===
              ScheduleMessageResponseType.confirm_reschedule_recover,
          )?.count || 0,
        );
        break;
    }

    return result;
  }

  public async getAllScheduleMetrics(
    filters: ScheduleAnalyticsFilters,
  ): Promise<
    ResultScheduleAnalytics | ResultScheduleAnalytics[ExtractResumeType]
  > {
    let result:
      | ResultScheduleAnalytics
      | ResultScheduleAnalytics[ExtractResumeType] = {};
    let queryResult: any = [];

    if (filters.type) {
      queryResult = await this.getScheduleMetrics(filters);
      result[filters.type] = this.formatResultAnalytics(
        filters.type,
        queryResult,
      );
    } else {
      // Quando não há um tipo específico, realiza as consultas para todos os tipos possíveis.
      const promises = Object.values(ExtractResumeType).map(
        async (sendType) => {
          const queryResult = (await this.getScheduleMetrics({
            ...filters,
            type: sendType,
          })) as any;
          return { sendType, queryResult };
        },
      );

      const results = await Promise.all(promises);

      // Formata os resultados após a execução de todas as promises
      results.forEach(({ sendType, queryResult }) => {
        result[sendType] = this.formatResultAnalytics(sendType, queryResult);
      });
    }
    return result;
  }

  public async getScheduleMetrics(
    filters: ScheduleAnalyticsFilters,
  ): Promise<
    ResultScheduleAnalytics | ResultScheduleAnalytics[ExtractResumeType]
  > {
    let query = this.scheduleMessageService.getQuery({
      ...filters,
    });

    query = query
      .groupBy('schMsg.response_type')
      .select([
        'count(*)',
        `COALESCE(schMsg.response_type, 'not_answered') as response_type`,
      ]);

    return await query.execute();
  }

  public async getScheduleMetricsCancelReason(
    filters: ScheduleAnalyticsFilters,
  ): Promise<ResultScheduleCancelReasonAnalytics[]> {
    let query = this.scheduleMessageService.getQuery({
      ...filters,
      type: ExtractResumeType.confirmation,
    });

    query = query
      .andWhere(`schMsg.response_type = :scheduleMessageResponseType`, {
        scheduleMessageResponseType: ScheduleMessageResponseType.canceled,
      })
      .leftJoinAndMapOne(
        'schMsg.cancelReason',
        CancelReason,
        'reason',
        `reason.id = schMsg.reason_id`,
      )
      .groupBy('reason.reason_name')
      .select([
        'count(*)',
        `COALESCE(reason.reason_name, 'Não respondido') as "reasonName"`,
      ]);
    const result: ResultScheduleCancelReasonAnalytics[] = await query.execute();
    return result.map((r) => {
      return {
        ...r,
        count: Number(r.count),
      };
    });
  }

  async listSchedulesCsv(filter: ScheduleFilterListData): Promise<any[]> {
    const { data } = await this.scheduleService.listSchedules(
      { skip: 0, limit: 0 },
      filter,
    );

    const scheduleMessageResponseTypeTranslation = {
      confirmed: 'Confirmado',
      canceled: 'Cancelado',
      individual_cancel: 'Cancelamento individual',
      reschedule: 'Reagendado',
      invalid_number: 'Número inválido',
      open_cvs: 'Possui atendimento em aberto',
      no_recipient: 'Sem dados para contato',
      invalid_recipient: 'Dado de contato inválido',
    };

    const extractResumeTypeTranslation = {
      confirmation: 'Confirmação',
      reminder: 'Lembrete',
      nps: 'Link de Pesquisa de satisfação',
      medical_report: 'Relatório médico',
      schedule_notification: 'Notificação de agendamento realizado',
      recover_lost_schedule: 'Resgate de agendamentos perdidos',
      nps_rating: 'NPS',
      documents_request: 'Solicitação de documentos',
      active_mkt: 'Disparos dinâmicos de Marketing',
    };

    const dataFormated: any = data?.map((scheduleItem) => {
      return {
        ID: scheduleItem.scheduleCode,
        'Cód. Paciente': scheduleItem.patientCode,
        Paciente: scheduleItem.patientName,
        Médico: scheduleItem.doctorName,
        Agendamento: moment(scheduleItem.scheduleDate).toISOString(),
        Status:
          scheduleMessageResponseTypeTranslation[scheduleItem.status] ??
          'Enviado',
        Tipo: extractResumeTypeTranslation[scheduleItem.sendType] ?? '',
        Procedimento: scheduleItem.procedureName,
        'Tipo de Agendamento': scheduleItem.appointmentTypeName,
        Unidade: scheduleItem.organizationUnitName,
        'Mot. Cancelamento': scheduleItem.cancelReason,
        'Nota do NPS': scheduleItem.npsScore,
        Feedback: scheduleItem.feedback,
      };
    });

    return dataFormated;
  }

  public async getScheduleMetricsNpsSchedule(
    filters: ScheduleAnalyticsFilters,
  ): Promise<ResultNpsScheduleAnalytics[]> {
    let query = this.scheduleMessageService.getQuery({
      ...filters,
      type: ExtractResumeType.nps_score,
    });

    query = query
      .andWhere('schMsg.nps_score IS NOT NULL')
      .groupBy('schMsg.nps_score')
      .select(['count(*)', 'nps_score']);
    const result: any[] = await query.execute();
    return result.map((r) => {
      return {
        ...r,
        count: Number(r.count),
      };
    });
  }
}
