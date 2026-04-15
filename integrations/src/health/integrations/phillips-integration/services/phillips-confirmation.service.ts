import { Injectable } from '@nestjs/common';
import { FlowAction, FlowActionElement, FlowSteps } from '../../../flow/interfaces/flow.interface';
import {
  CancelScheduleV2,
  ConfirmScheduleV2,
  ExtractType,
  ListSchedulesToConfirmV2,
  MatchFlowsConfirmation,
  ValidateScheduleConfirmation,
} from '../../../integrator/interfaces';
import { INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { FlowService } from '../../../flow/service/flow.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { PhillipsApiService } from './phillips-api.service';
import {
  ConfirmationSchedule,
  ConfirmationScheduleDataV2,
  ConfirmationScheduleSchedule,
} from '../../../interfaces/confirmation-schedule.interface';
import { EntityType } from '../../../interfaces/entity.interface';
import * as moment from 'moment';
import { CorrelationFilterByKeys } from '../../../interfaces/correlation-filter.interface';
import { EntityDocument } from '../../../entities/schema';
import { PhillipsHelpersService } from './phillips-helpers.service';
import { EntitiesService } from '../../../entities/services/entities.service';
import { SchedulesService } from '../../../schedules/schedules.service';
import { ExtractedSchedule } from '../../../schedules/interfaces/extracted-schedule.interface';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';
import { GetScheduleByIdData } from '../../../integrator/interfaces/get-schedule-by-id.interface';
import { Schedules } from '../../../schedules/entities/schedules.entity';
import { PhillipsConfirmationErpParams } from '../interfaces/confirmation';
import {
  PhillipsConsultationSchedule,
  PhillipsExamSchedule,
  PhillipsListSchedulesParams,
  PhillipsParamsType,
} from '../interfaces';

@Injectable()
export class PhillipsConfirmationService {
  constructor(
    private readonly phillipsApiService: PhillipsApiService,
    private readonly phillipsHelpersService: PhillipsHelpersService,
    private readonly entitiesService: EntitiesService,
    private readonly flowService: FlowService,
    private readonly schedulesService: SchedulesService,
  ) {}

  // ========== EXTRAÇÃO DE AGENDAMENTOS ==========

  private async listSchedulesToConfirmData(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2<PhillipsConfirmationErpParams>,
  ): Promise<ExtractedSchedule[]> {
    const { startDate, endDate } = data;
    const erpParams: PhillipsConfirmationErpParams = data.erpParams as PhillipsConfirmationErpParams;

    const maxResults = 100;
    const initialDate = moment(startDate).format('YYYY-MM-DD');
    const finalDate = moment(endDate).format('YYYY-MM-DD');

    // ========== CONSULTAS (paginado) ==========
    const consultationSchedules: PhillipsConsultationSchedule[] = [];

    try {
      let page = 1;
      let response: PhillipsConsultationSchedule[];

      do {
        const result = await this.phillipsApiService
          .listSchedulesConsultation(integration, {
            initialDate,
            endDate: finalDate,
            page,
            maxResults,
          } as PhillipsParamsType)
          .catch(() => ({ results: [] }));

        response = result?.results ?? [];

        console.log('DEBUG dates', {
          startDate,
          endDate,
          startMs: moment(startDate).valueOf(),
          endMs: moment(endDate).valueOf(),
          firstScheduleDate: response?.[0]?.consultationScheduleEmbeddedDate?.scheduleDate,
          firstScheduleMs: moment(response?.[0]?.consultationScheduleEmbeddedDate?.scheduleDate).valueOf(),
          responseLength: response?.length,
        });

        if (response?.length > 0) {
          response.forEach((schedule) => {
            const scheduleDate = schedule.consultationScheduleEmbeddedDate?.scheduleDate;

            if (
              moment.utc(scheduleDate).startOf('day').valueOf() >= moment(startDate).startOf('day').valueOf() &&
              moment.utc(scheduleDate).startOf('day').valueOf() <= moment(endDate).startOf('day').valueOf()
            ) {
              consultationSchedules.push(schedule);
            }
          });
        }

        page++;
      } while (response?.length >= maxResults);
    } catch (error) {
      // Se consultas falhar, continua com exames
      console.error('PhillipsConfirmationService.listSchedulesToConfirmData: Error fetching consultations', error);
    }

    // ========== EXAMES (paginado) ==========
    const examSchedules: PhillipsExamSchedule[] = [];

    try {
      let page = 1;
      let response: PhillipsExamSchedule[];

      do {
        const result = await this.phillipsApiService
          .listExamsSchedule(integration, {
            initialDate,
            endDate: finalDate,
            page,
            maxResults,
          } as PhillipsParamsType)
          .catch(() => ({ results: [] }));

        response = result?.results ?? [];

        if (response?.length > 0) {
          response.forEach((schedule) => {
            const scheduleDate = schedule.timeSlotDate;

            if (
              moment.utc(scheduleDate).startOf('day').valueOf() >= moment(startDate).startOf('day').valueOf() &&
              moment.utc(scheduleDate).startOf('day').valueOf() <= moment(endDate).startOf('day').valueOf()
            ) {
              examSchedules.push(schedule);
            }
          });
        }

        page++;
      } while (response?.length >= maxResults);
    } catch (error) {
      // Se exames falhar, continua com consultas
      console.error('PhillipsConfirmationService.listSchedulesToConfirmData: Error fetching exams', error);
    }

    // ========== MERGE ==========
    const extractedConsultations = this.transformConsultationsToExtractedSchedules(integration, consultationSchedules);
    const extractedExams = this.transformExamsToExtractedSchedules(integration, examSchedules);

    return [...extractedConsultations, ...extractedExams];
  }

  // ========== TRANSFORM CONSULTATIONS ==========

  private transformConsultationsToExtractedSchedules(
    _integration: IntegrationDocument,
    schedules: PhillipsConsultationSchedule[],
  ): ExtractedSchedule[] {
    return (
      schedules?.map((schedule) => {
        const patientPhones = [schedule.phoneNumber, schedule.patient?.phoneNumber].filter(
          (phone): phone is string => !!phone,
        );

        return {
          doctorCode: schedule.scheduleCode?.physician?.naturalPersonCode
            ? String(schedule.scheduleCode.physician.naturalPersonCode)
            : '',
          insuranceCode: '',
          procedureCode: '',
          organizationUnitCode: schedule.scheduleCode?.establishmentCode?.id
            ? String(schedule.scheduleCode.establishmentCode.id)
            : '',
          specialityCode: schedule.scheduleCode?.specialty?.code ? String(schedule.scheduleCode.specialty.code) : '',
          appointmentTypeCode: '',
          scheduleCode: String(schedule.sequence),
          scheduleDate: schedule.consultationScheduleEmbeddedDate?.scheduleDate ?? '',
          patient: {
            code: schedule.patient?.naturalPersonCode ? String(schedule.patient.naturalPersonCode) : '',
            name: schedule.patientName || schedule.patient?.name || '',
            phones: patientPhones,
            cpf: schedule.patient?.taxPayerId || '',
            bornDate: schedule.patient?.birthDate ? moment(schedule.patient.birthDate).format('YYYY-MM-DD') : '',
          },
        };
      }) ?? []
    );
  }

  // ========== TRANSFORM EXAMS ==========

  private transformExamsToExtractedSchedules(
    _integration: IntegrationDocument,
    schedules: PhillipsExamSchedule[],
  ): ExtractedSchedule[] {
    return (
      schedules?.map((schedule) => {
        const patientPhones = [schedule.phoneNumber].filter((phone): phone is string => !!phone);

        return {
          doctorCode: schedule.physician ? String(schedule.physician) : '',
          insuranceCode: schedule.insuranceCode ? String(schedule.insuranceCode) : '',
          procedureCode: schedule.procedureCode ? String(schedule.procedureCode) : '',
          organizationUnitCode: schedule.establishmentCode ? String(schedule.establishmentCode) : '',
          specialityCode: '',
          appointmentTypeCode: '',
          scheduleCode: String(schedule.sequence),
          scheduleDate: schedule.timeSlotDate ?? '',
          patient: {
            code: schedule.naturalPersonCode ? String(schedule.naturalPersonCode) : '',
            name: schedule.patientName || '',
            phones: patientPhones,
            cpf: schedule.taxPayerId || '',
            bornDate: schedule.patientBirthDate ? moment(schedule.patientBirthDate).format('YYYY-MM-DD') : '',
          },
        };
      }) ?? []
    );
  }

  // ========== LIST SCHEDULES TO CONFIRM ==========

  async listSchedulesToConfirm(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2<PhillipsConfirmationErpParams>,
  ): Promise<ConfirmationSchedule> {
    const debugLimit = data.erpParams?.debugLimit;
    const debugPhone = data.erpParams?.debugPhoneNumber;
    const debugPatientCode = data.erpParams?.debugPatientCode;
    const debugScheduleCode = data.erpParams?.debugScheduleCode;

    const { extractStartedAt, extractEndedAt, schedules } = await this.schedulesService.buildExtraction(
      integration,
      data,
      this.listSchedulesToConfirmData.bind(this),
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

      const { organizationUnit, doctor, speciality } = scheduleCorrelation;
      const dateFormat = 'YYYY-MM-DDTHH:mm:ss';

      const scheduleObject: ConfirmationScheduleSchedule = {
        scheduleId: schedule.id,
        scheduleCode: String(schedule.scheduleCode),
        scheduleDate: moment(schedule.scheduleDate).format(dateFormat),
        organizationUnitAddress: (organizationUnit?.data as any)?.address,
        organizationUnitName: organizationUnit?.friendlyName ?? '',
        procedureName: schedule.procedureName?.trim() ?? '',
        doctorName: doctor?.friendlyName || schedule.doctorName?.trim() || '',
        appointmentTypeName: '',
        appointmentTypeCode: '',
        specialityCode: speciality?.code || undefined,
        specialityName: speciality?.friendlyName || '',
        doctorCode: doctor?.code || schedule?.doctorCode,
        organizationUnitCode: organizationUnit?.code || schedule?.organizationUnitCode,
        procedureCode: undefined,
      };

      const confirmationScheduleContactEmails: string[] = [];
      const confirmationSchedule: ConfirmationScheduleDataV2 = {
        contact: {
          phone: [],
          email: confirmationScheduleContactEmails,
          name: schedule.patientName,
          code: schedule.patientCode ?? '',
        },
        schedule: scheduleObject,
        actions: [],
      };

      if (debugPhone) {
        confirmationSchedule.contact.phone.push(String(debugPhone).trim());
      } else {
        const phones = ([] as string[]).concat(schedule.patientPhone1 || [], schedule.patientPhone2 || []);
        phones
          .filter((phone) => !!phone)
          .forEach((phone) => {
            confirmationSchedule.contact.phone.push(String(phone).trim());
          });
      }

      if (schedule.patientEmail1) {
        confirmationScheduleContactEmails.push(schedule.patientEmail1);
      } else if (schedule.patientEmail2) {
        confirmationScheduleContactEmails.push(schedule.patientEmail2);
      }

      if (canConfirmActive) {
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
        result.ommitedData?.push(confirmationSchedule);
      }
    }

    if (debugPatientCode) {
      result.data = result.data?.filter((schedule) => debugPatientCode.includes(schedule.contact?.code));
    }

    if (debugScheduleCode) {
      result.data = result.data?.filter((schedule) => {
        if ('schedule' in schedule) {
          const scheduleCode = (schedule as ConfirmationScheduleDataV2).schedule?.scheduleCode;
          return scheduleCode ? debugScheduleCode.includes(scheduleCode) : false;
        }
        return false;
      });
    }

    if (debugLimit) {
      result.data = result.data?.slice(0, debugLimit);
    }

    return result;
  }

  // ========== MATCH FLOWS ==========

  public async matchFlowsConfirmation(
    integration: IntegrationDocument,
    data: MatchFlowsConfirmation,
  ): Promise<FlowAction<FlowActionElement>[]> {
    try {
      return await this.schedulesService.matchFlowsConfirmation(castObjectIdToString(integration._id), data);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('PhillipsConfirmationService.matchFlowsConfirmation', error);
    }
  }

  // ========== CANCEL SCHEDULE ==========
  // Padrão Netpacs: API call dentro do try/catch, buildCancelSchedule FORA do try/catch

  public async cancelSchedule(
    integration: IntegrationDocument,
    { scheduleCode, scheduleId }: CancelScheduleV2<PhillipsConfirmationErpParams>,
  ): Promise<OkResponse> {
    const schedule = await this.schedulesService.checkCanCancelScheduleAndReturn(
      castObjectIdToString(integration._id),
      scheduleCode,
      scheduleId,
    );

    try {
      await this.phillipsApiService.updateConsultationStatus(integration, Number(schedule.scheduleCode ?? 0), {
        confirmationStatusIntegration: 'S',
        status: 'CANCELLED',
        reasonStatusChange: 'BOT TEST',
        // reasonStatusChange: 'Cancelado Via Integração',
      });
    } catch (error) {
      console.error(error);
      throw INTERNAL_ERROR_THROWER('PhillipsConfirmationService.cancelSchedule', error);
    }

    await this.schedulesService.buildCancelSchedule(integration, schedule.scheduleCode, scheduleId);
    return { ok: true };
  }

  // ========== CONFIRM SCHEDULE ==========
  // Padrão Netpacs: API call dentro do try/catch com tratamento de "already confirmed",
  // buildConfirmSchedule FORA do try/catch

  public async confirmSchedule(
    integration: IntegrationDocument,
    { scheduleCode, scheduleId }: ConfirmScheduleV2,
  ): Promise<OkResponse> {
    const schedule = await this.schedulesService.checkCanConfirmScheduleAndReturn(
      castObjectIdToString(integration._id),
      scheduleCode,
      scheduleId,
    );

    try {
      await this.phillipsApiService.updateConsultationStatus(integration, Number(schedule.scheduleCode ?? 0), {
        status: 'CONFIRMED',
        confirmationStatusIntegration: 'CONFIRMED',
        // reasonStatusChange: 'Confirmado via integração',
      });
    } catch (error: any) {
      // Trata caso já esteja confirmado/cancelado — padrão Netpacs
      const isAlreadyConfirmed =
        error?.response?.data?.message?.includes?.('Already confirmed') ||
        error?.response?.data?.message?.includes?.('Successfully updated') ||
        error?.response?.data?.message?.includes?.('situação não pode ser alterada');

      if (!isAlreadyConfirmed) {
        console.error(error);
        throw INTERNAL_ERROR_THROWER('PhillipsConfirmationService.confirmSchedule', error);
      }
    }

    await this.schedulesService.buildConfirmSchedule(integration, schedule.scheduleCode, scheduleId ?? 0);
    return { ok: true };
  }

  // ========== GET SCHEDULE ==========

  async getSchedule(integration: IntegrationDocument, scheduleCode: string): Promise<ExtractedSchedule[]> {
    const initialDate = moment().subtract(1, 'year').format('YYYY-MM-DD');
    const finalDate = moment().add(1, 'month').format('YYYY-MM-DD');

    // Busca em consultas e exames — se uma falhar, continua com a outra
    const [consultationsResult, examsResult] = await Promise.all([
      this.phillipsApiService
        .listSchedulesConsultation(integration, {
          initialDate,
          endDate: finalDate,
          page: 1,
          maxResults: 100,
        } as PhillipsParamsType)
        .catch(() => ({ results: [] })),
      this.phillipsApiService
        .listExamsSchedule(integration, {
          initialDate,
          endDate: finalDate,
          page: 1,
          maxResults: 100,
        } as PhillipsParamsType)
        .catch(() => ({ results: [] })),
    ]);

    // Tenta encontrar em consultas
    const consultationMatch = (consultationsResult?.results ?? []).find(
      (s: PhillipsConsultationSchedule) => String(s.sequence) === scheduleCode,
    );

    if (consultationMatch) {
      return this.transformConsultationsToExtractedSchedules(integration, [consultationMatch]);
    }

    // Tenta encontrar em exames
    const examMatch = (examsResult?.results ?? []).find(
      (s: PhillipsExamSchedule) => String(s.sequence) === scheduleCode,
    );

    if (examMatch) {
      return this.transformExamsToExtractedSchedules(integration, [examMatch]);
    }

    return [];
  }

  // ========== VALIDATE SCHEDULE DATA ==========

  public async validateScheduleData(
    integration: IntegrationDocument,
    { scheduleCode, scheduleId }: ValidateScheduleConfirmation,
  ): Promise<OkResponse> {
    try {
      const result = await this.schedulesService.validateScheduleData(
        integration,
        scheduleCode ?? '',
        scheduleId ?? 0,
        this.getSchedule.bind(this),
      );

      return { ok: result };
    } catch (error) {
      console.error(error);
      throw INTERNAL_ERROR_THROWER('PhillipsConfirmationService.validateScheduleData', error);
    }
  }

  // ========== GET CONFIRMATION SCHEDULE BY ID ==========

  async getConfirmationScheduleById(integration: IntegrationDocument, data: GetScheduleByIdData): Promise<Schedules> {
    try {
      return await this.schedulesService.getScheduleByCodeOrId(
        castObjectIdToString(integration._id),
        undefined,
        data.scheduleId,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('PhillipsConfirmationService.getConfirmationScheduleById', error);
    }
  }
}
