import { HttpStatus, Injectable } from '@nestjs/common';
import { HttpErrorOrigin, HTTP_ERROR_THROWER, INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import {
  ProcedureEntityDocument,
  SpecialityEntityDocument,
  EntityDocument,
  OrganizationUnitEntityDocument,
  DoctorEntityDocument,
  AppointmentTypeEntityDocument,
  ScheduleType,
  InsuranceEntityDocument,
  InsurancePlanEntityDocument,
} from '../../../entities/schema';
import { PatientFilters } from '../../../integrator/interfaces/patient-filters.interface';
import { UpdatePatient } from '../../../integrator/interfaces/update-patient.interface';
import { AppointmentService, RawAppointment } from '../../../shared/appointment.service';
import { EntitiesService } from '../../../entities/services/entities.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { IIntegratorService } from '../../../integrator/interfaces/integrator-service.interface';
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
  IInsuranceEntity,
  IInsurancePlanEntity,
  IOrganizationUnitEntity,
  IProcedureEntity,
  ISpecialityEntity,
  ITypeOfServiceEntity,
  SpecialityTypes,
} from '../../../interfaces/entity.interface';
import { Patient } from '../../../interfaces/patient.interface';
import {
  FeegowResponseArray,
  FeegowResponsePlain,
  FeegowPatientByCodeResponse,
  FeegowPatientByCpfResponse,
  FeegowCreatePatient,
  FeegowCreatePatientResponse,
  FeegowUpdatePatient,
  FeegowInsurancesParamsRequest,
  FeegowSpecialitiesParamsRequest,
  FeegowOrganizationUnitsParamsRequest,
  FeegowDoctorsParamsRequest,
  FeegowAppointmentTypesParamsRequest,
  FeegowPatientSchedules,
  FeegowCreateSchedule,
  FeegowReschedule,
  FeegowAvailableSchedules,
  FeegowAvailableSchedulesResponse,
  FeegowProceduresParamsRequest,
  FeegowCreateScheduleResponse,
} from '../interfaces';
import { FeegowApiService } from './feegow-api.service';
import { CreatePatient } from '../../../integrator/interfaces/create-patient.interface';
import * as moment from 'moment';
import { CancelSchedule, CancelScheduleV2 } from '../../../integrator/interfaces/cancel-schedule.interface';
import { ConfirmSchedule, ConfirmScheduleV2 } from '../../../integrator/interfaces/confirm-schedule.interface';
import { PatientSchedules } from '../../../integrator/interfaces/patient-schedules.interface';
import { FlowAction, FlowActionElement, FlowSteps } from '../../../flow/interfaces/flow.interface';
import { orderBy } from 'lodash';
import { FlowService } from '../../../flow/service/flow.service';
import { FeegowHelpersService } from './feegow-helpers.service';
import { CreateSchedule } from '../../../integrator/interfaces/create-schedule.interface';
import { Reschedule } from '../../../integrator/interfaces/reschedule.interface';
import {
  AvailableSchedulesMetadata,
  ListAvailableSchedules,
  ListAvailableSchedulesResponse,
} from '../../../integrator/interfaces/list-available-schedules.interface';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { GetScheduleValue } from '../../../integrator/interfaces/get-schedule-value.interface';
import { formatCurrency } from '../../../../common/helpers/format-currency';
import { InitialPatient } from '../../../integrator/interfaces/patient.interface';
import { InterAppointmentService } from '../../../shared/inter-appointment.service';
import { defaultTypesOfService } from '../../../entities/default-entities';
import { capitalizeText } from '../../../../common/helpers/capitalize-text';
import { castObjectId, castObjectIdToString } from '../../../../common/helpers/cast-objectid';
import { ListSchedulesToConfirmV2, MatchFlowsConfirmation } from '../../../integrator/interfaces';
import { FeegowConfirmationService } from './feegow-confirmation.service';
import { ConfirmationSchedule } from '../../../interfaces/confirmation-schedule.interface';
import { EntitiesFiltersService } from '../../../shared/entities-filters.service';
import { convertPhoneNumber, formatPhone } from '../../../../common/helpers/format-phone';
import { Schedules } from '../../../schedules/entities/schedules.entity';
import { GetScheduleByIdData } from '../../../integrator/interfaces/get-schedule-by-id.interface';
import { SchedulesService } from '../../../schedules/schedules.service';

type EntityFilters = { [key in EntityType]?: EntityTypes };
type RequestParams = { [key: string]: any };

@Injectable()
export class FeegowService implements IIntegratorService {
  constructor(
    private readonly apiService: FeegowApiService,
    private readonly helpersService: FeegowHelpersService,
    private readonly confirmationService: FeegowConfirmationService,
    private readonly entitiesService: EntitiesService,
    private readonly flowService: FlowService,
    private readonly entitiesFiltersService: EntitiesFiltersService,
    private readonly appointmentService: AppointmentService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
    private readonly interAppointmentService: InterAppointmentService,
    private readonly schedulesService: SchedulesService,
  ) {}

  public async cancelSchedule(integration: IntegrationDocument, cancelSchedule: CancelSchedule): Promise<OkResponse> {
    const { appointmentCode: scheduleCode } = cancelSchedule;

    try {
      const response = await this.apiService.cancelSchedule(integration, {
        agendamento_id: Number(scheduleCode),
        motivo_id: 1,
        obs: 'Cancelado via chatbot',
      });

      if (response?.success) {
        return { ok: true };
      }

      return { ok: false };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('FeegowService.cancelSchedule', error);
    }
  }

