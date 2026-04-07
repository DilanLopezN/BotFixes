import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import * as moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { IntegratorService } from '../../integrator/service/integrator.service';
import { HTTP_ERROR_THROWER } from '../../../common/exceptions.service';
import { HttpStatus } from '@nestjs/common';
import { ListAvailableSchedulesInput, ListAvailableSchedulesOutput } from '../interfaces/available-schedules.interface';
import { ListDoctor, ListInsurance, ListOrganizationUnit } from '../interfaces/entities-filters.interface';
import { DoctorOutput, InsuranceOutput, OrganizationUnitOutput } from '../interfaces/entities-output.interface';
import { PatientFilters } from '../../integrator/interfaces/patient-filters.interface';
import { Patient } from '../../interfaces/patient.interface';
import { EntityType } from '../../interfaces/entity.interface';
import { DoctorEntityDocument, InsuranceEntityDocument, OrganizationUnitEntityDocument } from '../../entities/schema';
import {
  AvailableSchedulesPeriodPatient,
  ListAvailableSchedules,
} from '../../integrator/interfaces/list-available-schedules.interface';
import { AppointmentSortMethod } from '../../interfaces/appointment.interface';
import { CorrelationFilter, CorrelationFilterByKey } from '../../interfaces/correlation-filter.interface';
import { FlowPeriodOfDay } from '../../flow/interfaces/flow.interface';
import { CreateScheduleInput, CreateScheduleOutput } from '../interfaces/create-schedule.interface';
import { CreateSchedule } from '../../integrator/interfaces/create-schedule.interface';
import { TypeOfService } from '../../entities/schema';
import { CacheService } from '../../../core/cache/cache.service';
import { VapiIntegrationData } from '../interfaces/vapi-integration-data.interface';
import { SaveVapiDataInputDto } from '../dto/save-vapi-data.dto';
import { ApiQueueService, EndpointType, Message } from '../../api/services/api-queue.service';
import { SendMessageInputDto } from '../dto/send-message.dto';
import { ApiService } from '../../api/services/api.service';
import { IntegrationService } from '../../integration/integration.service';

@Injectable()
export class VapiIntegrationService {
  private readonly logger = new Logger(VapiIntegrationService.name);
  private readonly REDIS_KEY_PREFIX = 'vapi-integration:';

  constructor(
    private readonly integratorService: IntegratorService,
    private readonly cacheService: CacheService,
    private readonly apiQueueService: ApiQueueService,
    private readonly apiService: ApiService,
    private readonly integrationService: IntegrationService,
  ) {}

  private getRedisKey(integrationId: string, callId: string): string {
    return `${this.REDIS_KEY_PREFIX}${integrationId}:${callId}`;
  }

  public async saveVapiData(integrationId: string, callId: string, data: Partial<VapiIntegrationData>): Promise<void> {
    try {
      const key = this.getRedisKey(integrationId, callId);

      // Buscar dados existentes do Redis
      const existingData = await this.getVapiData(integrationId, callId);

      // Fazer merge: manter dados existentes e adicionar/atualizar apenas os novos campos
      const mergedData: VapiIntegrationData = {
        ...existingData,
        ...data,
        integrationId,
        callId,
        createdAt: Date.now(),
      };

      // Salvar dados mesclados (integrationId e callId ficam também no valor para consulta)
      await this.cacheService.set(mergedData, key, 3600 * 24); // 24 horas de expiração
    } catch (error) {
      Sentry.captureEvent({
        message: `ERROR:VAPI-INTEGRATION:${integrationId}:saveVapiData`,
        extra: {
          integrationId: integrationId,
          callId: callId,
          error: error,
        },
      });
      throw error;
    }
  }

  public async getVapiData(integrationId: string, callId: string): Promise<VapiIntegrationData | null> {
    try {
      const key = this.getRedisKey(integrationId, callId);
      return await this.cacheService.get(key);
    } catch (error) {
      Sentry.captureEvent({
        message: `ERROR:VAPI-INTEGRATION:${integrationId}:getVapiData`,
        extra: {
          integrationId: integrationId,
          callId: callId,
          error: error,
        },
      });
      return null;
    }
  }

