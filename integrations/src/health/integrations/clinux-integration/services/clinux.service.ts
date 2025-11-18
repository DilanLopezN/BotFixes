import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { HttpErrorOrigin, HTTP_ERROR_THROWER, INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { formatCurrency } from '../../../../common/helpers/format-currency';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import {
  AppointmentTypeEntityDocument,
  InsuranceEntityDocument,
  InsurancePlanEntityDocument,
  OccupationAreaEntityDocument,
  OrganizationUnitEntityDocument,
  OrganizationUnitLocationEntityDocument,
  ProcedureEntityDocument,
  SpecialityEntityDocument,
  EntityDocument,
  DoctorEntityDocument,
  ScheduleType,
} from '../../../entities/schema';
import { AppointmentService, RawAppointment } from '../../../shared/appointment.service';
import { EntitiesService } from '../../../entities/services/entities.service';
import { FlowService } from '../../../flow/service/flow.service';
import { getExpirationByEntity } from '../../../integration-cache-utils/cache-expirations';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { CancelSchedule, CancelScheduleV2 } from '../../../integrator/interfaces/cancel-schedule.interface';
import { ConfirmSchedule, ConfirmScheduleV2 } from '../../../integrator/interfaces/confirm-schedule.interface';
import { CreatePatient } from '../../../integrator/interfaces/create-patient.interface';
import { CreateSchedule } from '../../../integrator/interfaces/create-schedule.interface';
import { GetScheduleValue } from '../../../integrator/interfaces/get-schedule-value.interface';
import { IIntegratorService } from '../../../integrator/interfaces/integrator-service.interface';
import {
  ListAvailableSchedules,
  ListAvailableSchedulesResponse,
} from '../../../integrator/interfaces/list-available-schedules.interface';
import { PatientFilters } from '../../../integrator/interfaces/patient-filters.interface';
import { PatientSchedules } from '../../../integrator/interfaces/patient-schedules.interface';
import { Reschedule } from '../../../integrator/interfaces/reschedule.interface';
import { UpdatePatient } from '../../../integrator/interfaces/update-patient.interface';
import {
  Appointment,
  AppointmentSortMethod,
  AppointmentStatus,
  AppointmentValue,
  MinifiedAppointments,
} from '../../../interfaces/appointment.interface';
import { CorrelationFilter, CorrelationFilterByKey } from '../../../interfaces/correlation-filter.interface';
import {
  EntitySourceType,
  EntityType,
  EntityTypes,
  EntityVersionType,
  IAppointmentTypeEntity,
  IDoctorEntity,
  IInsuranceEntity,
  IInsurancePlanEntity,
  IOrganizationUnitEntity,
  IProcedureEntity,
  ISpecialityEntity,
  ITypeOfServiceEntity,
} from '../../../interfaces/entity.interface';
import { Patient } from '../../../interfaces/patient.interface';
import {
  ClinuxDoctorsParamsRequest,
  ClinuxInsurancePlansParamsRequest,
  ClinuxInsurancesParamsRequest,
  ClinuxOrganizationsParamsRequest,
  ClinuxProceduresParamsRequest,
  ClinuxProceduresResponse,
  ClinuxProcedureValueParamsRequest,
  ClinuxSpecialitiesParamsRequest,
  ClinuxSpecialitiesResponse,
} from '../interfaces/base-register.interface';
import {
  ClinuxCreatePatientParamsRequest,
  ClinuxCreatePatientResponse,
  ClinuxGetPatientResponse,
  ClinuxUpdatePatientParamsRequest,
} from '../interfaces/patient.interface';
import {
  ClinuxCancelScheduleResponse,
  ClinuxConfirmScheduleResponse,
  ClinuxCreateScheduleParamsRequest,
  ClinuxScheduleJsExame,
  ClinuxListAvailableSchedulesParamsRequest,
  ClinuxListAvailableSchedulesResponse,
  ClinuxListPatientSchedulesResponse,
  ClinuxListAvailableSchedulesResponseV2,
  ClinuxListAvailableSchedulesParamsRequestV2,
  ClinuxListPatientAttendanceParamsResponse,
} from '../interfaces/schedule.interface';
import { ClinuxApiService } from './clinux-api.service';
import { ClinuxHelpersService } from './clinux-helpers.service';
import { Buffer } from 'buffer';
import { FlowAction, FlowActionElement, FlowSteps } from '../../../flow/interfaces/flow.interface';
import { orderBy, pick } from 'lodash';
import { defaultAppointmentTypes, defaultTypesOfService } from '../../../entities/default-entities';
import { castObjectId, castObjectIdToString } from '../../../../common/helpers/cast-objectid';
import * as Sentry from '@sentry/node';
import {
  ConfirmationScheduleGuidance,
  ConfirmationScheduleGuidanceResponse,
  ListAvailableMedicalReports,
  ListSchedulesToConfirmV2,
  MatchFlowsConfirmation,
  ValidPatientReportDownloadRequest,
  CountAvailableMedicalReportsResponse,
  ListAvailableMedicalReportsFilterRequest,
  ListAvailableMedicalReportsTokenData,
  HasAvailableMedicalReportsFilterRequest,
  HasAvailableMedicalReportsFilterResponse,
} from '../../../integrator/interfaces';
import { ClinuxConfirmationService } from './clinux-confirmation.service';
import { ConfirmationSchedule } from '../../../interfaces/confirmation-schedule.interface';
import { DownloadMedicalReportTokenData } from '../../../scheduling/interfaces/download-token.interface';
import { SchedulingDownloadReportService } from '../../../scheduling/services/scheduling-download-report.service';
import { ListSchedules } from '../../../scheduling/interfaces/list-schedules.interface';

type EntityFilters = { [key in EntityType]?: EntityTypes };
type RequestParams = { [key: string]: any };

@Injectable()
export class ClinuxService implements IIntegratorService {
  constructor(
    private readonly clinuxApiService: ClinuxApiService,
    private readonly entitiesService: EntitiesService,
    private readonly appointmentService: AppointmentService,
    private readonly flowService: FlowService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
    private readonly clinuxHelpersService: ClinuxHelpersService,
    private readonly confirmationService: ClinuxConfirmationService,
    private readonly schedulingDownloadReportService: SchedulingDownloadReportService,
  ) {}

  private getDefaultErpEntityData(
    integration: IntegrationDocument,
  ): Pick<EntityDocument, 'integrationId' | 'source' | 'activeErp' | 'version'> {
    return {
      integrationId: castObjectId(integration._id),
      source: EntitySourceType.erp,
      activeErp: true,
      version: EntityVersionType.production,
    };
  }

  async cancelSchedule(integration: IntegrationDocument, cancelSchedule: CancelSchedule): Promise<OkResponse> {
    const { appointmentCode, patientCode } = cancelSchedule;

    try {
      const data: ClinuxCancelScheduleResponse[] = await this.clinuxApiService.cancelSchedule(integration, {
        cd_atendimento: Number(appointmentCode),
        cd_paciente: Number(patientCode),
      });

      if (data?.[0]?.cd_atendimento) {
        return {
          ok: true,
        };
      }

      return { ok: false };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinuxService.cancelSchedule', error);
    }
  }

  async confirmSchedule(integration: IntegrationDocument, confirmSchedule: ConfirmSchedule): Promise<OkResponse> {
    const { appointmentCode, patientCode } = confirmSchedule;

    try {
      const data: ClinuxConfirmScheduleResponse[] = await this.clinuxApiService.confirmSchedule(integration, {
        cd_atendimento: Number(appointmentCode),
        cd_paciente: Number(patientCode),
      });

      if (data?.[0].cd_atendimento) {
        return { ok: true };
      }

      return { ok: false };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinuxService.confirmSchedule', error);
    }
  }

  async createSchedule(integration: IntegrationDocument, createSchedule: CreateSchedule): Promise<Appointment> {
    try {
      const { appointment, organizationUnit, insurance, patient, procedure, appointmentType, doctor } = createSchedule;
      const appointmentDate = moment.utc(appointment.appointmentDate);

      const procedureEntity = await this.entitiesService.getEntityByCode(
        procedure.code,
        EntityType.procedure,
        integration._id,
      );

      const procedureData = procedureEntity.data as any;

      const payloadDefaultData = {
        cd_medico: Number(doctor?.code ?? 0),
        cd_empresa: Number(organizationUnit?.code ?? 0),
        cd_plano: Number(insurance.code),
        cd_subplano: Number(insurance?.planCode ?? 0),
      };

      const js_exame: ClinuxScheduleJsExame[] = [
        {
          ...payloadDefaultData,
          cd_modalidade: Number(procedure.specialityCode),
          cd_procedimento: Number(procedure.code),
          ds_procedimento: procedureEntity.name,
          nr_tempo: procedureData?.nr_tempo,
          sn_especial: procedureData?.sn_especial ?? false,
          sn_preparo: procedureData?.sn_preparo ?? true,
          nr_quantidade: 1,
        },
      ];

      const payload: ClinuxCreateScheduleParamsRequest = {
        ...payloadDefaultData,
        cd_horario: String(appointment.code),
        cd_atendimento: 0,
        cd_paciente: Number(patient.code),
        cd_subplano: Number(insurance.planCode ?? 0),
        dt_data: appointmentDate.format('DD/MM/YYYY'),
        dt_hora: appointmentDate.format('HH:mm'),
        sn_consulta: appointmentType.code === 'C', // para exame é false
        ds_plano: procedureData.ds_plano,
        js_exame: Buffer.from(JSON.stringify(js_exame)).toString('base64'),
      };

      const response = await this.clinuxApiService.createSchedule(integration, payload);

      if (response?.[0]?.cd_atendimento) {
        const schedule: Appointment = {
          appointmentDate: appointment.appointmentDate,
          duration: appointment.duration,
          appointmentCode: String(response[0].cd_atendimento),
          status: AppointmentStatus.scheduled,
        };

        if (integration.rules?.sendGuidanceOnCreateSchedule) {
          const data = await this.clinuxApiService.getProcedureGuidance(integration, {
            cd_procedimento: Number(procedure.code),
          });
          if (data[0]?.bb_preparo) {
            schedule.guidance = this.clinuxHelpersService.sanitizeGuidanceText(data[0].bb_preparo);
          }
        }
        return schedule;
      }
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinuxService.createSchedule', error);
    }
  }

  async createPatient(integration: IntegrationDocument, { patient }: CreatePatient): Promise<Patient> {
    try {
      const clinuxPatient = this.clinuxHelpersService.replacePatientToClinuxPatient(patient);

      const payload: ClinuxCreatePatientParamsRequest = {
        cd_funcionario: 1,
        cd_operacao: 0,
        cd_paciente: 0,
        js_paciente: Buffer.from(JSON.stringify(clinuxPatient)).toString('base64'),
      };

      const data: ClinuxCreatePatientResponse[] = await this.clinuxApiService.createPatient(integration, payload);

      if (data?.[0].Sucesso) {
        const patientCode = data[0].Sucesso;
        const createdPatient: Patient = {
          ...patient,
          code: String(patientCode),
        };

        await this.integrationCacheUtilsService.setPatientCache(
          integration,
          String(patientCode),
          patient.cpf,
          createdPatient,
        );
        return createdPatient;
      }

      return null;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinuxService.createPatient', error);
    }
  }

  async extractSingleEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    filter?: CorrelationFilter,
    cache: boolean = false,
  ): Promise<EntityTypes[]> {
    return await this.extractEntity(integration, entityType, filter, cache);
  }

  private async createListAvailableSchedulesObject(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
    multiplierUntilDay: number,
  ): Promise<ClinuxListAvailableSchedulesParamsRequest | ClinuxListAvailableSchedulesParamsRequestV2> {
    const { period, filter, fromDay = 0, patient } = availableSchedules;

    const { procedure, insurancePlan, insurance, organizationUnit, appointmentType, doctor } = filter;

    const dateFormat = 'DD/MM/YYYY';
    const procedureData = filter.procedure.data as any;

    const maxRangeDays = integration.rules?.limitOfDaysToSplitRequestInScheduleSearch || 7;
    let newUntilDay = maxRangeDays * multiplierUntilDay || maxRangeDays;
    let newFromDay = fromDay;

    if (multiplierUntilDay > 1) {
      newFromDay = maxRangeDays * (multiplierUntilDay - 1) + fromDay;
    }

    if (newUntilDay <= newFromDay) {
      newUntilDay = newFromDay + maxRangeDays;
    }

    const { start, end } = this.appointmentService.getPeriodFromPeriodOfDay(integration, {
      periodOfDay: availableSchedules.periodOfDay,
      limit: availableSchedules.limit,
      sortMethod: availableSchedules.sortMethod,
      randomize: availableSchedules.randomize,
      period: availableSchedules.period,
    });

    let payload;

    if (integration.rules.useClinuxApiV2) {
      payload = {
        startTime: moment()
          .add(newFromDay, 'days')
          .startOf('day')
          .format('YYYY-MM-DD')
          .concat(' ' + start),
        endTime: moment()
          .add(newUntilDay, 'days')
          .startOf('day')
          .format('YYYY-MM-DD')
          .concat(' ' + end),
        provider: (doctor?.code ?? 0).toString(),
        patient: patient.code,
        procedure: procedure.code,
        modality: procedure.specialityCode,
        site: '0',
        covenant: insurance.code,
      } as ClinuxListAvailableSchedulesParamsRequestV2;
    } else {
      const js_exame: ClinuxScheduleJsExame[] = [
        {
          cd_modalidade: Number(procedure.specialityCode),
          cd_procedimento: Number(procedure.code),
          ds_procedimento: procedure.name,
          cd_plano: Number(insurance.code),
          cd_subplano: Number(insurancePlan?.code ?? 0),
          cd_medico: Number(doctor?.code ?? 0),
          cd_empresa: Number(organizationUnit?.code ?? 0),
          nr_tempo: procedureData?.nr_tempo ?? null,
          nr_valor: procedureData.nr_valor ?? 0,
          sn_especial: procedureData?.sn_especial,
          sn_preparo: procedureData?.sn_preparo,
          nr_quantidade: 1,
          nr_tempo_total: procedureData?.nr_tempo_total,
        },
      ];

      payload = {
        js_exame: Buffer.from(JSON.stringify(js_exame)).toString('base64'),
        sn_consulta: appointmentType.code === 'C', // para exame é false,
        cd_paciente: Number(patient.code),
        cd_empresa: Number(organizationUnit?.code ?? 0),
        dt_hora_fim: end,
        dt_hora: start,
        dt_data: moment().add(newFromDay, 'days').startOf('day').format(dateFormat),
        cd_plano: Number(insurance.code),
      } as ClinuxListAvailableSchedulesParamsRequest;
    }

    return payload;
  }

  async getAvailableSchedules(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
    retryifEmptyCount = 1,
    appointmentsStack = [],
  ): Promise<ListAvailableSchedulesResponse> {
    try {
      const {
        period,
        randomize,
        sortMethod = AppointmentSortMethod.default,
        filter,
        limit,
        periodOfDay,
      } = availableSchedules;

      const maxRangeDays = integration.rules?.limitOfDaysToSplitRequestInScheduleSearch || 12;
      const maxRangeResults = 12;
      const limitDaysToSearchSchedules = integration.rules?.limitUntilDaySearchAppointments || 90;

      const { procedure, insurancePlan, insurance, organizationUnit, appointmentType, doctor, speciality } = filter;

      const dateFormat = 'DD/MM/YYYY';

      const defaultScheduleData: Partial<RawAppointment> = {
        appointmentTypeId: appointmentType.code,
        insuranceId: insurance.code,
      };

      if (procedure?.code) {
        defaultScheduleData.procedureId = procedure.code;
      }

      if (speciality?.code) {
        defaultScheduleData.specialityId = speciality.code;
      }

      if (insurancePlan?.code) {
        defaultScheduleData.insurancePlanId = insurancePlan.code;
      }

      const payload: ClinuxListAvailableSchedulesParamsRequest | ClinuxListAvailableSchedulesParamsRequestV2 =
        await this.createListAvailableSchedulesObject(integration, availableSchedules, retryifEmptyCount);
      const payloadV1 = payload as ClinuxListAvailableSchedulesParamsRequest;

      if (insurancePlan?.code && !integration.rules.useClinuxApiV2) {
        payloadV1.cd_subplano = Number(insurancePlan.code);
      }

      let response: ClinuxListAvailableSchedulesResponseV2[] | ClinuxListAvailableSchedulesResponse[];

      if (integration.rules.useClinuxApiV2) {
        const payloadV2 = payload as ClinuxListAvailableSchedulesParamsRequestV2;
        response = (await this.clinuxApiService.listAvailableSchedulesV2(
          integration,
          payloadV2,
        )) as ClinuxListAvailableSchedulesResponseV2[];
      } else {
        response = (await this.clinuxApiService.listAvailableSchedules(
          integration,
          payloadV1,
        )) as ClinuxListAvailableSchedulesResponse[];
      }

      if (retryifEmptyCount > 20) {
        Sentry.captureEvent({
          message: `ERROR:${integration._id}:${integration.name}:CLINUX:getAvailableSchedules`,
          extra: {
            integrationId: integration._id,
            message: 'LOOP INFINITO',
          },
        });

        return { schedules: [], metadata: null };
      }

      const maxRequestsNumber = Math.floor(limitDaysToSearchSchedules / maxRangeDays);

      if (retryifEmptyCount >= maxRequestsNumber && !appointmentsStack.length) {
        return { schedules: [], metadata: null };
      }

      if (!response?.length && !appointmentsStack.length && retryifEmptyCount <= maxRequestsNumber) {
        retryifEmptyCount++;
        return await this.getAvailableSchedules(integration, availableSchedules, retryifEmptyCount, appointmentsStack);
      }

      const replacedAppointments: RawAppointment[] = [];

      // cria um array temporário para passar para o appointmentService aplicar
      // a lógica de randomização
      for await (const appointment of response) {
        if (integration.rules.useClinuxApiV2) {
          const appointmentV2 = appointment as ClinuxListAvailableSchedulesResponseV2;
          const startDateAndHour = moment(appointmentV2?.date, 'DD/MM/YYYY HH:mm');
          const endDateandHour = moment(appointmentV2.enddate, 'DD/MM/YYYY HH:mm');
          const duration = endDateandHour.diff(startDateAndHour, 'minutes').toString();

          const splitted = appointmentV2.date.split(' ');
          const appointmentDate = moment(splitted[0], dateFormat);

          const replacedAppointment: Appointment & { [key: string]: any } = {
            ...defaultScheduleData,
            appointmentCode: appointmentV2.id.toString(),
            appointmentDate: this.clinuxHelpersService.convertStartDate(appointmentDate.valueOf(), splitted[1]),
            duration: duration ?? '-1',
            doctorId: appointmentV2.provider ?? 0,
            organizationUnitId: appointmentV2.facility ?? 0,
            status: AppointmentStatus.scheduled,
          };

          replacedAppointments.push(replacedAppointment);
        } else {
          // cod pode vir vazio
          const appointmentV1 = appointment as ClinuxListAvailableSchedulesResponse;
          if (appointmentV1.cod) {
            const appointmentDate = moment(appointmentV1.dia, dateFormat);

            const replacedAppointment: Appointment & { [key: string]: any } = {
              ...defaultScheduleData,
              appointmentCode: appointmentV1.cod,
              appointmentDate: this.clinuxHelpersService.convertStartDate(
                appointmentDate.valueOf(),
                appointmentV1.hora,
              ),
              duration: '0',
              doctorId: doctor?.code ?? 0,
              organizationUnitId: organizationUnit?.code ?? 0,
              status: AppointmentStatus.scheduled,
            };

            replacedAppointments.push(replacedAppointment);
          }
        }
      }

      const appointmentsFiltered = this.appointmentService.filterPeriodOfDay(
        integration,
        {
          limit: 500,
          period,
          periodOfDay,
          randomize: false,
          sortMethod: AppointmentSortMethod.default,
        },
        replacedAppointments,
      );

      appointmentsStack = [...appointmentsStack.concat(appointmentsFiltered)];

      // se possuir menos horarios, faz uma nova busca.
      if (appointmentsStack?.length < maxRangeResults && retryifEmptyCount <= maxRequestsNumber) {
        retryifEmptyCount++;
        return await this.getAvailableSchedules(integration, availableSchedules, retryifEmptyCount, appointmentsStack);
      }

      const { appointments: randomizedAppointments, metadata: partialMetadata } =
        await this.appointmentService.getAppointments(
          integration,
          {
            limit,
            period,
            randomize,
            sortMethod,
            periodOfDay,
          },
          appointmentsStack,
        );

      const validSchedules = await this.appointmentService.transformSchedules(integration, randomizedAppointments);
      return { schedules: validSchedules, metadata: { ...partialMetadata } };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinuxService.getAvailableSchedules', error);
    }
  }

  public async getScheduleValue(
    integration: IntegrationDocument,
    appointmentValue: GetScheduleValue,
  ): Promise<AppointmentValue> {
    const { insurance, procedure } = appointmentValue;

    const payload: ClinuxProcedureValueParamsRequest = {
      cd_plano: Number(insurance.code),
      cd_procedimento: Number(procedure.code),
    };

    try {
      const procedureValue = await this.clinuxApiService.getProcedureValue(integration, payload);

      if (!procedureValue?.[0]) {
        return null;
      }

      return {
        currency: 'R$',
        value: formatCurrency(procedureValue[0].nr_vl_particular),
      };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinuxService.getScheduleValue', error);
    }
  }

  public async getEntityList(
    integration: IntegrationDocument,
    rawFilter: CorrelationFilter,
    targetEntity: EntityType,
    cache?: boolean,
  ): Promise<EntityDocument[]> {
    switch (targetEntity) {
      case EntityType.appointmentType:
        return await this.listValidApiAppointmentTypes(integration, cache);

      case EntityType.speciality:
        return await this.listValidApiSpecialities(integration, rawFilter, cache);

      case EntityType.doctor:
        return await this.listValidApiDoctors(integration, rawFilter, cache);

      case EntityType.organizationUnit:
        return await this.listValidApiOrganizationUnits(integration, rawFilter, cache);

      case EntityType.insurance:
        return await this.listValidApiInsurances(integration, rawFilter, cache);

      case EntityType.procedure:
        return await this.listValidApiProcedures(integration, rawFilter, cache);

      case EntityType.insurancePlan:
        return await this.listValidApiInsurancePlans(integration, rawFilter, cache);

      case EntityType.occupationArea:
        return await this.listValidOccupationArea(integration);

      case EntityType.organizationUnitLocation:
        return await this.listValidOrganizationUnitLocation(integration);

      default:
        return [] as EntityDocument[];
    }
  }

  private getResourceFilters(
    integration: IntegrationDocument,
    targetEntity: EntityType,
    filters: EntityFilters,
  ): RequestParams {
    if (!filters || Object.keys(filters).length === 0) {
      return {};
    }

    const params: RequestParams = {};

    if (filters.hasOwnProperty(EntityType.organizationUnit)) {
      params.cd_empresa = filters[EntityType.organizationUnit].code;
    }

    if (filters.hasOwnProperty(EntityType.insurance)) {
      params.cd_plano = filters[EntityType.insurance].code;
    }

    if (filters.hasOwnProperty(EntityType.speciality)) {
      if (targetEntity === EntityType.procedure) {
        params.cd_modalidade = filters[EntityType.speciality].code;
      }
    }

    if (targetEntity === EntityType.procedure && filters.appointmentType.code) {
      params.sn_laudo =
        (filters.appointmentType as IAppointmentTypeEntity)?.params.referenceScheduleType === ScheduleType.Consultation;
    }

    // Filters para Vida VG
    if (integration.rules.useClinuxApiV2) {
      if (targetEntity === EntityType.insurance) {
        // se for Consulta, empresa 0
        const organizationCode =
          (filters.appointmentType as IAppointmentTypeEntity)?.params.referenceScheduleType ===
          ScheduleType.Consultation
            ? 0
            : 1;

        params.cd_empresa = filters[EntityType.organizationUnit]?.code || organizationCode;
        params.cd_procedimento = filters[EntityType.procedure]?.code;
        params.cd_modalidade = filters[EntityType.speciality]?.code;

        if (
          (filters.appointmentType as IAppointmentTypeEntity)?.params.referenceScheduleType ===
          ScheduleType.Consultation
        ) {
          params.cd_medico = filters[EntityType.doctor]?.code;
          params.cd_procedimento = undefined;
        }
      }

      if (
        targetEntity === EntityType.doctor &&
        (filters.appointmentType as IAppointmentTypeEntity)?.params.referenceScheduleType === ScheduleType.Consultation
      ) {
        params.cd_laudo = 1;
        params.cd_procedimento = filters[EntityType.procedure]?.code;
        params.cd_modalidade = filters[EntityType.speciality]?.code;
      }
    } else {
      // Filters para Unineuro
      if (targetEntity === EntityType.doctor) {
        params.cd_modalidade = filters[EntityType.speciality]?.code;
        params.cd_procedimento = filters[EntityType.procedure]?.code;
        params.cd_empresa = filters[EntityType.organizationUnit]?.code || 0;
        params.cd_subplano = 0;
        params.cd_laudo = -1;
      }
    }

    return params;
  }

  public async extractEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    rawFilters?: CorrelationFilter,
    cache?: boolean,
  ): Promise<EntityTypes[]> {
    const requestFilters = this.getResourceFilters(integration, entityType, rawFilters);

    if (cache) {
      const resourceCache = await this.integrationCacheUtilsService.getCachedEntitiesFromRequest(
        entityType,
        integration,
        requestFilters,
      );

      if (resourceCache) {
        return resourceCache;
      }
    }

    const getResource = () => {
      switch (entityType) {
        case EntityType.organizationUnit:
          return this.listOrganizationUnits(integration, requestFilters);

        case EntityType.insurance:
          return this.listInsurances(integration, requestFilters as ClinuxInsurancesParamsRequest);

        case EntityType.insurancePlan:
          return this.listInsurancePlans(integration, requestFilters as ClinuxInsurancePlansParamsRequest);

        case EntityType.speciality:
          return this.listSpecialities(integration, requestFilters as ClinuxSpecialitiesParamsRequest, rawFilters);

        case EntityType.appointmentType:
          return this.listAppointmentTypes(integration);

        case EntityType.typeOfService:
          return this.getTypeOfServices(integration);

        case EntityType.procedure:
          return this.listProcedures(integration, requestFilters as ClinuxProceduresParamsRequest, rawFilters);

        case EntityType.doctor:
          return this.listDoctors(integration, requestFilters as ClinuxDoctorsParamsRequest);

        default:
          return [];
      }
    };

    const resource: EntityTypes[] = await getResource();
    if (cache && resource?.length) {
      await this.integrationCacheUtilsService.setCachedEntitiesFromRequest(
        entityType,
        integration,
        requestFilters,
        resource,
        getExpirationByEntity(entityType),
      );
    }
    return resource;
  }

  private async listSpecialities(
    integration: IntegrationDocument,
    requestFilters: ClinuxSpecialitiesParamsRequest,
    filters: CorrelationFilter,
  ): Promise<ISpecialityEntity[]> {
    try {
      const formatEntity = (resource: ClinuxSpecialitiesResponse, appointmentTypeCode: string) => {
        const entity: ISpecialityEntity = {
          code: String(resource.cd_modalidade),
          integrationId: castObjectId(integration._id),
          name: String(resource.ds_modalidade)?.trim(),
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
          specialityType: appointmentTypeCode || '-1',
        };

        return entity;
      };

      const procedureData = await this.listProcedures(
        integration,
        requestFilters as ClinuxProceduresParamsRequest,
        filters,
      );

      const specialitiesData = await this.clinuxApiService.getSpecialities(integration, requestFilters);

      if (filters?.appointmentType?.params.referenceScheduleType) {
        return (
          specialitiesData.map((resource) => {
            const procedureEntity = procedureData.find(
              (singleProcedure) =>
                Number(singleProcedure.specialityCode) === resource.cd_modalidade &&
                singleProcedure.specialityType === filters?.appointmentType?.params.referenceScheduleType,
            );
            return formatEntity(resource, procedureEntity?.specialityType);
          }) || []
        );
      }

      return (
        specialitiesData.map((resource) => {
          const procedureEntity = procedureData.find(
            (singleProcedure) => Number(singleProcedure.specialityCode) === resource.cd_modalidade,
          );
          return formatEntity(resource, procedureEntity?.specialityType);
        }) || []
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinuxService.listSpecialities', error);
    }
  }

  public async listDoctors(
    integration: IntegrationDocument,
    requestFilters: ClinuxDoctorsParamsRequest,
  ): Promise<IDoctorEntity[]> {
    try {
      const data = await this.clinuxApiService.getDoctors(integration, requestFilters);
      const entities = data?.map((resource) => {
        const entity: IDoctorEntity = {
          code: String(resource.cd_medico),
          name: resource.ds_medico,
          ...this.getDefaultErpEntityData(integration),
          data: {
            crm: resource.ds_crm_nr,
          },
        };

        return entity;
      });
      return entities ?? [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinuxService.listDoctors', error);
    }
  }

  private async listProcedures(
    integration: IntegrationDocument,
    requestFilters: ClinuxProceduresParamsRequest,
    filters: CorrelationFilter,
  ): Promise<IProcedureEntity[]> {
    try {
      const formatEntity = (resource: ClinuxProceduresResponse, appointmentTypeCode: string) => {
        const entity: IProcedureEntity = {
          code: String(resource.cd_procedimento),
          integrationId: castObjectId(integration._id),
          name: String(resource.ds_procedimento)?.trim(),
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
          specialityCode: String(resource.cd_modalidade),
          specialityType: appointmentTypeCode || '-1',
          data: {
            sn_especial: resource.sn_especial,
            sn_preparo: resource.sn_preparo,
            nr_tempo: resource.nr_tempo,
          },
        };

        return entity;
      };

      if (filters?.appointmentType?.params.referenceScheduleType) {
        const resource = await this.clinuxApiService.getProcedures(integration, requestFilters);

        return resource.map((clinuxProcedure) =>
          formatEntity(clinuxProcedure, filters.appointmentType?.params.referenceScheduleType),
        );
      }

      let allProceduresFormated = [];

      const consultationProcedures: ClinuxProceduresResponse[] = await this.clinuxApiService.getProcedures(
        integration,
        {
          ...requestFilters,
          sn_laudo: true,
        } as ClinuxProceduresParamsRequest,
      );
      allProceduresFormated = [
        ...allProceduresFormated.concat(
          consultationProcedures.map((clinuxProcedure) => formatEntity(clinuxProcedure, ScheduleType.Consultation)),
        ),
      ];

      const examProcedures: ClinuxProceduresResponse[] = await this.clinuxApiService.getProcedures(integration, {
        ...requestFilters,
        sn_laudo: false,
      } as ClinuxProceduresParamsRequest);
      allProceduresFormated = [
        ...allProceduresFormated.concat(
          examProcedures.map((clinuxProcedure) => formatEntity(clinuxProcedure, ScheduleType.Exam)),
        ),
      ];

      return allProceduresFormated;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinuxService.listProcedures', error);
    }
  }

  private async listInsurancePlans(
    integration: IntegrationDocument,
    requestFilters: ClinuxInsurancePlansParamsRequest,
  ): Promise<IInsurancePlanEntity[]> {
    try {
      // se possui filtro ja filtra na request o convenio
      if (requestFilters.cd_plano) {
        const data = await this.clinuxApiService.getInsurancePlans(integration, requestFilters);
        const entities = data?.map((resource) => {
          const entity: IInsurancePlanEntity = {
            code: String(resource.cd_subplano),
            integrationId: castObjectId(integration._id),
            name: String(resource.ds_subplano),
            source: EntitySourceType.erp,
            activeErp: true,
            version: EntityVersionType.production,
            insuranceCode: String(requestFilters.cd_plano),
          };

          return entity;
        });

        return entities ?? [];
      }
      // aqui é no caso da importação de dados que preciso vincular o convenio ao plano
      const insurances = await this.clinuxApiService.getInsurances(integration);

      if (!insurances.length) {
        return [];
      }

      const entities: IInsurancePlanEntity[] = [];

      for await (const insurance of insurances) {
        requestFilters.cd_plano = insurance.cd_plano;
        const insurancePlans = await this.clinuxApiService.getInsurancePlans(integration, requestFilters);

        if (insurancePlans.length) {
          for await (const insurancePlan of insurancePlans) {
            const entity: IInsurancePlanEntity = {
              code: String(insurancePlan.cd_subplano),
              integrationId: castObjectId(integration._id),
              name: String(insurancePlan.ds_subplano),
              source: EntitySourceType.erp,
              activeErp: true,
              version: EntityVersionType.production,
              insuranceCode: String(insurance.cd_plano),
            };

            entities.push(entity);
          }
        }
      }

      return entities;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinuxService.listInsurancePlans', error);
    }
  }

  private async listInsurances(
    integration: IntegrationDocument,
    requestFilters: ClinuxInsurancesParamsRequest,
  ): Promise<IInsuranceEntity[]> {
    try {
      const data = await this.clinuxApiService.getInsurances(integration, requestFilters);
      const entities = data?.map((resource) => {
        const entity: IInsuranceEntity = {
          code: String(resource.cd_plano),
          integrationId: castObjectId(integration._id),
          name: String(resource.ds_plano),
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
        };

        return entity;
      });

      return entities ?? [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinuxService.listInsurances', error);
    }
  }

  private async getTypeOfServices(integration: IntegrationDocument): Promise<ITypeOfServiceEntity[]> {
    try {
      return (
        defaultTypesOfService?.map((resource) => ({
          code: resource.code,
          integrationId: castObjectId(integration._id),
          name: resource.name?.trim(),
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
          params: {
            ...resource.params,
          },
        })) || []
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinuxService.getTypeOfServices', error);
    }
  }

  private async listAppointmentTypes(integration: IntegrationDocument): Promise<IAppointmentTypeEntity[]> {
    try {
      return defaultAppointmentTypes.map((resource) => {
        const entity: IAppointmentTypeEntity = {
          code: resource.code,
          integrationId: castObjectId(integration._id),
          name: resource.name,
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
          params: {
            ...resource.params,
          },
        };

        return entity;
      });
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinuxService.listAppointmentTypes', error);
    }
  }

  private async listOrganizationUnits(
    integration: IntegrationDocument,
    requestFilters: ClinuxOrganizationsParamsRequest,
  ): Promise<IOrganizationUnitEntity[]> {
    try {
      const data = await this.clinuxApiService.getOrganizationUnits(integration, requestFilters);
      const entities = data?.map((resource) => {
        const entity: IOrganizationUnitEntity = {
          code: String(resource.cd_empresa),
          integrationId: castObjectId(integration._id),
          name: resource.ds_empresa?.trim(),
          source: EntitySourceType.erp,
          version: EntityVersionType.production,
          activeErp: true,
          data: {
            address: resource.ds_endereco?.trim(),
          },
        };

        return entity;
      });

      return entities || [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinuxService.listOrganizationUnits', error);
    }
  }

  private async listValidApiOrganizationUnits(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<OrganizationUnitEntityDocument[]> {
    try {
      const data = await this.extractEntity(integration, EntityType.organizationUnit, filters, cache);
      const codes = data?.map((organization) => organization.code);

      const cachedEntities = await this.integrationCacheUtilsService.getProcessedEntities(
        integration,
        EntityType.organizationUnit,
        codes,
      );

      if (cachedEntities) {
        return cachedEntities as OrganizationUnitEntityDocument[];
      }

      const entities = await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.organizationUnit,
      );

      await this.integrationCacheUtilsService.setProcessedEntities(
        integration,
        EntityType.organizationUnit,
        entities,
        codes,
      );
      return entities as OrganizationUnitEntityDocument[];
    } catch (error) {
      throw error;
    }
  }

  private async listValidApiAppointmentTypes(
    integration: IntegrationDocument,
    cache?: boolean,
  ): Promise<AppointmentTypeEntityDocument[]> {
    try {
      const data = await this.extractEntity(integration, EntityType.appointmentType, undefined, cache);
      const codes = data?.map((appointmenType) => appointmenType.code);

      const cachedEntities = await this.integrationCacheUtilsService.getProcessedEntities(
        integration,
        EntityType.appointmentType,
        codes,
      );

      if (cachedEntities) {
        return cachedEntities as AppointmentTypeEntityDocument[];
      }

      const entities = await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.appointmentType,
      );

      await this.integrationCacheUtilsService.setProcessedEntities(
        integration,
        EntityType.appointmentType,
        entities,
        codes,
      );
      return entities as AppointmentTypeEntityDocument[];
    } catch (error) {
      throw error;
    }
  }

  private async listValidApiInsurances(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<InsuranceEntityDocument[]> {
    try {
      const data = (await this.extractEntity(integration, EntityType.insurance, filters, cache)) as IInsuranceEntity[];
      const codes = data?.map((insurance) => insurance.code);

      const cachedEntities = await this.integrationCacheUtilsService.getProcessedEntities(
        integration,
        EntityType.insurance,
        codes,
      );

      if (cachedEntities) {
        return cachedEntities as InsuranceEntityDocument[];
      }

      const entities = await this.entitiesService.getValidEntitiesbyCode(integration._id, codes, EntityType.insurance);

      await this.integrationCacheUtilsService.setProcessedEntities(integration, EntityType.insurance, entities, codes);
      return entities as InsuranceEntityDocument[];
    } catch (error) {
      throw error;
    }
  }

  private async listValidApiSpecialities(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<SpecialityEntityDocument[]> {
    try {
      const data = (await this.extractEntity(
        integration,
        EntityType.speciality,
        filters,
        cache,
      )) as ISpecialityEntity[];
      const codes = data?.map((speciality) => speciality.code);

      const cachedEntities = await this.integrationCacheUtilsService.getProcessedEntities(
        integration,
        EntityType.speciality,
        codes,
      );

      if (cachedEntities) {
        return cachedEntities as SpecialityEntityDocument[];
      }

      const entities = await this.entitiesService.getValidEntitiesbyCode(integration._id, codes, EntityType.speciality);

      await this.integrationCacheUtilsService.setProcessedEntities(integration, EntityType.insurance, entities, codes);
      return entities as SpecialityEntityDocument[];
    } catch (error) {
      throw error;
    }
  }

  private async listValidApiDoctors(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<DoctorEntityDocument[]> {
    try {
      const data = (await this.extractEntity(integration, EntityType.doctor, filters, cache)) as IDoctorEntity[];
      const codes = data?.map((doctor) => doctor.code);

      const cachedEntities = await this.integrationCacheUtilsService.getProcessedEntities(
        integration,
        EntityType.doctor,
        codes,
      );

      if (cachedEntities) {
        return cachedEntities as DoctorEntityDocument[];
      }

      const entities = await this.entitiesService.getValidEntitiesbyCode(integration._id, codes, EntityType.doctor);

      await this.integrationCacheUtilsService.setProcessedEntities(integration, EntityType.doctor, entities, codes);
      return entities as DoctorEntityDocument[];
    } catch (error) {
      throw error;
    }
  }

  private async listValidApiProcedures(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<ProcedureEntityDocument[]> {
    try {
      const data = (await this.extractEntity(integration, EntityType.procedure, filters, cache)) as IProcedureEntity[];
      const codes = data?.map((procedure) => procedure.code);

      const cachedEntities = await this.integrationCacheUtilsService.getProcessedEntities(
        integration,
        EntityType.insurance,
        codes,
      );

      if (cachedEntities) {
        return cachedEntities as ProcedureEntityDocument[];
      }

      const entities = await this.entitiesService.getValidEntitiesbyCode(integration._id, codes, EntityType.procedure);

      await this.integrationCacheUtilsService.setProcessedEntities(integration, EntityType.procedure, entities, codes);
      return entities as ProcedureEntityDocument[];
    } catch (error) {
      throw error;
    }
  }

  private async listValidApiInsurancePlans(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<InsurancePlanEntityDocument[]> {
    try {
      const data = (await this.extractEntity(
        integration,
        EntityType.insurancePlan,
        filters,
        cache,
      )) as InsurancePlanEntityDocument[];
      const codes = data?.map((insurancePlan) => insurancePlan.code);

      const cachedEntities = await this.integrationCacheUtilsService.getProcessedEntities(
        integration,
        EntityType.insurance,
        codes,
      );

      if (cachedEntities) {
        return cachedEntities as InsurancePlanEntityDocument[];
      }

      const entities = await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.insurancePlan,
      );

      await this.integrationCacheUtilsService.setProcessedEntities(
        integration,
        EntityType.insurancePlan,
        entities,
        codes,
      );
      return entities as InsurancePlanEntityDocument[];
    } catch (error) {
      throw error;
    }
  }

  private async listValidOccupationArea(integration: IntegrationDocument) {
    const cachedEntities = await this.integrationCacheUtilsService.getProcessedEntities(
      integration,
      EntityType.occupationArea,
    );

    if (cachedEntities) {
      return cachedEntities as OccupationAreaEntityDocument[];
    }

    const entities = await this.entitiesService.getValidEntities(EntityType.occupationArea, integration._id);

    await this.integrationCacheUtilsService.setProcessedEntities(integration, EntityType.occupationArea, entities);
    return entities as OccupationAreaEntityDocument[];
  }

  private async listValidOrganizationUnitLocation(integration: IntegrationDocument) {
    const cachedEntities = await this.integrationCacheUtilsService.getProcessedEntities(
      integration,
      EntityType.organizationUnitLocation,
    );

    if (cachedEntities) {
      return cachedEntities as OrganizationUnitLocationEntityDocument[];
    }

    const entities = await this.entitiesService.getValidEntities(EntityType.organizationUnitLocation, integration._id);

    await this.integrationCacheUtilsService.setProcessedEntities(
      integration,
      EntityType.organizationUnitLocation,
      entities,
    );
    return entities as OrganizationUnitLocationEntityDocument[];
  }

  async getMinifiedPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<MinifiedAppointments> {
    const { patientCode } = patientSchedules;
    const minifiedSchedules: MinifiedAppointments = {
      appointmentList: [],
      lastAppointment: null,
      nextAppointment: null,
    };

    try {
      const data: ClinuxListPatientSchedulesResponse[] = await this.clinuxApiService.listPatientSchedules(integration, {
        cd_paciente: Number(patientCode),
      });

      if (!data?.length) {
        await this.integrationCacheUtilsService.setPatientSchedulesCache(integration, patientCode, {
          minifiedSchedules,
          schedules: [],
        });

        return minifiedSchedules;
      }

      const schedules: Appointment[] = await Promise.all(
        data
          .filter((schedule) => schedule.ds_status !== 'CANCELADO')
          .map(async (schedule) => {
            const patientAppointment = await this.clinuxHelpersService.createPatientAppointmentObject(
              integration,
              schedule,
              patientSchedules,
            );
            const [appointment] = await this.appointmentService.transformSchedules(integration, [patientAppointment]);

            const flowSteps = [FlowSteps.listPatientSchedules];

            if (patientSchedules.target) {
              flowSteps.push(patientSchedules.target);
            }

            const flowActions = await this.flowService.matchFlowsAndGetActions({
              integrationId: integration._id,
              targetFlowTypes: flowSteps,
              entitiesFilter: {
                appointmentType: appointment.appointmentType,
                doctor: appointment.doctor,
                insurance: appointment.insurance,
                insurancePlan: appointment.insurancePlan,
                insuranceSubPlan: appointment.insuranceSubPlan,
                organizationUnit: appointment.organizationUnit,
                planCategory: appointment.planCategory,
                procedure: appointment.procedure,
                speciality: appointment.speciality,
                occupationArea: appointment.occupationArea,
                organizationUnitLocation: appointment.organizationUnitLocation,
                typeOfService: appointment.typeOfService,
              },
            });

            minifiedSchedules.appointmentList.push(pick(patientAppointment, ['appointmentDate', 'appointmentCode']));

            return {
              ...appointment,
              actions: flowActions,
            };
          }),
      );

      orderBy(schedules, 'appointmentDate', 'asc').forEach((schedule) => {
        if (moment(schedule.appointmentDate).valueOf() > moment().valueOf() && !minifiedSchedules.nextAppointment) {
          minifiedSchedules.nextAppointment = schedule;
        } else if (moment(schedule.appointmentDate).valueOf() <= moment().valueOf()) {
          minifiedSchedules.lastAppointment = schedule;
        }
      });

      await this.integrationCacheUtilsService.setPatientSchedulesCache(integration, patientCode, {
        minifiedSchedules,
        schedules,
      });

      return minifiedSchedules;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinuxService.getMinifiedPatientSchedules', error);
    }
  }

  async getMultipleEntitiesByFilter(
    integration: IntegrationDocument,
    filter: CorrelationFilterByKey,
  ): Promise<CorrelationFilter> {
    return await this.entitiesService.createCorrelationFilterData(filter, 'code', integration._id);
  }

  async getPatient(integration: IntegrationDocument, filters: PatientFilters): Promise<Patient> {
    try {
      const patientCache = await this.integrationCacheUtilsService.getPatientFromCache(
        integration,
        filters.code,
        filters.cpf,
      );

      if (patientCache && filters.cache) {
        return patientCache;
      }

      let response: ClinuxGetPatientResponse[] = [];

      if (filters.code) {
        response = await this.clinuxApiService.getPatient(integration, { cd_paciente: filters.code });
      } else if (filters.cpf) {
        response = await this.clinuxApiService.getPatient(integration, { ds_cpf: filters.cpf });
      }

      // Clinux permite salvar mais de um paciente com o mesmo CPF.
      // caso tenha mais de um, pega aquele que tem a combinação de CPF e Data de nascimento
      if (response?.length > 1) {
        response = response.filter(
          (patient) =>
            patient.ds_cpf === filters.cpf &&
            moment.utc(patient?.dt_nascimento, 'DD/MM/YYYY').startOf('day').valueOf() ===
              moment.utc(filters.bornDate).startOf('day').valueOf(),
        );
      }

      if (!response?.[0]) {
        return undefined;
      }

      const patient = this.clinuxHelpersService.replaceClinuxPatientToPatient(response[0]);

      if (!patient) {
        return undefined;
      }

      if (!patient.cpf && filters.cpf) {
        patient.cpf = filters.cpf;
      }

      await this.integrationCacheUtilsService.setPatientCache(integration, patient.code, patient.cpf, patient);
      return patient;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinuxService.getPatient', error);
    }
  }

  async getPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<Appointment[]> {
    const { patientCode, startDate, endDate } = patientSchedules;
    patientSchedules.returnGuidance = true;

    try {
      let patientSchedulesResponse: ClinuxListPatientSchedulesResponse[] =
        await this.clinuxApiService.listPatientSchedules(integration, {
          cd_paciente: Number(patientCode),
        });

      // incluindo agendamentos passados/concluidos Clinux
      // não processado pelo bot startDate = dia de hoje - bot exibe apenas datas futuras
      const isAllPatientSchedules = moment(startDate).format('YYYY-MM-DD HH:mm') < moment().format('YYYY-MM-DD HH:mm');

      if (isAllPatientSchedules) {
        const patientAttendancesResponse: ClinuxListPatientAttendanceParamsResponse[] =
          await this.clinuxApiService.listPatientAttendances(integration, {
            cd_paciente: Number(patientCode),
          });

        const attendancesWithinDate = patientAttendancesResponse.filter(
          (attendance) => startDate <= moment(attendance.dt_data, 'DD/MM/YYYY').valueOf(),
        );

        for (const attendance of attendancesWithinDate) {
          // Evita atendimentos repetidos
          // Um atendimento pode ter N documentos com mesmo código de atendimento
          if (!patientSchedulesResponse.some((schedule) => schedule.cd_atendimento === attendance.cd_atendimento)) {
            const procedureEntity = (await this.entitiesService.getEntitiesByTargetAndName(
              integration._id,
              EntityType.procedure,
              [attendance.ds_procedimento],
              undefined,
              { specialityCode: attendance.cd_modalidade },
            )) as ProcedureEntityDocument[];

            const attendanceAppointment: ClinuxListPatientSchedulesResponse = {
              cd_atendimento: attendance.cd_atendimento,
              cd_modalidade: attendance.cd_modalidade,
              cd_paciente: attendance.cd_paciente,
              cd_procedimento: procedureEntity[0] ? procedureEntity[0].code : '0',
              ds_empresa: null,
              ds_modalidade: attendance.ds_modalidade,
              ds_paciente: attendance.ds_paciente,
              ds_status: null,
              dt_data: attendance.dt_data,
              dt_hora: '00:00 - 00:00',
              dt_hora_chegada: null,
            };

            patientSchedulesResponse.push(attendanceAppointment);
          }
        }
      }

      if (!patientSchedulesResponse?.length) {
        return [];
      }

      patientSchedulesResponse.sort((a, b) => moment(a.dt_data, 'DD/MM/YYYY').diff(moment(b.dt_data, 'DD/MM/YYYY')));

      const rawAppointments: RawAppointment[] = await Promise.all(
        patientSchedulesResponse
          .filter((schedule) => schedule.ds_status !== 'CANCELADO')
          .map(async (schedule) => {
            const createdPatientObject = await this.clinuxHelpersService.createPatientAppointmentObject(
              integration,
              schedule,
              patientSchedules,
            );

            return createdPatientObject;
          }),
      );

      let rawAppointmentsValidDates = rawAppointments;

      if (!isAllPatientSchedules) {
        rawAppointmentsValidDates = rawAppointments.filter(
          (appointment) => moment(appointment.appointmentDate).utc().valueOf() >= moment().utc().valueOf(),
        );
      }

      if (endDate) {
        rawAppointmentsValidDates = rawAppointmentsValidDates.filter(
          (appointment) => moment(appointment.appointmentDate).utc().valueOf() <= moment(endDate).utc().valueOf(),
        );
      }

      return await this.appointmentService.transformSchedules(integration, rawAppointmentsValidDates, false);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinuxService.getPatientSchedules', error);
    }
  }

  async getStatus(integration: IntegrationDocument): Promise<OkResponse> {
    try {
      const organizationUnits = await this.clinuxApiService.getOrganizationUnits(integration, null, true);

      if (organizationUnits?.length) {
        return { ok: true };
      }

      const insurances = await this.clinuxApiService.getInsurances(integration, {});

      if (insurances?.length) {
        return { ok: true };
      }

      return { ok: false };
    } catch (error) {
      throw error;
    }
  }

  async reschedule(integration: IntegrationDocument, reschedule: Reschedule): Promise<Appointment> {
    const { scheduleToCancelCode, scheduleToCreate, patient } = reschedule;

    try {
      // busca agendamentos do paciente para pegar dados de qual será cancelado
      const patientAppointments = await this.getPatientSchedules(integration, { patientCode: patient.code });
      const appointmentToCancel = patientAppointments.find(
        (appointment) => appointment.appointmentCode == scheduleToCancelCode,
      );

      if (!appointmentToCancel) {
        throw INTERNAL_ERROR_THROWER('ClinuxService.reschedule', {
          message: 'Invalid appointment code to cancel',
        });
      }

      // Cria novo agendamento enquanto o anterior permanece ativo
      const createdAppointment = await this.createSchedule(integration, scheduleToCreate);

      if (!createdAppointment.appointmentCode) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          {
            message: 'ClinuxService.reschedule: error creating new schedule',
          },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      const { procedure, appointmentCode } = appointmentToCancel;

      // após criar novo agendamento, cancela o anterior
      const canceledOldAppointment = await this.cancelSchedule(integration, {
        appointmentCode,
        patientCode: patient.code,
        procedure: {
          code: procedure.code,
          specialityCode: procedure.specialityCode,
          specialityType: procedure.specialityType,
        },
      });

      // caso o cancelamento do agendamento anterior falhe, cancela o que foi gerado no inicio do fluxo
      if (!canceledOldAppointment.ok) {
        const { appointmentCode, procedure } = createdAppointment;

        await this.cancelSchedule(integration, {
          appointmentCode,
          patientCode: patient.code,
          procedure: {
            code: procedure.code,
            specialityCode: procedure.specialityCode,
            specialityType: procedure.specialityType,
          },
        });

        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          {
            message: 'Error on cancel old appointment',
          },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      return createdAppointment;
    } catch (error) {
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, error, HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  public async updatePatient(
    integration: IntegrationDocument,
    patientCode: string,
    { patient }: UpdatePatient,
  ): Promise<Patient> {
    try {
      const clinuxPatient = this.clinuxHelpersService.replacePatientToClinuxPatient(patient);

      const payload: ClinuxUpdatePatientParamsRequest = {
        cd_operacao: 3,
        cd_paciente: Number(patientCode),
        js_paciente: Buffer.from(JSON.stringify(clinuxPatient)).toString('base64'),
      };

      const data = await this.clinuxApiService.updatePatient(integration, payload);

      if (data?.[0].Sucesso) {
        await this.integrationCacheUtilsService.removePatientFromCache(integration, patientCode, patient.cpf);
        return await this.getPatient(integration, { code: patientCode, cpf: patient.cpf });
      }

      return null;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinuxService.updatePatient', error);
    }
  }

  public async matchFlowsConfirmation(
    integration: IntegrationDocument,
    data: MatchFlowsConfirmation,
  ): Promise<FlowAction<FlowActionElement>[]> {
    return await this.confirmationService.matchFlowsConfirmation(integration, data);
  }

  public async listSchedulesToConfirm(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2,
  ): Promise<ConfirmationSchedule> {
    return await this.confirmationService.listSchedulesToConfirm(integration, data);
  }

  public async confirmationCancelSchedule(
    integration: IntegrationDocument,
    cancelSchedule: CancelScheduleV2,
  ): Promise<OkResponse> {
    return await this.confirmationService.cancelSchedule(integration, cancelSchedule);
  }

  public async confirmationConfirmSchedule(
    integration: IntegrationDocument,
    confirmSchedule: ConfirmScheduleV2,
  ): Promise<OkResponse> {
    return await this.confirmationService.confirmSchedule(integration, confirmSchedule);
  }

  public async getConfirmationScheduleGuidance(
    integration: IntegrationDocument,
    data: ConfirmationScheduleGuidance,
  ): Promise<ConfirmationScheduleGuidanceResponse> {
    return await this.confirmationService.getScheduleGuidance(integration, data);
  }

  public async hasAvailableMedicalReports(
    integration: IntegrationDocument,
    data: ListSchedules,
    filter: HasAvailableMedicalReportsFilterRequest,
  ): Promise<HasAvailableMedicalReportsFilterResponse> {
    const scheduleList: ClinuxListPatientAttendanceParamsResponse[] =
      await this.clinuxApiService.listPatientAttendances(integration, {
        cd_paciente: Number(data.patientErpCode),
      });

    // pega todos os laudos (internos e externos)
    const schedulesWithMedicalReport = scheduleList.filter(
      (schedule) => schedule.sn_assinado && String(schedule.cd_atendimento) === String(filter.scheduleCode),
    );

    if (schedulesWithMedicalReport.length > 0) {
      return { ok: true };
    }

    return { ok: false };
  }

  public async listAvailableMedicalReports(
    integration: IntegrationDocument,
    validPatient: ListAvailableMedicalReportsTokenData,
    filter: ListAvailableMedicalReportsFilterRequest,
  ): Promise<CountAvailableMedicalReportsResponse<ListAvailableMedicalReports>> {
    try {
      const scheduleList: ClinuxListPatientAttendanceParamsResponse[] =
        await this.clinuxApiService.listPatientAttendances(integration, {
          cd_paciente: Number(validPatient.patientCode || 0),
        });

      const internalExternalMedicalReports = [];

      // pega todos os laudos (internos e externos)
      const schedulesWithMedicalReport = scheduleList.filter((schedule) => schedule.sn_assinado);

      for (const schedule of schedulesWithMedicalReport) {
        const externalDocumentList = await this.clinuxApiService.getExternalResultsList(integration, {
          cd_exame: Number(schedule.cd_exame || 0),
        });

        // se for laudo externo
        if (externalDocumentList.length > 0) {
          const formatedExternalDocumentList = externalDocumentList.map((externalDocument) => {
            return {
              ...externalDocument,
              cd_atendimento: schedule.cd_atendimento,
              cd_exame: schedule.cd_exame,
              ds_paciente: schedule.ds_paciente,
              dt_data: schedule.dt_data,
              cd_modalidade: schedule.cd_modalidade,
              ds_modalidade: schedule.ds_modalidade,
              ds_medico: schedule.ds_medico,
              ds_procedimento: schedule.ds_procedimento,
              isExternal: true,
            };
          });

          // deve-se sempre baixar laudo interno E externo
          internalExternalMedicalReports.push(...formatedExternalDocumentList);
        }
        internalExternalMedicalReports.push({ ...schedule, isExternal: false });
      }

      let patientReportList: ListAvailableMedicalReports[] = [];

      for (const schedule of internalExternalMedicalReports) {
        const downloadMedicalReportLink = await this.schedulingDownloadReportService.createDownloadMedicalReportLink(
          castObjectIdToString(integration._id),
          validPatient.patientCode,
          validPatient.shortId,
          schedule.cd_atendimento,
          schedule.cd_laudo || schedule.nr_laudo,
          schedule.cd_exame,
          schedule.isExternal,
        );

        patientReportList.push({ link: downloadMedicalReportLink, scheduleCode: schedule.cd_atendimento });
      }

      if (filter.scheduleCode) {
        patientReportList = patientReportList.filter(
          (report) => String(report.scheduleCode) === String(filter.scheduleCode),
        );
      }

      return {
        count: patientReportList.length,
        data: patientReportList,
      };
    } catch (error) {
      if (error.message === 'invalid token') {
        throw HTTP_ERROR_THROWER(HttpStatus.UNAUTHORIZED, 'Invalid token', undefined, true);
      }
      throw INTERNAL_ERROR_THROWER('ClinuxService.updatePatient', error);
    }
  }

  public async validatePatientReportDownload(
    integration: IntegrationDocument,
    body: ValidPatientReportDownloadRequest,
  ): Promise<boolean> {
    const patientData = await this.getPatient(integration, { cpf: body.patientCpf, code: body.patientCode });

    if (!patientData) {
      throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
    }

    const patientDataBirthDate = moment(patientData?.bornDate, 'YYYY-MM-DD').format('YYYY-MM-DD');
    const dataBirthDate = moment(body?.patientBirthDate, 'DD/MM/YYYY').format('YYYY-MM-DD');
    const hasValidMotherName = Boolean(
      body?.patientMotherName && patientData?.motherName && body?.patientMotherName === patientData?.motherName,
    );

    const patientScheduleList: ClinuxListPatientAttendanceParamsResponse[] =
      await this.clinuxApiService.listPatientAttendances(integration, {
        cd_paciente: Number(patientData.code || 0),
      });

    const hasValidSchedule = body.protocolCode
      ? patientScheduleList.some((schedule) => Number(schedule.cd_atendimento) === Number(body.protocolCode))
      : false;

    if (body.patientCpf !== patientData.cpf || dataBirthDate !== patientDataBirthDate) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Patient Cpf or BornDate is a mismatch',
        undefined,
        true,
      );
    }

    if ((hasValidMotherName && hasValidSchedule) || hasValidSchedule) {
      return true;
    }

    throw HTTP_ERROR_THROWER(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Mothers Name or Schedule Code is a mismatch',
      undefined,
      true,
    );
  }

  public async downloadMedicalReport(
    integration: IntegrationDocument,
    data: DownloadMedicalReportTokenData,
  ): Promise<Buffer> {
    const paramError = {
      type: 'error',
      messages: {
        pt: 'Parâmetros ausentes',
      },
    };

    if (!data?.hasOwnProperty('isExternal')) {
      throw new BadRequestException(paramError);
    }

    if (data.isExternal) {
      if (!data?.medicalReportCode) {
        throw new BadRequestException(paramError);
      }

      const medReport = await this.clinuxApiService.getExternalResultFileDownload(integration, {
        cd_laudo: Number(data.medicalReportCode || 0),
        cd_paciente: Number(data.patientErpCode || 0),
        sn_captura: false,
      });

      if (medReport) {
        return medReport;
      }
    } else {
      if (!data?.medicalReportExamCode) {
        throw new BadRequestException(paramError);
      }

      const internalDocumentDownload = await this.clinuxApiService.getResultFileDownload(integration, {
        cd_exame: Number(data.medicalReportExamCode || 0),
        cd_paciente: Number(data.patientErpCode || 0),
        cd_funcionario: 318,
        sn_entrega: true,
        sn_medico: undefined,
      });

      if (internalDocumentDownload) {
        return internalDocumentDownload;
      }
    }
    return null;
  }

  public async getMedicalReportUrl(
    integration: IntegrationDocument,
    data: DownloadMedicalReportTokenData,
  ): Promise<string> {
    const paramError = {
      type: 'error',
      messages: {
        pt: 'Parâmetros ausentes',
      },
    };

    if (!data?.hasOwnProperty('isExternal')) {
      throw new BadRequestException(paramError);
    }

    if (data.isExternal) {
      if (!data?.medicalReportCode) {
        throw new BadRequestException(paramError);
      }

      const medReportUrl = await this.clinuxApiService.getExternalResultFileDownloadUrl(integration, {
        cd_laudo: Number(data.medicalReportCode || 0),
        cd_paciente: Number(data.patientErpCode || 0),
        sn_captura: false,
      });

      if (medReportUrl) {
        return medReportUrl;
      }
    } else {
      if (!data?.medicalReportExamCode) {
        throw new BadRequestException(paramError);
      }

      const internalDocumentDownloadUrl = await this.clinuxApiService.getResultFileDownloadUrl(integration, {
        cd_exame: Number(data.medicalReportExamCode || 0),
        cd_paciente: Number(data.patientErpCode || 0),
        cd_funcionario: 318,
        sn_entrega: true,
        sn_medico: undefined,
      });

      if (internalDocumentDownloadUrl) {
        return internalDocumentDownloadUrl;
      }
    }
    return null;
  }
}