  public async confirmSchedule(
    integration: IntegrationDocument,
    confirmSchedule: ConfirmSchedule,
  ): Promise<OkResponse> {
    const { appointmentCode: scheduleCode } = confirmSchedule;

    try {
      const response = await this.apiService.confirmSchedule(integration, {
        AgendamentoID: Number(scheduleCode),
        Obs: 'Paciente confirmou o comparecimento via chatbot',
        StatusID: 7,
      });

      if (response?.success) {
        return { ok: true };
      }

      return { ok: false };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('FeegowService.confirmSchedule', error);
    }
  }

  public async createSchedule(integration: IntegrationDocument, createSchedule: CreateSchedule): Promise<Appointment> {
    try {
      const { appointment, insurance, procedure, patient, speciality, doctor } = createSchedule;
      const appointmentDate = moment.utc(appointment.appointmentDate);

      const payload: FeegowCreateSchedule = {
        paciente_id: Number(patient.code),
        data: appointmentDate.format('DD-MM-YYYY'),
        horario: appointmentDate.format('HH:mm:ss'),
        plano: 0,
        local_id: Number(appointment.data.localCode),
        valor: 0,
      } as FeegowCreateSchedule;

      if (doctor?.code) {
        payload.profissional_id = Number(doctor.code);
      }

      if (speciality?.code) {
        payload.especialidade_id = Number(speciality.code);
      }

      if (procedure?.code) {
        payload.procedimento_id = Number(procedure.code);
      }

      const savedInsurance: InsuranceEntityDocument = await this.entitiesService.getEntityByCode(
        insurance.code,
        EntityType.insurance,
        integration._id,
      );

      // se é particular procura valor que vem dentro do procedimento e envia para o feegow
      if (savedInsurance.params?.isParticular && procedure?.code) {
        const scheduleValueResponse = await this.apiService.getProcedures(integration, {
          procedimento_id: Number(procedure.code),
        });

        if (!scheduleValueResponse?.content || !scheduleValueResponse.content.length) {
          return null;
        }

        payload.valor = scheduleValueResponse.content[0].valor;
      }

      // se o convenio não é particular então envio convenio na rota. Não enviar o convenio = particular
      if (!savedInsurance.params?.isParticular) {
        payload.plano = 1;
        payload.convenio_id = Number(insurance.code);
        payload.convenio_plano_id = !!insurance.planCode ? Number(insurance.planCode) : 0;
        // por algum motivo retorna o que foi enviado no valor no convenio_id e plano_id, vai ficar
        // assim por enquanto até corrigirem a rota (valor em centavos)
        payload.valor = Number(insurance.code);
      }

      const response = await this.apiService.createSchedule(integration, payload);
      const content = response.content as FeegowCreateScheduleResponse;

      if (response.success && content?.agendamento_id) {
        return {
          appointmentDate: appointment.appointmentDate,
          duration: appointment.duration,
          appointmentCode: String(content.agendamento_id),
          status: AppointmentStatus.scheduled,
        };
      }
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('FeegowService.createSchedule', error);
    }
  }