  public async listAvailableSchedules(
    integrationId: string,
    callId: string,
    input?: { startDate?: string; endDate?: string },
  ): Promise<ListAvailableSchedulesOutput> {
    try {
      // Buscar dados do Redis
      const redisData = await this.getVapiData(integrationId, callId);
      const scheduleCode = redisData?.scheduleCode;

      const period: FlowPeriodOfDay = 2;
      let fromDay = 0;
      let untilDay = 180;

      // Usar datas do input (body) ou do Redis como fallback
      const startDate = input?.startDate;
      const endDate = input?.endDate;

      if (startDate) {
        const startDateMoment = moment(startDate, 'YYYY/MM/DD HH:mm');
        if (startDateMoment.isValid()) {
          fromDay = startDateMoment.diff(moment().startOf('day'), 'days');
        }
      }

      if (endDate) {
        const endDateMoment = moment(endDate, 'YYYY/MM/DD HH:mm');
        if (endDateMoment.isValid()) {
          untilDay = endDateMoment.diff(moment().startOf('day'), 'days');
        }
      }

      const defaultLimit = 50;
      const patient: AvailableSchedulesPeriodPatient = { code: null, bornDate: null };

      const correlationFilterList: CorrelationFilterByKey = {
        doctor: redisData?.doctorCode,
        insurance: redisData?.insuranceCode,
        organizationUnit: redisData?.organizationUnitCode,
        procedure: redisData?.procedureCode,
        speciality: redisData?.specialityCode,
        appointmentType: redisData?.appointmentTypeCode,
      };
      const filterWithCorrelation = await this.integratorService.getCorrelationFilter(
        integrationId,
        correlationFilterList,
      );

      const availableSchedules: ListAvailableSchedules = {
        limit: defaultLimit,
        fromDay: fromDay,
        untilDay: untilDay,
        randomize: true,
        periodOfDay: period,
        sortMethod: AppointmentSortMethod.sequential,
        patient: patient,
        filter: filterWithCorrelation,
      };
      const { schedules } = await this.integratorService.getAvailableSchedules(
        integrationId,
        availableSchedules,
        false,
      );

      return {
        count: schedules.length,
        schedules: schedules.map((schedule) => ({
          scheduleCode: schedule.appointmentCode,
          scheduleDate: schedule.appointmentDate,
          duration: schedule.duration,
          doctorCode: schedule.doctor?.code,
          doctorName: schedule.doctor?.name,
          procedureCode: schedule.procedure?.code,
          procedureName: schedule.procedure?.name,
          organizationUnitCode: schedule.organizationUnit?.code,
          organizationUnitName: schedule.organizationUnit?.name,
          organizationUnitAdress: schedule.organizationUnitAdress,
          insuranceCode: schedule.insurance?.code,
          insuranceName: schedule.insurance?.name,
          specialityCode: schedule.speciality?.code,
          specialityName: schedule.speciality?.name,
          insurancePlanCode: schedule.insurancePlan?.code,
          insurancePlanName: schedule.insurancePlan?.name,
          insuranceSubPlanCode: schedule.insuranceSubPlan?.code,
          insuranceSubPlanName: schedule.insuranceSubPlan?.name,
          planCategoryCode: schedule.planCategory?.code,
          planCategoryName: schedule.planCategory?.name,
          appointmentTypeCode: schedule.appointmentType?.code,
          appointmentTypeName: schedule.appointmentType?.name,
          occupationAreaCode: schedule.occupationArea?.code,
          occupationAreaName: schedule.occupationArea?.name,
          organizationUnitLocationCode: schedule.organizationUnitLocation?.code,
          organizationUnitLocationName: schedule.organizationUnitLocation?.name,
          typeOfServiceCode: schedule.typeOfService?.code,
          typeOfServiceName: schedule.typeOfService?.name,
          guidance: schedule.guidance,
          guidanceLink: schedule.guidanceLink,
          observation: schedule.observation,
          warning: schedule.warning,
          isFollowUp: schedule.isFollowUp,
          price: schedule.price
            ? typeof schedule.price === 'string'
              ? schedule.price
              : `${schedule.price.value || ''} ${schedule.price.currency || ''}`.trim()
            : undefined,
          data: schedule.data,
        })),
      };
    } catch (error) {
      Sentry.captureEvent({
        message: `ERROR:SCHEDULING-QUERY:${integrationId}:listAvailableSchedules`,
        extra: {
          integrationId: integrationId,
          error: error,
        },
      });

      return null;
    }
  }

