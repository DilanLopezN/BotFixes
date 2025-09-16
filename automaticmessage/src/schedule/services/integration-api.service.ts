import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import * as moment from 'dayjs';
import { lastValueFrom } from 'rxjs';
import * as Sentry from '@sentry/node';
import { Schedule } from '../models/schedule.entity';
import { ExtractResumeType } from '../models/extract-resume.entity';
import { listSchedulesToSendMock } from './mocks/mock-integration-api';
import {
  cancelCounter,
  confirmCounter,
} from '../../miscellaneous/prom-metrics';

export interface SendSchedule {
  contact: ScheduleContactToSend;
  schedule: InformationScheduleToSend;
  actions?: any[];
}

export interface ScheduleContactToSend {
  phone: string[];
  email: string[];
  name: string;
  code: string;
}

export interface InformationScheduleToSend {
  scheduleId?: number;
  scheduleCode: string;
  scheduleDate: string;
  scheduleDateDay?: string;
  scheduleDateTimestamp?: number;
  organizationUnitAddress?: string;
  organizationUnitName?: string;
  organizationUnitCode?: string;
  procedureName?: string;
  procedureCode?: string;
  specialityName?: string;
  specialityCode?: string;
  insuranceName?: string;
  insuranceCode?: string;
  insurancePlanName?: string;
  insurancePlanCode?: string;
  doctorName?: string;
  doctorCode?: string;
  appointmentTypeName?: string;
  appointmentTypeCode?: string;
  guidance?: string;
  isFirstComeFirstServed?: boolean;
  doctorObservation?: string;
  principalScheduleCode?: string;
  isPrincipal?: boolean;
  data?: Object;
}

interface FixedErpParam {
  EXTRACT_TYPE: ExtractResumeType;
  OMIT_EXTRACT_GUIDANCE?: boolean;
}

interface ConfirmAndCancelPayload {
  scheduleId?: number;
  scheduleCode?: string;
  erpParams?: any;
}
@Injectable()
export class IntegrationApiService {
  private readonly logger = new Logger(IntegrationApiService.name);
  constructor(private readonly httpService: HttpService) {}

  async listSchedulesToSend(
    integrationId: string,
    skip: number = 0,
    startDate: moment.Dayjs,
    endDate: moment.Dayjs,
    erpParamsString?: string,
    fixedErpParams?: FixedErpParam,
    extractUuid?: string,
    buildShortLink?: boolean,
  ): Promise<SendSchedule[]> {
    try {
      // return listSchedulesToSendMock;

      let erpParams;
      try {
        erpParams =
          typeof erpParamsString == 'string'
            ? JSON.parse(erpParamsString)
            : null;
        if (fixedErpParams) {
          if (erpParams) {
            erpParams = { ...fixedErpParams, ...erpParams };
          } else {
            erpParams = fixedErpParams;
          }
        }
      } catch (e) {
        Sentry.captureEvent({
          message: `${IntegrationApiService.name}.listSchedulesToConfirm erpParams`,
          extra: {
            error: e,
            erpParamsString,
            integrationId,
          },
        });
      }
      const result = await lastValueFrom(
        this.httpService.post(
          `/integration/${integrationId}/health/confirmation/listSchedules`,
          {
            startDate: startDate.format('YYYY-MM-DD HH:mm:ss'),
            endDate: endDate.format('YYYY-MM-DD HH:mm:ss'),
            page: 1,
            maxResults: 200,
            erpParams,
            buildShortLink,
          },
          {
            headers: {
              'x-context-id': extractUuid,
            },
          },
        ),
      );
      return result.data.data;

      // return listSchedulesToSendMock;
      // return listSchedulesToSendMock2;
    } catch (e) {
      throw e;
    }
  }

  async listScheduleNotifications(
    integrationId: string,
    skip: number = 0,
    startDate: moment.Dayjs,
    erpParamsString?: string,
    fixedErpParams?: FixedErpParam,
  ): Promise<SendSchedule[]> {
    try {
      let erpParams;
      try {
        erpParams =
          typeof erpParamsString == 'string'
            ? JSON.parse(erpParamsString)
            : null;
        if (fixedErpParams) {
          if (erpParams) {
            erpParams = { ...fixedErpParams, ...erpParams };
          } else {
            erpParams = fixedErpParams;
          }
        }
      } catch (e) {
        Sentry.captureEvent({
          message: `${IntegrationApiService.name}.listScheduleNotifications erpParams`,
          extra: {
            error: e,
            erpParamsString,
            integrationId,
          },
        });
      }
      const result = await lastValueFrom(
        this.httpService.post(
          `/integration/${integrationId}/health/schedule-notification/listScheduleNotifications`,
          {
            startDate: startDate.format('YYYY-MM-DD HH:mm:ss'),
            endDate: moment(startDate).endOf('day').format('YYYY-MM-DD HH:mm:ss'),
            page: 1,
            maxResults: 200,
            erpParams,
          },
        ),
      );
      return result.data.data;
    } catch (e) {
      throw e;
    }
  }

