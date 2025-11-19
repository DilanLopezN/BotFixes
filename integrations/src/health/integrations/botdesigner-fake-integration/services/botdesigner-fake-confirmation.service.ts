import { Injectable } from '@nestjs/common';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { BotdesignerFakeApiService } from './botdesigner-fake-api.service';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import {
  MatchFlowsConfirmation,
  ConfirmationScheduleGuidance,
  ConfirmationScheduleGuidanceResponse,
  ListSchedulesToConfirmV2,
  CancelScheduleV2,
  ConfirmScheduleV2,
} from '../../../integrator/interfaces';
import {
  ConfirmationSchedule,
  ConfirmationScheduleDataV2,
  ConfirmationScheduleSchedule,
} from '../../../interfaces/confirmation-schedule.interface';
import { FlowAction, FlowActionElement, FlowSteps } from '../../../flow/interfaces/flow.interface';
import { ExtractedSchedule } from '../../../schedules/interfaces/extracted-schedule.interface';
import { SchedulesService } from '../../../schedules/schedules.service';
import { INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';
import * as moment from 'moment';
import { FlowService } from '../../../flow/service/flow.service';
import { CorrelationFilterByKeys } from '../../../interfaces/correlation-filter.interface';
import { EntityType } from '../../../interfaces/entity.interface';
import { EntityDocument } from '../../../entities/schema';
import { EntitiesService } from '../../../entities/services/entities.service';

@Injectable()
export class BotdesignerFakeConfirmationService {
  constructor(
    private readonly botdesignerFakeApiService: BotdesignerFakeApiService,
    private schedulesService: SchedulesService,
    private flowService: FlowService,
    private entitiesService: EntitiesService,
  ) {}

  public async matchFlowsConfirmation(
    integration: IntegrationDocument,
    data: MatchFlowsConfirmation,
  ): Promise<FlowAction<FlowActionElement>[]> {
    try {
      return await this.schedulesService.matchFlowsConfirmation(castObjectIdToString(integration._id), data);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerFakeConfirmationService.matchFlowsConfirmation', error);
    }
  }

  async getScheduleGuidance(
    integration: IntegrationDocument,
    data: ConfirmationScheduleGuidance,
  ): Promise<ConfirmationScheduleGuidanceResponse> {
    const { scheduleCodes = [], scheduleIds = [] } = data;

    const specialtyGuidances = {
      '1': {
        guidance:
          'Lembre-se de trazer seus últimos exames cardiológicos e medicamentos em uso. Evite exercícios físicos intensos 24h antes da consulta.',
      },
      '2': {
        guidance:
          'Evite o uso de maquiagem, cremes ou produtos na pele no dia da consulta. Traga a lista de produtos que usa regularmente.',
      },
      '3': {
        guidance:
          'Traga todos os exames neurológicos anteriores e lista completa de medicamentos. Relate sintomas detalhadamente.',
      },
      '4': {
        guidance:
          'Traga a carteira de vacinação da criança e histórico de alergias. Para bebês, traga fraldas e mamadeira.',
      },
      '5': {
        guidance: 'Evite relações sexuais 24h antes do exame. Traga absorvente para possível sangramento pós-exame.',
      },
      '6': {
        guidance:
          'Traga exames de imagem recentes (Raio-X, Ressonância). Use roupas confortáveis para facilitar movimentação.',
      },
      '7': {
        guidance: 'Não use lentes de contato no dia do exame. Traga óculos de sol para o pós-consulta.',
      },
    };

    const schedules = await this.schedulesService.getGuidanceByScheduleCodes(integration, scheduleCodes, scheduleIds);

    return schedules?.map((schedule) => ({
      ...schedule,
      guidance: specialtyGuidances[schedule.specialityCode] || '',
    }));
  }

  async listSchedulesToConfirm(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2,
  ): Promise<ConfirmationSchedule> {
    try {
      const debugLimit = data.erpParams?.debugLimit;
      const debugPhone = data.erpParams?.debugPhoneNumber;
      const debugEmail = data.erpParams?.debugEmail;

      const { extractStartedAt, extractEndedAt, schedules } = await this.schedulesService.buildExtraction(
        integration,
        data,
        this.listSchedulesToActiveSending.bind(this),
      );

      const result: ConfirmationSchedule = {
        data: [],
        ommitedData: [],
        metadata: {
          extractedCount: schedules.length ?? 0,
          extractStartedAt,
          extractEndedAt,
        },
      };

      if (!schedules.length) {
        return result;
      }

      const correlationsKeys: { [key: string]: Set<string> } = {};

      for (const schedule of schedules) {
        const scheduleMap = this.schedulesService.formatScheduleToEntityMap(schedule);

        Object.keys(scheduleMap).forEach((entityType) => {
          const entityCode = scheduleMap[entityType];

          if (entityCode) {
            if (!correlationsKeys[entityType]) {
              correlationsKeys[entityType] = new Set();
            }

            correlationsKeys[entityType].add(entityCode);
          }
        });
      }

      const correlationsKeysData: CorrelationFilterByKeys = Object.keys(EntityType).reduce((acc, key) => {
        if (correlationsKeys[key]?.size) {
          acc[key] = Array.from(correlationsKeys[key]);
        }
        return acc;
      }, {});

      // cria um objeto em memória com as entidades encontradas em todos os agendamentos
      // para não ir no mongo consultar diversas vezes o mesmo registro
      const correlationData: { [entityType: string]: { [entityCode: string]: EntityDocument } } =
        await this.entitiesService.createCorrelationDataKeys(correlationsKeysData, integration._id);

      for await (const schedule of schedules) {
        const scheduleCorrelation: { [entityType: string]: EntityDocument } = {};
        const scheduleMap = this.schedulesService.formatScheduleToEntityMap(schedule);

        Object.keys(scheduleMap).forEach((entityType) => {
          const entityCode = scheduleMap[entityType];
          scheduleCorrelation[entityType] = correlationData[entityType]?.[entityCode];
        });

        // valida através das entidades se pode confirmar `canConfirmActive`
        // se não encontrar a entidade considera true
        const canConfirmActive = Object.values(scheduleCorrelation)
          .filter((entity) => !!entity)
          .every((entity) => entity.canConfirmActive);

        const { organizationUnit, procedure, appointmentType, doctor, speciality, insurance, insurancePlan } =
          scheduleCorrelation;
        const dateFormat = 'YYYY-MM-DDTHH:mm:ss';

        const scheduleObject: ConfirmationScheduleSchedule = {
          scheduleId: schedule.id,
          scheduleCode: schedule.scheduleCode,
          scheduleDate: moment(schedule.scheduleDate).format(dateFormat),
          organizationUnitAddress:
            schedule?.organizationUnitAddress || (organizationUnit?.data as any)?.address || null,
          organizationUnitName: organizationUnit?.friendlyName || schedule.organizationUnitName,
          procedureName: procedure?.friendlyName || schedule.procedureName?.trim(),
          specialityName: speciality?.friendlyName || schedule.specialityName?.trim(),
          doctorName: doctor?.name || schedule.doctorName?.trim(),
          doctorObservation: (doctor?.data as any)?.observation || null,
          principalScheduleCode: schedule.principalScheduleCode,
          isPrincipal: schedule.isPrincipal,
          appointmentTypeName: appointmentType?.friendlyName || schedule.appointmentTypeName,
          guidance: schedule.guidance,
          observation: schedule.observation,
          isFirstComeFirstServed: schedule.isFirstComeFirstServed,
          appointmentTypeCode: schedule.appointmentTypeCode,
          insuranceCode: insurance?.code || schedule?.insuranceCode,
          insuranceName: insurance?.name || schedule?.insuranceName,
          insurancePlanName: insurancePlan?.name || schedule?.insurancePlanName,
          insurancePlanCode: insurancePlan?.code || schedule?.insurancePlanCode,
          doctorCode: doctor?.code || schedule.doctorCode,
          organizationUnitCode: organizationUnit?.code || schedule?.organizationUnitCode,
          procedureCode: procedure?.code || schedule?.procedureCode,
          specialityCode: speciality?.code || schedule?.specialityCode,
          data: schedule.data,
        };

        const { patientName, patientCode, patientPhone1, patientPhone2, patientEmail1, patientEmail2 } = schedule;
        const confirmationSchedule: ConfirmationScheduleDataV2 = {
          contact: {
            phone: [],
            email: [],
            name: patientName?.trim(),
            code: patientCode,
          },
          schedule: scheduleObject,
          actions: [],
        };

        if (debugPhone) {
          confirmationSchedule.contact.phone.push(String(debugPhone).trim());
        } else {
          [patientPhone1, patientPhone2]
            .filter((phone) => !!phone)
            .forEach((phone) => {
              confirmationSchedule.contact.phone.push(String(phone).trim());
            });
        }

        if (debugEmail) {
          confirmationSchedule.contact.email.push(String(debugEmail).trim());
        } else {
          [patientEmail1, patientEmail2]
            .filter((email) => !!email)
            .forEach((email) => {
              confirmationSchedule.contact.email.push(String(email).trim());
            });
        }

        if (canConfirmActive) {
          // realiza match de flows `confirmActive` com as entidades encontradas do nosso lado
          // pelo código
          const actions = await this.flowService.matchFlowsAndGetActions({
            integrationId: integration._id,
            entitiesFilter: scheduleCorrelation,
            targetFlowTypes: [FlowSteps.confirmActive],
          });

          if (actions?.length) {
            confirmationSchedule.actions = actions;
          }
        }

        if (canConfirmActive) {
          result.data.push(confirmationSchedule);
        } else {
          result.ommitedData.push(confirmationSchedule);
        }
      }

      if (debugLimit) {
        result.data = result.data?.slice(0, debugLimit);
      }

      return result;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerFakeConfirmationService.listSchedulesToConfirm', error);
    }
  }

  async cancelSchedule(
    integration: IntegrationDocument,
    { scheduleId, scheduleCode }: CancelScheduleV2,
  ): Promise<OkResponse> {
    try {
      await this.schedulesService.buildCancelSchedule(integration, scheduleCode, scheduleId);
      const schedule = await this.schedulesService.getScheduleByCodeOrId(
        castObjectIdToString(integration._id),
        scheduleCode,
        scheduleId,
      );

      if (schedule) {
        await this.botdesignerFakeApiService.cancelSchedule(integration, {
          scheduleCode: schedule.scheduleCode,
        });
      }
    } catch (error) {}

    return { ok: true };
  }

  async confirmSchedule(
    integration: IntegrationDocument,
    { scheduleId, scheduleCode }: ConfirmScheduleV2,
  ): Promise<OkResponse> {
    try {
      await this.schedulesService.buildConfirmSchedule(integration, scheduleCode, scheduleId);
      const schedule = await this.schedulesService.getScheduleByCodeOrId(
        castObjectIdToString(integration._id),
        scheduleCode,
        scheduleId,
      );

      if (schedule) {
        await this.botdesignerFakeApiService.confirmSchedule(integration, {
          scheduleCode: schedule.scheduleCode,
        });
      }
    } catch (error) {}

    return { ok: true };
  }

  async validateScheduleData(): Promise<OkResponse> {
    return { ok: true };
  }

  async listSchedulesToActiveSending(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2,
  ): Promise<ExtractedSchedule[]> {
    const { startDate, endDate, maxResults = 100, page = 1 } = data;

    const appointments = await this.botdesignerFakeApiService.getAppointmentsByDateRange(
      integration,
      new Date(startDate),
      new Date(endDate),
    );

    const extractedSchedules: ExtractedSchedule[] = [];

    for (const appointment of appointments) {
      let patientData = null;
      if (appointment.patientCode) {
        patientData = await this.botdesignerFakeApiService.getPatient(integration, {
          params: { code: appointment.patientCode },
        });
      }

      const extractedSchedule: ExtractedSchedule = {
        scheduleCode: appointment.scheduleCode,
        scheduleDate: moment(appointment.scheduleDate).format('YYYY-MM-DDTHH:mm:ss'),
        appointmentTypeCode: appointment.appointmentTypeCode || 'C',
        insuranceCode: appointment.insuranceCode || '1',
        organizationUnitCode: appointment.organizationUnitCode || '1',
        specialityCode: appointment.specialityCode || '1',
        procedureCode: appointment.procedureCode || '1',
        doctorCode: appointment.doctorCode || '1',
        insurancePlanCode: appointment.insurancePlanCode,
        insuranceSubPlanCode: appointment.insuranceSubPlanCode,
        insuranceCategoryCode: appointment.insuranceCategoryCode,
        patient: {
          code: appointment.patientCode || '',
          name: patientData?.name,
          cpf: patientData?.cpf,
          bornDate: patientData?.bornDate,
          emails: patientData?.email ? [patientData.email] : [],
          phones: patientData?.phone ? [patientData.phone] : [],
        },
        data: null,
      };

      extractedSchedules.push(extractedSchedule);
    }

    const offset = (page - 1) * maxResults;
    return extractedSchedules.slice(offset, offset + maxResults);
  }
}