  public async listDoctors(integrationId: string, callId: string): Promise<DoctorOutput[]> {
    try {
      // Buscar dados do Redis
      const redisData = await this.getVapiData(integrationId, callId);

      // Construir filtro usando todos os códigos relevantes do Redis
      const filter: ListDoctor = {
        ...(redisData?.doctorCode && { doctorCode: redisData.doctorCode }),
        ...(redisData?.organizationUnitCode && { organizationUnitCode: redisData.organizationUnitCode }),
        ...(redisData?.insuranceCode && { insuranceCode: redisData.insuranceCode }),
        ...(redisData?.procedureCode && { procedureCode: redisData.procedureCode }),
        ...(redisData?.specialityCode && { specialityCode: redisData.specialityCode }),
        ...(redisData?.appointmentTypeCode && { appointmentTypeCode: redisData.appointmentTypeCode }),
      };

      const entityList = {
        targetEntity: EntityType.doctor,
        filter: filter,
        cache: true,
      };

      const { data: entities } = await this.integratorService.getEntityListV2(integrationId, entityList);
      const doctors = entities as DoctorEntityDocument[];

      return doctors.map((entity) => ({
        code: entity.code,
        name: entity.friendlyName,
      }));
    } catch (error) {
      Sentry.captureEvent({
        message: `ERROR:SCHEDULING-QUERY:${integrationId}:listDoctors`,
        extra: {
          integrationId: integrationId,
          error: error,
        },
      });

      return [];
    }
  }

  public async listOrganizationUnits(integrationId: string, callId: string): Promise<OrganizationUnitOutput[]> {
    try {
      // Buscar dados do Redis
      const redisData = await this.getVapiData(integrationId, callId);

      // Construir filtro usando todos os códigos relevantes do Redis
      const filter: ListOrganizationUnit = {
        ...(redisData?.organizationUnitCode && { organizationUnitCode: redisData.organizationUnitCode }),
        ...(redisData?.doctorCode && { doctorCode: redisData.doctorCode }),
        ...(redisData?.insuranceCode && { insuranceCode: redisData.insuranceCode }),
        ...(redisData?.procedureCode && { procedureCode: redisData.procedureCode }),
        ...(redisData?.specialityCode && { specialityCode: redisData.specialityCode }),
        ...(redisData?.appointmentTypeCode && { appointmentTypeCode: redisData.appointmentTypeCode }),
      };

      const entityList = {
        targetEntity: EntityType.organizationUnit,
        filter: filter,
        cache: true,
      };

      const { data: entities } = await this.integratorService.getEntityListV2(integrationId, entityList);
      const organizationUnits = entities as OrganizationUnitEntityDocument[];

      return organizationUnits.map((entity) => ({
        code: entity.code,
        name: entity.friendlyName,
        address: (entity.data as { address?: string } | undefined)?.address,
      }));
    } catch (error) {
      Sentry.captureEvent({
        message: `ERROR:SCHEDULING-QUERY:${integrationId}:listOrganizationUnits`,
        extra: {
          integrationId: integrationId,
          error: error,
        },
      });

      return [];
    }
  }