  async confirmAppointment(
    integrationId: string,
    schedule: Schedule,
    erpParamsString: string,
    conversationId: string,
    workspaceId: string,
  ) {
    try {
      let erpParams = {};
      try {
        erpParams =
          typeof erpParamsString == 'string' ? JSON.parse(erpParamsString) : {};
      } catch (e) {
        Sentry.captureEvent({
          message: `${IntegrationApiService.name}.confirmAppointment erpParams`,
          extra: {
            error: e,
            erpParamsString,
            integrationId,
            schedule,
          },
        });
      }
      try {
        if (!erpParams) erpParams = {};
        erpParams['SCHEDULE'] = schedule;
      } catch (e) {
        Sentry.captureEvent({
          message: `${IntegrationApiService.name}.confirmAppointment set erpParams SCHEDULE`,
          extra: {
            error: e,
            erpParamsString,
          },
        });
      }
      let body: ConfirmAndCancelPayload = {
        scheduleCode: schedule.scheduleCode,
        erpParams,
      };
      if (schedule.scheduleId) {
        body = {
          scheduleId: Number(schedule.scheduleId),
          erpParams,
        };
      }
      const result = await lastValueFrom(
        this.httpService.post(
          `/integration/${integrationId}/health/confirmation/confirmSchedule`,
          body,
          {
            headers: {
              'x-conversation-id': conversationId,
              'x-workspace-id': workspaceId,
              'x-member-id': schedule.patientPhone,
            },
          },
        ),
      );
      confirmCounter.labels(integrationId).inc();
      return result.data;
    } catch (e) {
      if (e?.response?.status == 409) {
        return;
      }
      Sentry.captureEvent({
        message: `${IntegrationApiService.name}.confirmAppointment`,
        extra: {
          integrationId,
          scheduleCode: schedule.scheduleCode,
          scheduleId: schedule.scheduleId,
          schedule,
          error: e,
        },
      });
    }
  }

  async cancelAppointment(
    integrationId: string,
    schedule: Schedule,
    erpParamsString: string,
    conversationId: string,
    workspaceId: string,
  ) {
    try {
      let erpParams = {};
      try {
        erpParams =
          typeof erpParamsString == 'string' ? JSON.parse(erpParamsString) : {};
      } catch (e) {
        Sentry.captureEvent({
          message: `${IntegrationApiService.name}.cancelAppointment erpParams`,
          extra: {
            error: e,
            erpParamsString,
            integrationId,
            schedule,
          },
        });
      }
      try {
        if (!erpParams) erpParams = {};
        erpParams['SCHEDULE'] = schedule;
      } catch (e) {
        Sentry.captureEvent({
          message: `${IntegrationApiService.name}.cancelAppointment set erpParams SCHEDULE`,
          extra: {
            error: e,
            erpParamsString,
          },
        });
      }
      let body: ConfirmAndCancelPayload = {
        scheduleCode: schedule.scheduleCode,
        erpParams,
      };
      if (schedule.scheduleId) {
        body = {
          scheduleId: Number(schedule.scheduleId),
          erpParams,
        };
      }
      const result = await lastValueFrom(
        this.httpService.post(
          `/integration/${integrationId}/health/confirmation/cancelSchedule`,
          body,
          {
            headers: {
              'x-conversation-id': conversationId,
              'x-workspace-id': workspaceId,
              'x-member-id': schedule.patientPhone,
            },
          },
        ),
      );
      cancelCounter.labels(integrationId).inc();
      return result.data;
    } catch (e) {
      if (e?.response?.status == 409) {
        return;
      }
      Sentry.captureEvent({
        message: `${IntegrationApiService.name}.cancelAppointment`,
        extra: {
          error: e,
          integrationId,
          scheduleCode: schedule.scheduleCode,
          scheduleId: schedule.scheduleId,
          schedule,
        },
      });
    }
  }

  async validateScheduleData(
    integrationId: string,
    schedule: Schedule,
    erpParamsString: string,
    conversationId: string,
    workspaceId: string,
  ) {
    try {
      let erpParams = {};
      try {
        erpParams =
          typeof erpParamsString == 'string' ? JSON.parse(erpParamsString) : {};
      } catch (e) {
        Sentry.captureEvent({
          message: `${IntegrationApiService.name}.validateScheduleData erpParams`,
          extra: {
            error: e,
            erpParamsString,
            integrationId,
            schedule,
          },
        });
      }
      try {
        if (!erpParams) erpParams = {};
        erpParams['SCHEDULE'] = schedule;
      } catch (e) {
        Sentry.captureEvent({
          message: `${IntegrationApiService.name}.validateScheduleData set erpParams SCHEDULE`,
          extra: {
            error: e,
            erpParamsString,
          },
        });
      }
      const result = await lastValueFrom(
        this.httpService.post(
          `/integration/${integrationId}/health/confirmation/validateScheduleData`,
          {
            scheduleId: Number(schedule.scheduleId),
            erpParams,
          },
          {
            headers: {
              'x-conversation-id': conversationId,
              'x-workspace-id': workspaceId,
              'x-member-id': schedule.patientPhone,
            },
          },
        ),
      );
      return result.data;
    } catch (e) {
      if (e?.response?.status == 409) {
        return;
      }
      Sentry.captureEvent({
        message: `${IntegrationApiService.name}.validateScheduleData`,
        extra: {
          integrationId,
          scheduleCode: schedule.scheduleCode,
          scheduleId: schedule.scheduleId,
          schedule,
          error: e,
        },
      });
    }
  }
}