  public async extractSingleEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    filter?: CorrelationFilter,
    cache: boolean = false,
  ): Promise<EntityTypes[]> {
    return await this.extractEntity(integration, entityType, filter, cache);
  }

  public async getAvailableSchedules(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
  ): Promise<ListAvailableSchedulesResponse> {
    try {
      // cria payload, obtem período de interconsulta e médicos mapeados com interconsulta
      const {
        period,
        randomize,
        sortMethod = AppointmentSortMethod.default,
        filter,
        patient,
        limit,
        periodOfDay,
      } = availableSchedules;
      const { payload, interAppointmentPeriodApplied, doctorsScheduledMapped } =
        await this.createListAvailableSchedulesObject(integration, availableSchedules);

      const metadata: AvailableSchedulesMetadata = {
        interAppointmentPeriod: interAppointmentPeriodApplied,
      };

      const response: FeegowResponsePlain<FeegowAvailableSchedulesResponse> | FeegowResponseArray<any> =
        await this.apiService.getAvailableSchedules(integration, payload);

      // Na oferta de horários filtrar médicos que atendem convênio escolhido - Filtro (convenio_id) na rota feegow não funciona
      // caso o paciente não escolha um médico
      if (
        payload?.convenio_id &&
        integration.rules?.useFeegowFilterDoctorsByInsurance &&
        ['672e5dc4aca798164630ca2a', '6748bc6759d11243c1671fc1'].includes(castObjectIdToString(integration._id)) // Regra por hora exclusiva Medcal (id prod e id loca)
      ) {
        const doctorsToRemove: string[] = [];

        if ('profissional_id' in response.content) {
          for (const doctorId of Object.keys(response.content.profissional_id)) {
            const doctorInsurances = await this.apiService.getDoctorsInsurances(integration, {
              profissional_id: Number(doctorId),
            });

            const hasInsurance = doctorInsurances.content.some(
              (insurance) => insurance.convenio_id === payload.convenio_id,
            );

            if (!hasInsurance) {
              doctorsToRemove.push(doctorId);
            }
          }

          for (const doctorId of doctorsToRemove) {
            delete response.content.profissional_id[doctorId];
          }
        }
      }

      // quando não tem horarios retorna um array vazio em response.content
      if (response.success && Array.isArray(response.content) && !response.content?.length) {
        return { schedules: [], metadata };
      }

      const content = response.content as FeegowAvailableSchedulesResponse;
      const doctors: DoctorEntityDocument[] = await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        Object.keys(content.profissional_id),
        EntityType.doctor,
      );

      const [matchedDoctors] = await this.flowService.matchEntitiesFlows({
        integrationId: integration._id,
        entitiesFilter: availableSchedules.filter,
        entities: doctors,
        targetEntity: FlowSteps.doctor,
        filters: { patientBornDate: patient?.bornDate, patientSex: patient?.sex, patientCpf: patient?.cpf },
      });

      const validDoctors = this.entitiesFiltersService.filterEntitiesByParams(integration, matchedDoctors, {
        bornDate: patient?.bornDate,
      });

      const feegowSchedules: { doctorCode: string; appointmentDate: string; localCode: string }[] = [];

      Object.keys(content.profissional_id).forEach((key) => {
        const doctor = validDoctors.find((d) => d.code === key);
        const nestedDoctorData = content.profissional_id[key];

        if (doctor) {
          Object.keys(nestedDoctorData.local_id).forEach((localId) => {
            const nestedLocalData = nestedDoctorData.local_id[localId];

            Object.keys(nestedLocalData).forEach((availableDate) => {
              const nestedDateData = nestedLocalData[availableDate];

              nestedDateData.forEach((scheduleTime) => {
                const dateFormat = 'YYYY-MM-DDTHH:mm:ss';
                const scheduleHour = moment(scheduleTime, 'HH:mm:ss');
                const scheduleDate = moment(availableDate)
                  .set({
                    hours: scheduleHour.hours(),
                    minutes: scheduleHour.minutes(),
                    seconds: scheduleHour.seconds(),
                  })
                  .format(dateFormat);

                feegowSchedules.push({
                  doctorCode: String(doctor.code),
                  appointmentDate: scheduleDate,
                  localCode: String(localId),
                });
              });
            });
          });
        }
      });

      const replacedAppointments: RawAppointment[] = [];

      for await (const schedule of feegowSchedules) {
        const replacedAppointment: Appointment & { [key: string]: any } = {
          appointmentCode: schedule.appointmentDate,
          appointmentDate: schedule.appointmentDate,
          duration: '-1',
          procedureId: filter.procedure.code,
          doctorId: filter.doctor?.code ?? schedule.doctorCode,
          organizationUnitId: filter.organizationUnit.code,
          specialityId: filter.speciality?.code,
          status: AppointmentStatus.scheduled,
        };

        if (schedule.localCode) {
          replacedAppointment.data = {
            ...(replacedAppointment.data ?? {}),
            localCode: schedule.localCode,
          };
        }

        const filteredInterAppointmentSchedules = this.interAppointmentService.filterInterAppointmentByDoctorCode(
          integration,
          replacedAppointment,
          doctorsScheduledMapped,
          filter,
        );

        if (filteredInterAppointmentSchedules) {
          replacedAppointments.push(filteredInterAppointmentSchedules);
        }
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
          replacedAppointments,
        );

      const validSchedules = await this.appointmentService.transformSchedules(integration, randomizedAppointments);
      return { schedules: validSchedules, metadata: { ...metadata, ...partialMetadata } };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('FeegowService.getAvailableSchedules', error);
    }
  }

  public async getScheduleValue(
    integration: IntegrationDocument,
    scheduleValue: GetScheduleValue,
  ): Promise<AppointmentValue> {
    try {
      const { procedure } = scheduleValue;

      if (!procedure?.code) {
        throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'Invalid procedure code');
      }

      const resourceCache = await this.integrationCacheUtilsService.getScheduleValueCache(integration, {
        procedure: procedure.code,
      });

      if (resourceCache) {
        return resourceCache as AppointmentValue;
      }

      const response = await this.apiService.getProcedures(integration, {
        procedimento_id: Number(procedure.code),
      });

      if (!response?.content || !response.content.length) {
        return null;
      }

      if (!response.content?.[0]?.valor || String(response.content?.[0]?.valor) === '0') {
        return null;
      }

      const value = response.content[0].valor;
      const scheduleValueResponse: AppointmentValue = {
        currency: 'R$',
        value: formatCurrency(value ? value / 100 : 0),
      };

      await this.integrationCacheUtilsService.setScheduleValueCache(
        integration,
        {
          procedure: procedure.code,
        },
        scheduleValueResponse,
      );
      return scheduleValueResponse;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('FeegowService.getScheduleValue', error);
    }
  }

  private getResourceFilters(targetEntity: EntityType, filters: EntityFilters): RequestParams {
    if (!filters || Object.keys(filters).length === 0) {
      return {};
    }

    const params: RequestParams = {};

    if (targetEntity === EntityType.procedure) {
      if (filters.hasOwnProperty(EntityType.speciality)) {
        params.especialidade_id = Number(filters[EntityType.speciality].code);
      }

      if (filters.hasOwnProperty(EntityType.appointmentType)) {
        params.tipo_procedimento = Number(filters[EntityType.appointmentType].code);
      }

      if (filters.hasOwnProperty(EntityType.organizationUnit)) {
        params.unidade_id = Number(filters[EntityType.organizationUnit].code);
      }
    }

    if (targetEntity === EntityType.doctor) {
      if (filters.hasOwnProperty(EntityType.speciality)) {
        params.especialidade_id = Number(filters[EntityType.speciality].code);
      }

      if (filters.hasOwnProperty(EntityType.organizationUnit)) {
        params.unidade_id = Number(filters[EntityType.organizationUnit].code);
      }

      // se tiver convenio e não for particular (-1)
      if (filters.hasOwnProperty(EntityType.insurance) && filters[EntityType.insurance].code !== '-1') {
        params.convenio_id = Number(filters[EntityType.insurance].code);
      }

      // está aqui porque pego ativo só para agendar, na extração pega todos para listar histórico
      // dos agendamentos do paciente
      params.ativo = 1;
    }

    if (targetEntity.hasOwnProperty(EntityType.speciality)) {
      if (filters.hasOwnProperty(EntityType.organizationUnit)) {
        params.UnitID = Number(filters[EntityType.organizationUnit].code);
      }
    }

    if (targetEntity === EntityType.insurancePlan) {
      if (filters.hasOwnProperty(EntityType.insurance)) {
        params.insurance_id = Number(filters[EntityType.insurance].code);
      }
    }

    if (targetEntity === EntityType.speciality) {
      if (filters.hasOwnProperty(EntityType.organizationUnit)) {
        params.unidade_id = Number(filters[EntityType.organizationUnit].code);
      }
    }

    // if (targetEntity === EntityType.insurance) {
    //   if (filters.hasOwnProperty(EntityType.organizationUnit)) {
    //     params.unidade_id = Number(filters[EntityType.organizationUnit].code);
    //   }
    // }

    return params;
  }

  public async extractEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    rawFilters?: EntityFilters,
    cache?: boolean,
  ): Promise<EntityTypes[]> {
    const requestFilters = this.getResourceFilters(entityType, rawFilters);

    if (cache) {
      const resourceCache = await this.integrationCacheUtilsService.getCachedEntitiesFromRequest(
        entityType,
        integration,
        requestFilters,
      );

      if (!!resourceCache) {
        return resourceCache;
      }
    }

    const getResource = () => {
      switch (entityType) {
        case EntityType.organizationUnit:
          return this.getOrganizationUnits(integration, requestFilters);

        case EntityType.insurance:
          return this.getInsurances(integration, requestFilters);

        case EntityType.insurancePlan:
          return this.getInsurancePlans(integration, requestFilters);

        case EntityType.doctor:
          return this.getDoctors(integration, requestFilters);

        case EntityType.speciality:
          return this.getSpecialities(integration, requestFilters);

        case EntityType.appointmentType:
          return this.getAppointmentTypes(integration, requestFilters);

        case EntityType.typeOfService:
          return this.getTypeOfServices(integration);

        case EntityType.procedure:
          return this.getProcedures(integration, requestFilters);

        default:
          return [];
      }
    };

    const resource: EntityTypes[] = await getResource();
    await this.integrationCacheUtilsService.setCachedEntitiesFromRequest(
      entityType,
      integration,
      requestFilters,
      resource,
    );
    return resource;
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
      throw INTERNAL_ERROR_THROWER('FeegowService.getTypeOfServices', error);
    }
  }

  private async getAppointmentTypes(
    integration: IntegrationDocument,
    requestFilters: FeegowAppointmentTypesParamsRequest,
  ): Promise<IAppointmentTypeEntity[]> {
    try {
      const response = await this.apiService.getAppointmentTypes(integration, requestFilters);
      return (
        response?.content?.map((resource) => ({
          code: String(resource.id),
          integrationId: castObjectId(integration._id),
          name: resource.tipo?.trim(),
          source: EntitySourceType.erp,
          version: EntityVersionType.production,
        })) ?? []
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('FeegowService.getAppointmentTypes', error);
    }
  }

  private async getSpecialities(
    integration: IntegrationDocument,
    requestFilters: FeegowSpecialitiesParamsRequest,
  ): Promise<ISpecialityEntity[]> {
    try {
      const response = await this.apiService.getSpecialities(integration, requestFilters);
      return (
        response?.content
          ?.filter((resource) => resource.exibir_agendamento_online === 1)
          .map((resource) => ({
            code: String(resource.especialidade_id),
            integrationId: castObjectId(integration._id),
            name: resource.nome?.trim(),
            source: EntitySourceType.erp,
            version: EntityVersionType.production,
            specialityType: SpecialityTypes.C,
          })) ?? []
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('FeegowService.getSpecialities', error);
    }
  }

  private async getInsurances(
    integration: IntegrationDocument,
    requestFilters: FeegowInsurancesParamsRequest,
  ): Promise<IInsuranceEntity[]> {
    try {
      const response = await this.apiService.getInsurances(integration, requestFilters);
      const entities: IInsuranceEntity[] = response.content?.map((resource) => ({
        code: String(resource.convenio_id),
        integrationId: castObjectId(integration._id),
        name: resource.nome?.trim(),
        source: EntitySourceType.erp,
        activeErp: true,
        version: EntityVersionType.production,
      }));

      // aparentemente particular não existe no feegow, então fixo no retorno para mantermos
      // nosso fluxo de integração
      // Atenção: código -1 particular utilizado no filtro de convênios por médico
      return [
        ...entities,
        {
          code: String(-1),
          integrationId: castObjectId(integration._id),
          name: 'Particular',
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
        },
      ];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('FeegowService.getInsurances', error);
    }
  }

  private async getInsurancePlans(
    integration: IntegrationDocument,
    requestFilters: FeegowInsurancesParamsRequest,
  ): Promise<IInsurancePlanEntity[]> {
    try {
      const response = await this.apiService.getInsurances(integration, requestFilters);
      const insurancePlans: IInsurancePlanEntity[] = [];

      let resources = response.content;

      if (requestFilters.insurance_id) {
        resources = resources.filter((resource) => resource.convenio_id === requestFilters.insurance_id);
      }

      resources?.forEach((resource) => {
        resource.planos.forEach((resourcePlan) => {
          insurancePlans.push({
            code: String(resourcePlan.plano_id),
            integrationId: castObjectId(integration._id),
            // se nome do plano vier vazio utiliza nome do convenio
            name: resourcePlan.plano?.trim() || resource.nome?.trim(),
            source: EntitySourceType.erp,
            activeErp: true,
            insuranceCode: String(resource.convenio_id),
            version: EntityVersionType.production,
          });
        });
      });
      return insurancePlans ?? [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('FeegowService.getInsurances', error);
    }
  }

  private async getOrganizationUnits(
    integration: IntegrationDocument,
    requestFilters: FeegowOrganizationUnitsParamsRequest,
  ): Promise<IOrganizationUnitEntity[]> {
    try {
      const response = await this.apiService.getOrganizationUnits(integration, requestFilters);

      const allOrganizationUnities = [...(response?.content?.matriz || []), ...(response?.content?.unidades || [])];

      return (
        allOrganizationUnities.map((resource) => ({
          code: String(resource.unidade_id),
          integrationId: castObjectId(integration._id),
          name: resource.nome_fantasia?.trim(),
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
          data: {
            address: `${resource.endereco} - ${resource.numero}, ${resource.bairro} - ${resource.cep}`,
          },
        })) ?? []
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('FeegowService.getOrganizationUnits', error);
    }
  }

  private async getProcedures(
    integration: IntegrationDocument,
    requestFilters: FeegowProceduresParamsRequest,
  ): Promise<IProcedureEntity[]> {
    try {
      const data = await this.apiService.getProcedures(integration, requestFilters);
      let results = data?.content;

      if (!!requestFilters.especialidade_id) {
        results = results.filter((procedure) => {
          return (
            procedure.especialidade_id?.includes(requestFilters.especialidade_id) &&
            procedure.permite_agendamento_online
          );
        });
      }

      return results.map((resource) => ({
        code: String(resource.procedimento_id),
        integrationId: castObjectId(integration._id),
        name: resource.nome?.trim(),
        activeErp: true,
        source: EntitySourceType.erp,
        version: EntityVersionType.production,
        specialityCode: String(resource.especialidade_id?.[0] ?? -1),
        specialityType: String(resource.tipo_procedimento),
      }));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('FeegowService.getProcedures', error);
    }
  }

  private async getDoctors(
    integration: IntegrationDocument,
    requestFilters: FeegowDoctorsParamsRequest,
  ): Promise<IOrganizationUnitEntity[]> {
    try {
      const response = await this.apiService.getDoctors(integration, requestFilters);

      if (requestFilters.convenio_id && integration.rules?.useFeegowFilterDoctorsByInsurance) {
        const filterDoctorByInsurance = await Promise.all(
          response.content.map(async (doctor) => {
            const doctorsInsurances = await this.apiService.getDoctorsInsurances(integration, {
              profissional_id: doctor.profissional_id,
            });
            const hasInsurance = doctorsInsurances.content.some(
              (insurance) => insurance.convenio_id === requestFilters.convenio_id,
            );
            return hasInsurance ? doctor : null;
          }),
        );
        response.content = filterDoctorByInsurance.filter((doctor) => doctor !== null);
      }

      return (
        response.content?.map((resource) => ({
          code: String(resource.profissional_id),
          integrationId: castObjectId(integration._id),
          name: resource.nome?.trim(),
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
        })) ?? []
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('FeegowService.getDoctors', error);
    }
  }

  private async getValidApiProcedures(
    integration: IntegrationDocument,
    filters: EntityFilters,
    cache?: boolean,
  ): Promise<ProcedureEntityDocument[]> {
    try {
      const data = (await this.extractEntity(
        integration,
        EntityType.procedure,
        filters,
        cache,
      )) as ProcedureEntityDocument[];
      const codes = data?.map((procedure) => procedure.code);
      const entities = await this.entitiesService.getValidEntitiesbyCode(integration._id, codes, EntityType.procedure);

      const validEntities: ProcedureEntityDocument[] = [];

      (entities as ProcedureEntityDocument[]).forEach((savedEntity) => {
        data.forEach((receivedEntity) => {
          if (
            receivedEntity.code === savedEntity.code &&
            receivedEntity.specialityCode === savedEntity.specialityCode
          ) {
            validEntities.push(savedEntity);
          }
        });
        if (
          savedEntity.source === EntitySourceType.user &&
          (savedEntity.specialityCode === filters.speciality?.code ||
            !filters.speciality ||
            !savedEntity?.specialityCode)
        ) {
          validEntities.push(savedEntity);
        }
      });

      return (validEntities ?? []) as ProcedureEntityDocument[];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('FeegowService.getValidApiProcedures', error);
    }
  }

  private async getValidApiSpecialities(
    integration: IntegrationDocument,
    filters: EntityFilters,
    cache?: boolean,
  ): Promise<SpecialityEntityDocument[]> {
    try {
      const entities = await this.extractEntity(integration, EntityType.speciality, filters, cache);
      const codes = entities?.map((speciality) => speciality.code);
      const validEntities = await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.speciality,
      );
      return (validEntities ?? []) as SpecialityEntityDocument[];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('FeegowService.getValidApiSpecialities', error);
    }
  }

  private async getValidApiOrganizationUnits(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<OrganizationUnitEntityDocument[]> {
    try {
      const entities = await this.extractEntity(integration, EntityType.organizationUnit, filters, cache);
      const codes = entities?.map((organization) => organization.code);
      const validEntities = await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.organizationUnit,
      );
      return (validEntities ?? []) as OrganizationUnitEntityDocument[];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('FeegowService.getValidApiOrganizationUnits', error);
    }
  }

  private async getValidApiDoctors(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<DoctorEntityDocument[]> {
    try {
      const entities = await this.extractEntity(integration, EntityType.doctor, filters, cache);
      const codes = entities?.map((doctor) => doctor.code);
      const validEntities = await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.doctor,
      );
      return (validEntities ?? []) as DoctorEntityDocument[];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('FeegowService.getValidApiDoctors', error);
    }
  }

  private async getValidApiAppointmentTypes(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<AppointmentTypeEntityDocument[]> {
    try {
      const entities = await this.extractEntity(integration, EntityType.appointmentType, filters, cache);
      const codes = entities?.map((appointmentType) => appointmentType.code);
      const validEntities = await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.appointmentType,
      );
      return (validEntities ?? []) as AppointmentTypeEntityDocument[];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('FeegowService.getValidApiAppointmentTypes', error);
    }
  }

  private async getValidApiInsurances(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<InsuranceEntityDocument[]> {
    try {
      const entities = await this.extractEntity(integration, EntityType.insurance, filters, cache);
      const codes = entities?.map((insurance) => insurance.code);
      const validEntities = await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.insurance,
      );
      return (validEntities ?? []) as InsuranceEntityDocument[];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('FeegowService.getValidApiInsurances', error);
    }
  }

  private async getValidApiInsurancePlans(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<InsurancePlanEntityDocument[]> {
    try {
      const data = await this.extractEntity(integration, EntityType.insurancePlan, filters, cache);
      const insurancePlanCodes = data?.map((insurancePlan) => insurancePlan.code);
      return (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        insurancePlanCodes,
        EntityType.insurancePlan,
      )) as InsurancePlanEntityDocument[];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('FeegowService.getValidApiInsurancePlans', error);
    }
  }

  public async getEntityList(
    integration: IntegrationDocument,
    rawFilter: CorrelationFilter,
    targetEntity: EntityType,
    cache?: boolean,
    patient?: InitialPatient,
  ): Promise<EntityDocument[]> {
    switch (targetEntity) {
      case EntityType.appointmentType:
        return await this.getValidApiAppointmentTypes(integration, rawFilter, cache);

      case EntityType.speciality:
        return await this.getValidApiSpecialities(integration, rawFilter, cache);

      case EntityType.organizationUnit:
        return await this.getValidApiOrganizationUnits(integration, rawFilter, cache);

      case EntityType.insurance:
        return await this.getValidApiInsurances(integration, rawFilter, cache);

      case EntityType.insurancePlan:
        return await this.getValidApiInsurancePlans(integration, rawFilter, cache);

      case EntityType.procedure:
        return await this.getValidApiProcedures(integration, rawFilter, cache);

      case EntityType.doctor:
        return await this.resolveListValidApiDoctors(integration, rawFilter, cache, patient);

      case EntityType.organizationUnitLocation:
      case EntityType.occupationArea:
        return await this.entitiesService.getValidEntities(targetEntity, integration._id);

      default:
        return [] as EntityDocument[];
    }
  }

  private async createListAvailableSchedulesObject(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
  ): Promise<{
    payload: FeegowAvailableSchedules;
    interAppointmentPeriodApplied: number;
    doctorsScheduledMapped: Map<string, number>;
  }> {
    const { filter, untilDay, patient } = availableSchedules;
    let { fromDay } = availableSchedules;
    const dateFormat = 'DD-MM-YYYY';
    let interAppointmentPeriodApplied: number = undefined;
    const doctorsScheduledMapped = new Map<string, number>();

    try {
      if (
        patient?.code &&
        filter.insurance?.code &&
        filter.appointmentType?.params?.referenceScheduleType === ScheduleType.Consultation
      ) {
        const [doctorsScheduledMap, interAppointmentPeriod] =
          await this.interAppointmentService.validateInsuranceInterAppointment(
            integration,
            filter,
            patient.code,
            this.getMinifiedPatientSchedules.bind(this),
            undefined,
            { method: 2 },
            availableSchedules.appointmentCodeToCancel ? [availableSchedules.appointmentCodeToCancel] : undefined,
          );

        doctorsScheduledMap.forEach((value, key) => {
          doctorsScheduledMapped.set(key, value);
        });

        if (interAppointmentPeriod > 0 && fromDay < interAppointmentPeriod) {
          fromDay = interAppointmentPeriod;
          interAppointmentPeriodApplied = interAppointmentPeriod;
        }
      }
    } catch (error) {
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_GATEWAY, error);
    }

    const payload: FeegowAvailableSchedules = {
      unidade_id: Number(filter.organizationUnit.code),
      data_start: moment().add(fromDay, 'days').startOf('day').format(dateFormat),
      data_end: moment()
        .add(fromDay + untilDay, 'days')
        .endOf('day')
        .format(dateFormat),
      tipo: 'P',
    };

    if (filter.procedure?.code) {
      payload.procedimento_id = Number(filter.procedure.code);
    }

    if (filter.doctor?.code) {
      payload.profissional_id = Number(filter.doctor.code);
    }

    if (filter.speciality?.code) {
      payload.especialidade_id = Number(filter.speciality.code);
      payload.tipo = 'E';
    }

    const savedIsurance: InsuranceEntityDocument = await this.entitiesService.getEntityByCode(
      filter.insurance.code,
      EntityType.insurance,
      integration._id,
    );

    if (!savedIsurance?.params?.isParticular) {
      payload.convenio_id = Number(filter.insurance.code);
    }

    return { payload, interAppointmentPeriodApplied, doctorsScheduledMapped };
  }

  private async getValidDoctorsFromScheduleList(
    integration: IntegrationDocument,
    filter: CorrelationFilter,
    patient?: InitialPatient,
  ): Promise<EntityDocument[]> {
    // Se tiver diferença nos valores com a response, vai listar medicos que nao tem horarios
    // ou vice-versa
    const availableSchedules: ListAvailableSchedules = {
      filter,
      randomize: false,
      limit: 30,
      period: {
        start: '00:00',
        end: '23:59',
      },
      fromDay: 1,
      untilDay: 60,
      patient: {
        bornDate: patient?.bornDate,
        sex: patient?.sex,
        cpf: patient?.cpf,
      },
    };

    try {
      const { payload } = await this.createListAvailableSchedulesObject(integration, availableSchedules);
      const response = await this.apiService.getAvailableSchedules(integration, payload);

      const doctorsSet = new Set<string>();

      const content = response?.content as FeegowAvailableSchedulesResponse;

      Object.keys(content?.profissional_id ?? {}).forEach((doctorId) => {
        doctorsSet.add(doctorId);
      });

      if (!doctorsSet.size) {
        return [];
      }

      return await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        Array.from(doctorsSet),
        EntityType.doctor,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('FeegowIntegrationService.getValidDoctorsFromScheduleList', error);
    }
  }

  public async resolveListValidApiDoctors(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
    patient?: InitialPatient,
  ) {
    if (integration.rules.listOnlyDoctorsWithAvailableSchedules) {
      return await this.getValidDoctorsFromScheduleList(integration, filters, patient);
    }

    return await this.getValidApiDoctors(integration, filters, cache);
  }

  public async getMinifiedPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<MinifiedAppointments> {
    const { patientCode, startDate, endDate } = patientSchedules;
    const minifiedSchedules: MinifiedAppointments = {
      appointmentList: [],
      lastAppointment: null,
      nextAppointment: null,
    };
    const dateFilterFormat = 'DD-MM-YYYY';

    try {
      const filters: FeegowPatientSchedules = {
        paciente_id: Number(patientCode),
        // range máximo de 6 meses de busca
        data_start: moment().subtract(2, 'months').format(dateFilterFormat),
        data_end: moment().add(3, 'months').format(dateFilterFormat),
      };

      if (startDate) {
        filters.data_start = moment(startDate).format(dateFilterFormat);
      }

      if (endDate) {
        filters.data_end = moment(startDate).format(dateFilterFormat);
      }

      const feegowSchedules = await this.apiService.listSchedules(integration, filters);

      // se caiu aqui não seta no cache para usar na interconsulta, pois deu erro na request
      if (!feegowSchedules?.content) {
        await this.integrationCacheUtilsService.setPatientSchedulesCache(integration, patientCode, {
          minifiedSchedules,
          schedules: [],
        });

        return minifiedSchedules;
      }

      const schedules: Appointment[] = await Promise.all(
        feegowSchedules.content
          // filtra agendamentos cancelados
          ?.filter((feegowSchedule) => feegowSchedule.status_id !== 11 && feegowSchedule.status_id !== 6)
          .map(async (feegowSchedule) => {
            const [schedule] = await this.appointmentService.transformSchedules(integration, [
              await this.helpersService.createPatientAppointmentObject(integration, feegowSchedule),
            ]);

            const flowSteps = [FlowSteps.listPatientSchedules];

            if (patientSchedules.target) {
              flowSteps.push(patientSchedules.target);
            }

            const flowActions = await this.flowService.matchFlowsAndGetActions({
              integrationId: integration._id,
              targetFlowTypes: flowSteps,
              entitiesFilter: {
                appointmentType: schedule.appointmentType,
                doctor: schedule.doctor,
                insurance: schedule.insurance,
                insurancePlan: schedule.insurancePlan,
                insuranceSubPlan: schedule.insuranceSubPlan,
                organizationUnit: schedule.organizationUnit,
                planCategory: schedule.planCategory,
                procedure: schedule.procedure,
                speciality: schedule.speciality,
                occupationArea: schedule.occupationArea,
                organizationUnitLocation: schedule.organizationUnitLocation,
                typeOfService: schedule.typeOfService,
              },
            });

            minifiedSchedules.appointmentList.push({
              appointmentCode: String(feegowSchedule.agendamento_id),
              appointmentDate: schedule.appointmentDate,
            });

            return {
              ...schedule,
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
      throw INTERNAL_ERROR_THROWER('FeegowService.getMinifiedPatientSchedules', error);
    }
  }

  public async getMultipleEntitiesByFilter(
    integration: IntegrationDocument,
    filter: CorrelationFilterByKey,
  ): Promise<CorrelationFilter> {
    return await this.entitiesService.createCorrelationFilterData(filter, 'code', integration._id);
  }

  private async getPatientByCode(integration: IntegrationDocument, code: string): Promise<Patient> {
    try {
      const data: FeegowResponsePlain<FeegowPatientByCodeResponse> = await this.apiService.getPatientByCode(
        integration,
        code,
      );

      return this.helpersService.replacePatient(data.content, code);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('FeegowService.getPatientByCode', error);
    }
  }

  private async getPatientByCpf(integration: IntegrationDocument, cpf: string): Promise<Patient> {
    try {
      const data: FeegowResponseArray<FeegowPatientByCpfResponse> = await this.apiService.getPatientByCpf(
        integration,
        cpf,
      );

      const patientCode = data.content?.[0].patient_id;
      return await this.getPatientByCode(integration, String(patientCode));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('FeegowService.getPatientByCpf', error);
    }
  }

  public async getPatient(integration: IntegrationDocument, filters: PatientFilters): Promise<Patient> {
    const { cpf, code, cache } = filters;
    const patientCache = await this.integrationCacheUtilsService.getPatientFromCache(integration, code, cpf);

    if (patientCache && cache) {
      return patientCache;
    }

    let patient: Patient;

    if (cpf) {
      patient = await this.getPatientByCpf(integration, cpf);
    } else if (code) {
      patient = await this.getPatientByCode(integration, code);
    }

    if (patient?.code) {
      await this.integrationCacheUtilsService.setPatientCache(integration, code, cpf, patient);
    }

    return patient;
  }

  public async createPatient(integration: IntegrationDocument, { patient }: CreatePatient): Promise<Patient> {
    try {
      const phone = formatPhone(convertPhoneNumber(patient.phone ?? patient.cellPhone), true);
      const cellPhone = formatPhone(convertPhoneNumber(patient.cellPhone ?? patient.phone), true);

      const payload: FeegowCreatePatient = {
        data_nascimento: moment(patient.bornDate).format('YYYY-MM-DD'),
        nome_completo: integration?.rules?.patientNameCase ? patient.name : capitalizeText(patient.name),
        sexo: patient.sex?.toUpperCase(),
        cpf: patient.cpf,
      };

      if (phone) {
        payload.telefone = phone;
      }

      if (cellPhone) {
        payload.celular = cellPhone;
      }

      if (patient.email) {
        payload.email = patient.email;
      }

      const response: FeegowResponsePlain<FeegowCreatePatientResponse> = await this.apiService.createPatient(
        integration,
        payload,
      );

      const createdPatient = await this.getPatientByCode(integration, String(response.content.paciente_id));

      if (createdPatient?.code) {
        await this.integrationCacheUtilsService.setPatientCache(
          integration,
          createdPatient.code,
          createdPatient.cpf,
          createdPatient,
        );
      }

      return createdPatient;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('FeegowService.createPatient', error);
    }
  }

  public async updatePatient(
    integration: IntegrationDocument,
    patientCode: string,
    { patient }: UpdatePatient,
  ): Promise<Patient> {
    try {
      const phone = formatPhone(convertPhoneNumber(patient.phone || patient.cellPhone), true);
      const cellPhone = formatPhone(convertPhoneNumber(patient.cellPhone || patient.phone), true);

      const payload: FeegowUpdatePatient = {
        data_nascimento: patient.bornDate,
        nome_completo: integration?.rules?.patientNameCase ? patient.name : capitalizeText(patient.name),
        genero: patient.sex?.toUpperCase(),
        cpf: patient.cpf,
        email: patient.email ?? '',
        telefone: phone,
        celular: cellPhone,
        paciente_id: Number(patientCode),
      };

      const response: FeegowResponsePlain<string> = await this.apiService.updatePatient(integration, payload);

      if (!response.success) {
        throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'Not updated', HttpErrorOrigin.INTEGRATION_ERROR);
      }

      const updatedPatient = await this.getPatientByCode(integration, patientCode);
      await this.integrationCacheUtilsService.setPatientCache(
        integration,
        updatedPatient.code,
        updatedPatient.cpf,
        updatedPatient,
      );
      return updatedPatient;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('FeegowService.updatePatient', error);
    }
  }

  public async getPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<Appointment[]> {
    try {
      const { patientCode, startDate, endDate } = patientSchedules;
      const dateFilterFormat = 'DD-MM-YYYY';

      const filters: FeegowPatientSchedules = {
        paciente_id: Number(patientCode),
        // range máximo de 6 meses de busca
        data_start: moment().subtract(2, 'months').format(dateFilterFormat),
        data_end: moment().add(3, 'months').format(dateFilterFormat),
      };

      if (startDate) {
        filters.data_start = moment(startDate).format(dateFilterFormat);
      }

      if (endDate) {
        filters.data_end = moment(startDate).format(dateFilterFormat);
      }

      const schedules = await this.apiService.listSchedules(integration, filters);

      if (!schedules?.content?.length) {
        return [];
      }

      const rawSchedules: RawAppointment[] = await Promise.all(
        schedules.content
          // filtra agendamentos cancelados
          ?.filter((feegowSchedule) => feegowSchedule.status_id !== 11 && feegowSchedule.status_id !== 6)
          .map(
            async (feegowSchedule) =>
              await this.helpersService.createPatientAppointmentObject(integration, feegowSchedule),
          ),
      );

      return await this.appointmentService.transformSchedules(integration, rawSchedules);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('FeegowService.getPatientSchedules', error);
    }
  }

  public async reschedule(integration: IntegrationDocument, reschedule: Reschedule): Promise<Appointment> {
    try {
      const { scheduleToCancelCode, scheduleToCreate, patient } = reschedule;

      // busca agendamentos do paciente para pegar dados de qual será cancelado
      const patientAppointments = await this.getPatientSchedules(integration, { patientCode: patient.code });
      const appointmentToCancel = patientAppointments.find(
        (appointment) => appointment.appointmentCode == scheduleToCancelCode,
      );

      if (!appointmentToCancel) {
        throw INTERNAL_ERROR_THROWER('FeegowService.reschedule', {
          message: 'Invalid appointment code to cancel',
        });
      }

      const { appointment } = scheduleToCreate;
      const appointmentDate = moment.utc(appointment.appointmentDate);

      const payload: FeegowReschedule = {
        data: appointmentDate.format('DD-MM-YYYY'),
        horario: appointmentDate.format('HH:mm:ss'),
        motivo_id: 1,
        agendamento_id: Number(scheduleToCancelCode),
      };

      const response = await this.apiService.reschedule(integration, payload);

      if (response.success) {
        return {
          appointmentCode: response.content,
          appointmentDate: appointment.appointmentDate,
          status: AppointmentStatus.scheduled,
        };
      }
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('FeegowService.reschedule', error);
    }
  }

  public async getStatus(integration: IntegrationDocument): Promise<OkResponse> {
    try {
      const data = await this.apiService.getOrganizationUnits(integration, null, true);
      if (data?.content?.matriz?.length > 0) {
        return { ok: true };
      }
    } catch (error) {
      throw error;
    }
  }

  public async matchFlowsConfirmation(
    integration: IntegrationDocument,
    data: MatchFlowsConfirmation,
  ): Promise<FlowAction<FlowActionElement>[]> {
    return await this.confirmationService.matchFlowsConfirmation(integration, data);
  }

  async listSchedulesToConfirm(
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

  async getConfirmationScheduleById(integration: IntegrationDocument, data: GetScheduleByIdData): Promise<Schedules> {
    try {
      return await this.schedulesService.getScheduleByCodeOrId(
        castObjectIdToString(integration._id),
        null,
        data.scheduleId,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('FeegowService.getConfirmationScheduleById', error);
    }
  }
}