  public async listInsurances(integrationId: string, callId: string): Promise<InsuranceOutput[]> {
    try {
      // Buscar dados do Redis
      const redisData = await this.getVapiData(integrationId, callId);

      // Construir filtro usando todos os códigos relevantes do Redis
      const filter: ListInsurance = {
        ...(redisData?.insuranceCode && { insuranceCode: redisData.insuranceCode }),
        ...(redisData?.doctorCode && { doctorCode: redisData.doctorCode }),
        ...(redisData?.organizationUnitCode && { organizationUnitCode: redisData.organizationUnitCode }),
        ...(redisData?.procedureCode && { procedureCode: redisData.procedureCode }),
        ...(redisData?.specialityCode && { specialityCode: redisData.specialityCode }),
        ...(redisData?.appointmentTypeCode && { appointmentTypeCode: redisData.appointmentTypeCode }),
      };

      const entityList = {
        targetEntity: EntityType.insurance,
        filter: filter,
        cache: true,
      };

      const { data: entities } = await this.integratorService.getEntityListV2(integrationId, entityList);
      const insurances = entities as InsuranceEntityDocument[];

      return insurances.map((entity) => ({
        code: entity.code,
        name: entity.friendlyName,
      }));
    } catch (error) {
      Sentry.captureEvent({
        message: `ERROR:SCHEDULING-QUERY:${integrationId}:listInsurances`,
        extra: {
          integrationId: integrationId,
          error: error,
        },
      });

      return [];
    }
  }

  public async searchPatient(integrationId: string, filters: PatientFilters): Promise<Patient> {
    try {
      return await this.integratorService.getPatient(integrationId, filters);
    } catch (error) {
      Sentry.captureEvent({
        message: `ERROR:SCHEDULING-QUERY:${integrationId}:searchPatient`,
        extra: {
          integrationId: integrationId,
          error: error,
        },
      });

      throw error;
    }
  }

  public async createSchedule(integrationId: string, callId: string): Promise<CreateScheduleOutput> {
    try {
      // Buscar todos os dados do Redis
      const redisData = await this.getVapiData(integrationId, callId);

      if (!redisData?.scheduleCode) {
        throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'Schedule code is required in Redis data');
      }

      if (!redisData?.scheduleDate) {
        throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'Schedule date is required in Redis data');
      }

      if (!redisData?.insuranceCode) {
        throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'Insurance code is required in Redis data');
      }

      if (!redisData?.appointmentTypeCode) {
        throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'Appointment type code is required in Redis data');
      }

      if (!redisData?.patientCpf) {
        throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'Patient cpf is required in Redis data');
      }

      if (!redisData?.patientBornDate) {
        throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'Born date is required in Redis data');
      }

      const patient = await this.integratorService.getPatient(integrationId, {
        code: redisData.patientCode,
        bornDate: redisData.patientBornDate,
        cpf: redisData.patientCpf,
      });

      const createSchedule: CreateSchedule = {
        patient: {
          code: patient.code || redisData.patientCode,
          cpf: patient.cpf || redisData.patientCpf,
          name: patient.name,
          sex: patient.sex,
          bornDate: patient.bornDate,
          email: patient.email,
          cellPhone: patient.cellPhone,
          phone: patient.phone,
          weight: patient.weight,
          height: patient.height,
          data: patient.data,
        },
        appointment: {
          duration: redisData.scheduleDuration || redisData.duration,
          appointmentDate: redisData.scheduleDate,
          code: redisData.scheduleCode,
        },
        insurance: {
          code: redisData.insuranceCode,
          planCode: redisData.insurancePlanCode,
          planCategoryCode: redisData.insurancePlanCategoryCode,
          subPlanCode: redisData.insuranceSubPlanCode,
        },
        organizationUnit: redisData.organizationUnitCode
          ? {
              code: redisData.organizationUnitCode,
            }
          : undefined,
        procedure: redisData.procedureCode
          ? {
              code: redisData.procedureCode,
              specialityCode: redisData.specialityCode,
              specialityType: redisData.specialityType,
            }
          : undefined,
        speciality: redisData.specialityCode
          ? {
              code: redisData.specialityCode,
              specialityType: redisData.specialityType,
            }
          : undefined,
        doctor: redisData.doctorCode
          ? {
              code: redisData.doctorCode,
            }
          : undefined,
        typeOfService: redisData.typeOfServiceCode
          ? {
              code: redisData.typeOfServiceCode,
            }
          : undefined,
        appointmentType: {
          code: redisData.appointmentTypeCode,
        },
        scheduleType: redisData.scheduleType as TypeOfService,
        laterality: redisData.lateralityCode
          ? {
              code: redisData.lateralityCode,
            }
          : undefined,
        data: null,
      };

      const appointment = await this.integratorService.createSchedule(integrationId, createSchedule);

      // Marcar no Redis que o createSchedule foi concluído com sucesso para este callId
      await this.saveVapiData(integrationId, callId, { createSchedule: true });

      return {
        scheduleCode: appointment.appointmentCode,
        scheduleDate: appointment.appointmentDate,
        duration: appointment.duration,
        doctorCode: appointment.doctor?.code,
        doctorName: appointment.doctor?.name,
        procedureCode: appointment.procedure?.code,
        procedureName: appointment.procedure?.name,
        organizationUnitCode: appointment.organizationUnit?.code,
        organizationUnitName: appointment.organizationUnit?.name,
        organizationUnitAdress: appointment.organizationUnitAdress,
        insuranceCode: appointment.insurance?.code,
        insuranceName: appointment.insurance?.name,
        specialityCode: appointment.speciality?.code,
        specialityName: appointment.speciality?.name,
        insurancePlanCode: appointment.insurancePlan?.code,
        insurancePlanName: appointment.insurancePlan?.name,
        insuranceSubPlanCode: appointment.insuranceSubPlan?.code,
        insuranceSubPlanName: appointment.insuranceSubPlan?.name,
        planCategoryCode: appointment.planCategory?.code,
        planCategoryName: appointment.planCategory?.name,
        appointmentTypeCode: appointment.appointmentType?.code,
        appointmentTypeName: appointment.appointmentType?.name,
        occupationAreaCode: appointment.occupationArea?.code,
        occupationAreaName: appointment.occupationArea?.name,
        organizationUnitLocationCode: appointment.organizationUnitLocation?.code,
        organizationUnitLocationName: appointment.organizationUnitLocation?.name,
        typeOfServiceCode: appointment.typeOfService?.code,
        typeOfServiceName: appointment.typeOfService?.name,
        guidance: appointment.guidance,
        guidanceLink: appointment.guidanceLink,
        observation: appointment.observation,
        warning: appointment.warning,
        isFollowUp: appointment.isFollowUp,
        price: appointment.price
          ? typeof appointment.price === 'string'
            ? appointment.price
            : `${appointment.price.value || ''} ${appointment.price.currency || ''}`.trim()
          : undefined,
        data: appointment.data,
      };
    } catch (error) {
      Sentry.captureEvent({
        message: `ERROR:VAPI-INTEGRATION:${integrationId}:createSchedule`,
        extra: {
          integrationId: integrationId,
          error: error,
        },
      });

      throw error;
    }
  }

  public generateCallId(): string {
    return uuidv4();
  }

  private vapiDataToAttributes(redisData: VapiIntegrationData | null): Map<string, string> {
    const attrsMap = new Map<string, string>();
    if (!redisData) return attrsMap;

    if (redisData.patientCpf) attrsMap.set('paciente_cpf', redisData.patientCpf);
    if (redisData.patientBornDate) attrsMap.set('paciente_nascimento', redisData.patientBornDate);
    if (redisData.insuranceCode) attrsMap.set('convenio_handler', redisData.insuranceCode);
    if (redisData.insurancePlanCode) attrsMap.set('plano_handler', redisData.insurancePlanCode);
    if (redisData.doctorCode) attrsMap.set('medico_handler', redisData.doctorCode);
    if (redisData.organizationUnitCode) attrsMap.set('organizacao_handler', redisData.organizationUnitCode);

    return attrsMap;
  }

  public async sendMessage(integrationId: string, body: SendMessageInputDto): Promise<{ ok: boolean }> {
    const attrsMap = new Map<string, string>();

    if (body.callId) {
      const redisData = await this.getVapiData(integrationId, body.callId);

      if (redisData?.createSchedule) return { ok: true };

      const redisAttrs = this.vapiDataToAttributes(redisData);
      redisAttrs.forEach((value, name) => attrsMap.set(name, value));
    }

    const attributes = Array.from(attrsMap.entries()).map(([name, value]) => ({ name, value }));

    // if (attributes.length === 0) throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'No attributes found');

    if (body.debug) {
      const integration = await this.integrationService.getOne(integrationId);
      await this.apiService.sendMessage(integration, {
        apiToken: body.apiToken,
        phoneNumber: body.phoneNumber,
        attributes,
      });
    } else {
      const message: Message = {
        messageBody: {
          integrationId,
          id: body.callId,
          phone: body.phoneNumber,
          token: body.apiToken,
          attributes,
        },
        callback: async () => {
          await this.saveVapiData(integrationId, body.callId, { messageSended: true });
          return { ok: true };
        },
        config: { endpointType: EndpointType.DEFAULT },
      };
      await this.apiQueueService.enqueue([message]);
      return { ok: true };
    }
  }

  /**
   * integrationId e callId vêm apenas da chave Redis (vapi-integration:integrationId:callId); chave inválida é ignorada.
   * No valor são obrigatórios apiToken e phoneNumber; se faltar um, ignora. Só enfileira onde createSchedule !== true e messageSended !== true.
   * Usa MGET para buscar todos os valores em uma única ida ao Redis.
   */
  public async enqueuePendingVapiMessages(): Promise<{ enqueued: number }> {
    try {
      const keys = await this.cacheService.getKeysByPattern(`${this.REDIS_KEY_PREFIX}*`);
      if (keys.length === 0) return { enqueued: 0 };

      const values = (await this.cacheService.mget(keys))
        .map((v) => {
          try {
            return JSON.parse(v);
          } catch (e) {
            return null;
          }
        })
        .filter((v) => v !== null) as VapiIntegrationData[];
      const THIRTY_MINUTES_MS = 30 * 60 * 1000;
      const messages: Message[] = [];

      this.logger.log(`VAPI sendMessage cron cache ${keys.length} keys found, ${values.length} message(s) to enqueue`);
      for (let i = 0; i < keys.length; i++) {
        const data: VapiIntegrationData | null = values[i];

        if (
          !data ||
          data.createSchedule === true ||
          data.messageSended === true ||
          !data.apiToken ||
          !data.phoneNumber ||
          data.createdAt == null
        ) {
          continue;
        }

        if (Date.now() - data.createdAt < THIRTY_MINUTES_MS) continue;

        this.logger.log(`VAPI sendMessage cron ${values.length} message(s) valid to send`);
        const attrsMap = this.vapiDataToAttributes(data);
        const attributes = Array.from(attrsMap.entries()).map(([name, value]) => ({ name, value }));
        // if (attributes.length === 0) continue;

        messages.push({
          messageBody: {
            integrationId: data.integrationId,
            id: data.callId,
            phone: data.phoneNumber,
            token: data.apiToken,
            attributes,
          },
          callback: async () => {
            await this.saveVapiData(data.integrationId, data.callId, { messageSended: true });
            return { ok: true };
          },
          config: { endpointType: EndpointType.DEFAULT },
        });
      }

      if (messages.length > 0) await this.apiQueueService.enqueue(messages);
      return { enqueued: messages.length };
    } catch (error) {
      this.logger.error('VAPI enqueuePendingVapiMessages failed', error);
      throw error;
    }
  }
}
