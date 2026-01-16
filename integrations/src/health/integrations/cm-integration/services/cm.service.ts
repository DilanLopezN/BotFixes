import { HttpStatus, Injectable } from '@nestjs/common';
import {
  getErrorType,
  HttpErrorOrigin,
  HTTP_ERROR_THROWER,
  INTERNAL_ERROR_THROWER,
} from '../../../../common/exceptions.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { IIntegratorService } from '../../../integrator/interfaces/integrator-service.interface';
import { Patient } from '../../../interfaces/patient.interface';
import {
  CMResponseArray,
  CMResponsePlain,
  CreateAppointmentRequest,
  CreateAppointmentResponse,
  CreatePatientRequest,
  CreatePatientResponse,
  GetPatientResponse,
  PatientScheduleResponse,
  SimplifiedListScheduleRequest,
  SimplifiedListScheduleResponse,
  CancelAppointmentResponse,
  CancelAppointmentRequest,
  PatientScheduleRequestParams,
  AppointmentValueResponse,
  AppointmentValueRequest,
  UpdatePatientRequest,
  UpdatePatientResponse,
  TypeOfService as CmTypeOfService,
  AppointmentConfirmationRequestParams,
} from '../interfaces';
import { CmApiService } from './cm-api.service';
import {
  EntitySourceType,
  EntityType,
  EntityVersionType,
  IAppointmentTypeEntity,
  IDoctorEntity,
  IInsuranceEntity,
  IInsurancePlanEntity,
  IInsuranceSubPlanEntity,
  IOrganizationUnitEntity,
  IInsurancePlanCategoryEntity,
  IProcedureEntity,
  ISpecialityEntity,
  ITypeOfServiceEntity,
  SpecialityTypes,
} from '../../../interfaces/entity.interface';
import { EntitiesService } from '../../../entities/services/entities.service';
import {
  Appointment,
  AppointmentSortMethod,
  AppointmentStatus,
  AppointmentValue,
  FollowUpAppointment,
  MinifiedAppointments,
} from '../../../interfaces/appointment.interface';
import * as moment from 'moment';
import { CorrelationFilter, CorrelationFilterByKey } from '../../../interfaces/correlation-filter.interface';
import { AppointmentService, RawAppointment } from '../../../shared/appointment.service';
import {
  EntityDocument,
  OrganizationUnitEntityDocument,
  SpecialityEntityDocument,
  AppointmentTypeEntityDocument,
  InsuranceEntity,
  InsuranceEntityDocument,
  DoctorEntityDocument,
  InsurancePlanEntity,
  InsurancePlanEntityDocument,
  InsuranceSubPlanEntity,
  InsuranceSubPlanEntityDocument,
  PlanCategoryEntity,
  PlanCategoryEntityDocument,
  ProcedureEntityDocument,
  OrganizationUnitLocationEntityDocument,
  TypeOfService,
  TypeOfServiceEntityDocument,
  OccupationAreaEntityDocument,
  ScheduleType,
} from '../../../entities/schema';
import {
  DoctorResponse,
  InsurancePlanResponse,
  InsuranceResponse,
  ProcedureResponse,
  SpecialityResponse,
  OrganizationUnitResponse,
  OrganizationUnitRequest,
  InsuranceRequest,
  InsurancePlanRequest,
  DoctorRequest,
  SpecialityRequest,
  ProcedureRequest,
  PlanCategoryRequest,
  PlanCategoryResponse,
  InsuranceSubPlanRequest,
  InsuranceSubPlanResponse,
} from '../interfaces/base-register.interface';
import { EntityTypes } from '../../../interfaces/entity.interface';
import { orderBy } from 'lodash';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { normalize } from '../../../../common/helpers/normalize-text.helper';
import { formatCurrency } from '../../../../common/helpers/format-currency';
import { PatientSchedules } from '../../../integrator/interfaces/patient-schedules.interface';
import { FlowService } from '../../../flow/service/flow.service';
import { sortByKeys } from '../../../../common/helpers/sort-objectkeys';
import { FlowSteps } from '../../../flow/interfaces/flow.interface';
import { ExternalInsurancesService } from '../../../external-insurances/services/external-insurances.service';
import { CmHelpersService } from './cm-helpers.service';
import { CreateSchedule } from '../../../integrator/interfaces/create-schedule.interface';
import { Reschedule } from '../../../integrator/interfaces/reschedule.interface';
import { PatientFilters } from '../../../integrator/interfaces/patient-filters.interface';
import { UpdatePatient } from '../../../integrator/interfaces/update-patient.interface';
import {
  AvailableSchedulesMetadata,
  ListAvailableSchedules,
  ListAvailableSchedulesResponse,
} from '../../../integrator/interfaces/list-available-schedules.interface';
import { ConfirmSchedule } from '../../../integrator/interfaces/confirm-schedule.interface';
import { CancelSchedule } from '../../../integrator/interfaces/cancel-schedule.interface';
import { GetScheduleValue } from '../../../integrator/interfaces/get-schedule-value.interface';
import { CreatePatient } from '../../../integrator/interfaces/create-patient.interface';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import {
  DOCTORS_FROM_SCHEDULE_LIST_CACHE_EXPIRATION,
  getExpirationByEntity,
  SPECIALITIES_FROM_DOCTORS_CACHE_EXPIRATION,
} from '../../../integration-cache-utils/cache-expirations';
import { CacheService } from '../../../../core/cache/cache.service';
import { formatPhone } from '../../../../common/helpers/format-phone';
import * as Sentry from '@sentry/node';
import * as contextService from 'request-context';
import { PatientFollowUpSchedules } from '../../../integrator/interfaces/patient-follow-up-schedules.interface';
import { InitialPatient } from '../../../integrator/interfaces/patient.interface';
import { InterAppointmentService } from '../../../shared/inter-appointment.service';
import {
  defaultAppointmentTypes,
  defaultTypesOfService,
  defaultTypesOfServiceMap,
} from '../../../entities/default-entities';
import { castObjectId, castObjectIdToString } from '../../../../common/helpers/cast-objectid';
import { betweenDate } from '../../../../common/helpers/between';
import { removeBlankSpaces } from '../../../../common/helpers/remove-blank-spaces';
import { EntitiesFiltersService } from '../../../shared/entities-filters.service';
import { RulesHandlerService } from '../../../rules-handler/rules-handler.service';
import { CredentialsHelper } from '../../../credentials/credentials.service';
import { CMCredentialsResponse } from '../interfaces/credentials';

type EntityFilters = { [key in EntityType]?: { code: string } };

@Injectable()
export class CmService implements IIntegratorService {
  constructor(
    private readonly cmApiService: CmApiService,
    private readonly cmHelpersService: CmHelpersService,
    private readonly entitiesService: EntitiesService,
    private readonly appointmentService: AppointmentService,
    private readonly flowService: FlowService,
    private readonly entitiesFiltersService: EntitiesFiltersService,
    private readonly externalInsurancesService: ExternalInsurancesService,
    private readonly cacheService: CacheService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
    private readonly interAppointmentService: InterAppointmentService,
    private readonly rulesHandlerService: RulesHandlerService,
    private readonly credentialsHelper: CredentialsHelper,
  ) {}

  private async getPatientByCode(integration: IntegrationDocument, code: string): Promise<Patient> {
    try {
      const data: CMResponsePlain<GetPatientResponse> = await this.cmApiService.getPatientByCode(integration, code);
      if (!data?.result) {
        throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
      }

      return this.cmHelpersService.replacePatient(data.result);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('CmIntegrationService.getPatientByCode', error);
    }
  }

  private async getPatientByCpf(integration: IntegrationDocument, cpf: string): Promise<Patient> {
    try {
      const data: CMResponsePlain<GetPatientResponse> = await this.cmApiService.getPatientByCpf(integration, cpf);
      if (!data?.result) {
        throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
      }

      return this.cmHelpersService.replacePatient(data.result);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('CmIntegrationService.getPatientByCpf', error);
    }
  }

  public async getPatient(integration: IntegrationDocument, filters: PatientFilters): Promise<Patient> {
    const { cpf, code, cache } = filters;
    const patientCache = await this.integrationCacheUtilsService.getPatientFromCache(integration, code, cpf);

    if (patientCache && cache) {
      return patientCache;
    }

    let patient: Patient;

    try {
      if (cpf) {
        patient = await this.getPatientByCpf(integration, cpf);
      } else if (code) {
        patient = await this.getPatientByCode(integration, code);
      }

      if (patient) {
        await this.integrationCacheUtilsService.setPatientCache(integration, code, cpf, patient);
      }
      return patient;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('CmIntegrationService.getPatient', error);
    }
  }

  public async updatePatient(
    integration: IntegrationDocument,
    patientCode: string,
    { patient }: UpdatePatient,
  ): Promise<Patient> {
    const payload: UpdatePatientRequest = await this.createPatientPayload(integration, patient, patientCode);

    try {
      const data: CMResponsePlain<UpdatePatientResponse> = await this.cmApiService.updatePatient(integration, payload);
      const patient = this.cmHelpersService.replacePatient(data.result);

      if (patient) {
        await this.integrationCacheUtilsService.setPatientCache(integration, patient.code, patient.cpf, patient);
      }

      return patient;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('CmIntegrationService.updatePatient', error);
    }
  }

  private async createPatientPayload(
    integration: IntegrationDocument,
    patient: Patient,
    patientCode?: string,
  ): Promise<UpdatePatientRequest | CreatePatientRequest> {
    const { codeIntegration } = await this.credentialsHelper.getConfig<CMCredentialsResponse>(integration);
    const payload = {
      codigosClientes: [codeIntegration],
      paciente: {
        nome: '',
        dataNascimento: moment(patient.bornDate).format('YYYY-MM-DD'),
        genero: patient.sex?.toUpperCase(),
        documentos: [],
        telefones: [],
      },
    } as CreatePatientRequest | UpdatePatientRequest;

    if (patientCode) {
      payload.paciente.codigo = patientCode;
    }

    if (patient.name) {
      const name = patient.name.replace(/'/g, '');
      payload.paciente.nome = normalize(name, true);
    }

    payload.paciente.documentos.push({
      numero: patient.cpf,
      tipoDocumento: 0,
    });

    if (patient.identityNumber) {
      payload.paciente.documentos.push({
        numero: patient.identityNumber,
        tipoDocumento: 1,
      });
    }

    if (patient.cellPhone) {
      const cellPhone = formatPhone(patient.cellPhone, true);

      if (cellPhone) {
        payload.paciente.telefones.push({
          ddd: cellPhone.slice(0, 2),
          numero: cellPhone.slice(2, cellPhone.length),
          tipoTelefone: 1,
        });
      }
    }

    // só manda phone se existir e for diferente de cellphone
    if (patient.phone && patient.phone !== patient.cellPhone) {
      const phone = formatPhone(patient.phone, true);

      if (phone) {
        payload.paciente.telefones.push({
          ddd: phone.slice(0, 2),
          numero: phone.slice(2, phone.length),
          tipoTelefone: 0,
        });
      }
    }

    if (patient.weight) {
      payload.paciente.peso = String(patient.weight);
    }

    if (patient.height) {
      payload.paciente.altura = String(patient.height);
    }

    if (patient.email) {
      payload.paciente.email = patient.email;
    }

    if (patient.skinColor) {
      payload.paciente.cor = patient.skinColor;
    }

    return payload;
  }

  public async createPatient(
    integration: IntegrationDocument,
    { patient, organizationUnit }: CreatePatient,
  ): Promise<Patient | null> {
    const payload: CreatePatientRequest = await this.createPatientPayload(integration, patient);

    if (!organizationUnit) {
      const organizationUnits = await this.entitiesService.getActiveEntities(
        EntityType.organizationUnit,
        {},
        integration._id,
      );

      if (organizationUnits?.length < 1) {
        throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'Not found valid organizations');
      }

      const validOrganization = organizationUnits.find((organizationUnit) => organizationUnit.canView);

      if (validOrganization) {
        payload.codigoUnidade = validOrganization.code;
      } else {
        payload.codigoUnidade = organizationUnits[0].code;
      }
    } else {
      payload.codigoUnidade = organizationUnit.code;
    }

    try {
      const data: CMResponsePlain<CreatePatientResponse> = await this.cmApiService.createPatient(integration, payload);
      if (!data?.result || (data.type === 'error' && data.error?.includes('cadastrado'))) {
        return HTTP_ERROR_THROWER(HttpStatus.CONFLICT, 'Patient already exists');
      }

      const patient = this.cmHelpersService.replacePatient(data.result);

      if (patient) {
        await this.integrationCacheUtilsService.setPatientCache(integration, patient.code, patient.cpf, patient);
      }

      return patient;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('CmIntegrationService.createPatient', error);
    }
  }

  public async cancelSchedule(integration: IntegrationDocument, cancelSchedule: CancelSchedule): Promise<OkResponse> {
    const { patientCode, procedure } = cancelSchedule;
    const { codeIntegration } = await this.credentialsHelper.getConfig<CMCredentialsResponse>(integration);

    const payload: CancelAppointmentRequest = {
      codigosClientes: [codeIntegration],
      codigoAgendamento: cancelSchedule.appointmentCode,
      codigoPaciente: patientCode,
      procedimento: {
        codigoEspecialidade: procedure?.specialityCode || null,
        codigo: null,
        tipoEspecialidade: procedure?.specialityType || null,
      },
    };

    if (procedure?.code) {
      const procedureData = this.cmHelpersService.getCompositeProcedureCode(integration, procedure.code);
      payload.procedimento.codigo = procedureData.code;

      if (!payload.procedimento.codigoEspecialidade) {
        payload.procedimento.codigoEspecialidade = procedureData.specialityCode;
      }

      if (!payload.procedimento.tipoEspecialidade) {
        payload.procedimento.tipoEspecialidade = procedureData.specialityType;
      }
    }

    try {
      const data: CMResponsePlain<CancelAppointmentResponse[]> = await this.cmApiService.cancelAppointment(
        integration,
        payload,
      );
      if (!data?.[0].result) {
        return { ok: false };
      }

      return { ok: true };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('CmIntegrationService.cancelAppointment', error);
    }
  }

  public async confirmSchedule(
    integration: IntegrationDocument,
    confirmSchedule: ConfirmSchedule,
  ): Promise<OkResponse> {
    const { patientCode, appointmentDate, specialityType, appointmentCode } = confirmSchedule;
    const { codeIntegration } = await this.credentialsHelper.getConfig<CMCredentialsResponse>(integration);

    try {
      const requestParams: AppointmentConfirmationRequestParams = {
        codigosClientes: codeIntegration,
        idERP: appointmentCode,
        idPaciente: patientCode,
        fonte: 'Confirmado via botdesigner',
        data: moment(appointmentDate).format('YYYY-MM-DD HH:mm:ss'),
        tipoEC: specialityType,
      };

      const patient = await this.integrationCacheUtilsService.getPatientFromCache(integration, patientCode);
      if (patient?.name) {
        requestParams.nomePaciente = patient.name;
      }

      await this.cmApiService.confirmAppointment(integration, requestParams);

      return { ok: true };
    } catch (error) {
      // api lança exceção customizada para lançar um ok na rota
      if (error?.status === HttpStatus.CONFLICT) {
        return { ok: true };
      }

      throw INTERNAL_ERROR_THROWER('CmIntegrationService.confirmAppointment', error);
    }
  }

  // @TODO: este método deve morrer, está dentro do appointmentService
  // não saiu ainda pq o correlationFilterData da cm usa códigos compostos
  private async transformAppointments(
    integration: IntegrationDocument,
    rawAppointments: RawAppointment[],
  ): Promise<Appointment[]> {
    const appointments: Appointment[] = [];

    for await (const appointment of rawAppointments) {
      const correlationFilter: CorrelationFilterByKey = {
        organizationUnit: appointment.organizationUnitId,
        procedure: appointment.procedureId,
        doctor: appointment.doctorId,
        insurance: appointment.insuranceId,
        planCategory: appointment.planCategoryId,
        insurancePlan: appointment.insurancePlanId,
        insuranceSubPlan: appointment.insuranceSubPlanId,
        speciality: appointment.specialityId,
        appointmentType: appointment.appointmentTypeId,
        typeOfService: appointment.typeOfServiceId,
      };

      const correlationData = await this.createCorrelationFilterData(correlationFilter, integration);

      const replacedAppointment: Appointment = {
        appointmentCode: appointment.appointmentCode,
        appointmentDate: appointment.appointmentDate,
        duration: appointment.duration,
        status: AppointmentStatus.scheduled,
        data: appointment.data,
        isFollowUp: appointment.isFollowUp,
        guidance: appointment.guidance,
        observation: appointment.observation,
        warning: appointment.warning,
        organizationUnitAdress: appointment.organizationUnitAdress,
      };

      Object.keys(EntityType).map((key) => {
        const defaultKeyData = appointment[`${key}Default`];

        if (correlationData[key]) {
          replacedAppointment[key] = correlationData[key];
        } else if (defaultKeyData) {
          replacedAppointment[key] = defaultKeyData;
        }
      });

      // Para não permitir reagendamento no agendamento do tipo retorno
      if (replacedAppointment.isFollowUp && replacedAppointment[EntityType.appointmentType]) {
        replacedAppointment[EntityType.appointmentType].canReschedule = false;
      }

      appointments.push(replacedAppointment);
    }

    return appointments;
  }

  async getMinifiedPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<MinifiedAppointments> {
    const { patientCode, startDate, endDate } = patientSchedules;
    const minifiedSchedules: MinifiedAppointments = {
      appointmentList: [],
      lastAppointment: null,
      nextAppointment: null,
    };

    try {
      const { codeIntegration } = await this.credentialsHelper.getConfig<CMCredentialsResponse>(integration);
      const data: CMResponseArray<PatientScheduleResponse> = await this.cmApiService.getPatientAppointments(
        integration,
        {
          codigosClientes: codeIntegration,
          codigoPaciente: patientCode,
          agendamentosFechados: true,
        },
      );

      if (!data?.result) {
        await this.integrationCacheUtilsService.setPatientSchedulesCache(integration, patientCode, {
          minifiedSchedules,
          schedules: [],
        });

        return minifiedSchedules;
      }

      const schedules: Appointment[] = await Promise.all(
        data.result
          .filter((appointment) => {
            let canReturnAppointment = true;

            if (appointment.estadoAgendamento === 'Cancelado' || appointment.estadoAgendamento === 'Não Executado') {
              return false;
            }

            if (!startDate && !endDate) {
              return true;
            }

            canReturnAppointment = betweenDate(appointment.horario?.dataHoraAgendamento, startDate, endDate);
            return canReturnAppointment;
          })
          .map(async (cmAppointment) => {
            // removendo offset de horário vindo do servidor
            if (cmAppointment.horario?.dataHoraAgendamento) {
              cmAppointment.horario.dataHoraAgendamento = moment(cmAppointment.horario.dataHoraAgendamento).format(
                'YYYY-MM-DDTHH:mm:ss',
              );
            }

            const [appointment] = await this.transformAppointments(integration, [
              await this.cmHelpersService.createPatientApointmentObject(integration, cmAppointment),
            ]);

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

            minifiedSchedules.appointmentList.push({
              appointmentCode: appointment.appointmentCode,
              appointmentDate: appointment.appointmentDate,
              appointmentType: appointment.procedure?.specialityType,
              actions: flowActions,
            });

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
      throw INTERNAL_ERROR_THROWER('CmIntegrationService.getMinifiedPatientSchedules', error);
    }
  }

  public async getPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules?: PatientSchedules,
  ): Promise<Appointment[]> {
    const { patientCode, startDate, endDate } = patientSchedules;
    const { codeIntegration } = await this.credentialsHelper.getConfig<CMCredentialsResponse>(integration);

    const params: PatientScheduleRequestParams = {
      codigosClientes: codeIntegration,
      codigoPaciente: patientCode,
      agendamentosFechados: true,
    };

    try {
      const data: CMResponseArray<PatientScheduleResponse> = await this.cmApiService.getPatientAppointments(
        integration,
        params,
      );
      if (!data?.result) {
        return [];
      }

      const rawAppointments: RawAppointment[] = await Promise.all(
        data.result
          .filter((appointment) => {
            let canReturnAppointment = true;

            if (appointment.estadoAgendamento === 'Cancelado' || appointment.estadoAgendamento === 'Não Executado') {
              return false;
            }

            if (!startDate && !endDate) {
              return true;
            }

            canReturnAppointment = betweenDate(appointment.horario?.dataHoraAgendamento, startDate, endDate);
            return canReturnAppointment;
          })
          .map(async (cmAppointment) => {
            // removendo offset de horário vindo do servidor
            if (cmAppointment.horario?.dataHoraAgendamento) {
              cmAppointment.horario.dataHoraAgendamento = moment(cmAppointment.horario.dataHoraAgendamento).format(
                'YYYY-MM-DDTHH:mm:ss',
              );
            }
            return await this.cmHelpersService.createPatientApointmentObject(integration, cmAppointment);
          }),
      );

      const appointments = await this.transformAppointments(integration, rawAppointments);
      return orderBy(appointments, 'appointmentDate', 'asc');
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('CmIntegrationService.getPatientAppointments', error);
    }
  }

  private async createGetAppointmentsRequestObject(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
  ): Promise<{
    payload: SimplifiedListScheduleRequest;
    rawRedisKey: { [key: string]: string };
    correlation: Partial<CorrelationFilter>;
    interAppointmentPeriodApplied: number;
    doctorsScheduledMapped: Map<string, number>;
  }> {
    const { filter, period, patient, dateLimit } = availableSchedules;
    let { fromDay, untilDay } = availableSchedules;
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
            availableSchedules.filter,
            patient.code,
            this.getMinifiedPatientSchedules.bind(this),
            this.getPatientFollowUpSchedules.bind(this),
            undefined,
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

    const { codeIntegration } = await this.credentialsHelper.getConfig<CMCredentialsResponse>(integration);
    const { procedure, insurance, speciality, typeOfService } = availableSchedules.filter;
    const procedureData = this.cmHelpersService.getCompositeProcedureCode(integration, procedure?.code);
    const dateFormat = 'YYYY-MM-DDTHH:mm:ss';

    const payload: SimplifiedListScheduleRequest = {
      codigosClientes: [codeIntegration],
      codigosUnidade: [],
      medicos: [],
      procedimento: {
        codigo: procedureData?.code || null,
        tipoEspecialidade: (procedure?.specialityType || speciality?.specialityType) as 'C' | 'E',
      },
      convenio: {
        codigo: insurance.code,
      },
      dataHoraInicio: moment().add(fromDay, 'days').startOf('day').format(dateFormat),
      dataHoraFim: moment()
        .add(fromDay + untilDay, 'days')
        .endOf('day')
        .format(dateFormat),
    };

    if (dateLimit) {
      // se inicio do periodo é maior que data limite, retorna exception pois não tem nada para retornar
      if (moment(payload.dataHoraInicio).valueOf() > moment(dateLimit).valueOf()) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_GATEWAY,
          {
            message: `dateLimit effect : initialDate ${payload.dataHoraInicio}`,
          },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      // se fim do periodo é maior que data limite, usa a data limite como data final
      if (moment(payload.dataHoraFim).valueOf() > moment(dateLimit).valueOf()) {
        payload.dataHoraFim = moment(dateLimit).endOf('day').format(dateFormat);
      }
    }

    let validTypeOfService: TypeOfServiceEntityDocument = typeOfService;

    if (typeOfService) {
      const entity: TypeOfServiceEntityDocument = await this.entitiesService.getEntityByCode(
        typeOfService.code,
        EntityType.typeOfService,
        integration._id,
      );

      if (entity?.params?.referenceTypeOfService) {
        validTypeOfService = entity;

        // se o tipo de serviço tiver como referenceTypeOfService = custom, significa
        // que o próprio codigo da entidade é o código do depara respectivo da CM
        // Neste caso sempre enviar o código que retornou do horario para garantir que irá retornar os horários
        // conforme selecao do tipo de servico
        if (entity.params.referenceTypeOfService === TypeOfService.custom) {
          payload.tipoClassificacao = typeOfService.code;
        } else {
          payload.tipoClassificacao = this.cmHelpersService.typeOfServiceToCmTypeOfService(
            entity.params.referenceTypeOfService,
          );
        }
      }
    } else if (integration.rules?.runFirstScheduleRule) {
      try {
        const cmTypeOfService = await this.getTypeOfService(integration, patient?.code, filter);
        payload.tipoClassificacao = cmTypeOfService;

        const entity: TypeOfServiceEntityDocument = await this.entitiesService
          .getCollection(EntityType.typeOfService)
          .findOne({
            'params.referenceTypeOfService': this.cmHelpersService.cmTypeOfServiceToTypeOfService(cmTypeOfService),
            canView: true,
            integrationId: castObjectId(integration._id),
            $or: [{ activeErp: true }, { activeErp: { $exists: false } }, { activeErp: { $eq: null } }],
          });

        if (entity?.params?.referenceTypeOfService) {
          validTypeOfService = entity;
        }
      } catch (error) {
        console.log('CmService.createGetAppointmentsRequestObject', error);
      }
    }

    if (procedureData.areaCode) {
      payload.procedimento.codigoArea = procedureData.areaCode;
    }

    if (procedureData.lateralityCode) {
      payload.procedimento.lateralidade = procedureData.lateralityCode;
    }

    if (speciality) {
      payload.procedimento.codigoEspecialidade = speciality.code;
    }

    const customRedisKey: { [key: string]: string } = {
      procedure: procedure?.code || null,
      speciality: procedure?.specialityCode || speciality?.code || null,
      specialityType: procedure?.specialityType || speciality?.specialityType || null,
      insurance: insurance.code,
    };

    if (filter?.organizationUnit?.code) {
      customRedisKey[EntityType.organizationUnit] = filter.organizationUnit.code;
      payload.codigosUnidade.push(filter.organizationUnit.code);
    } else if (filter?.organizationUnitLocation?._id && filter.organizationUnitLocation?.references?.length) {
      const organizationUnits = await this.entitiesService.getCollection(EntityType.organizationUnit).find({
        _id: { $in: filter.organizationUnitLocation.references.map((ref) => castObjectId(ref.refId)) },
        integrationId: castObjectId(integration._id),
        canView: true,
        $or: [{ activeErp: true }, { activeErp: { $exists: false } }, { activeErp: { $eq: null } }],
      });

      if (organizationUnits.length) {
        payload.codigosUnidade = organizationUnits.map((organizationUnit) => organizationUnit.code);
      }
    }

    if (filter?.insurancePlan?.code) {
      customRedisKey[EntityType.insurancePlan] = filter.insurancePlan.code;
      payload.convenio.codigoPlano = filter.insurancePlan.code;
    }

    if (filter?.insuranceSubPlan?.code) {
      customRedisKey[EntityType.insuranceSubPlan] = filter.insuranceSubPlan.code;
      payload.convenio.codigoSubplano = filter.insuranceSubPlan.code;
    }

    if (filter?.doctor?.code) {
      customRedisKey[EntityType.doctor] = filter.doctor.code;
      payload.medicos.push({ codigo: filter.doctor.code });
    }

    if (filter?.planCategory?.code) {
      customRedisKey[EntityType.planCategory] = filter.planCategory.code;
      payload.convenio.codigoCategoria = filter.planCategory.code;
    }

    if (filter?.occupationArea?._id) {
      customRedisKey[EntityType.occupationArea] = castObjectIdToString(filter.occupationArea._id);
    }

    if (filter?.organizationUnitLocation?._id) {
      customRedisKey[EntityType.organizationUnitLocation] = castObjectIdToString(filter.organizationUnitLocation._id);
    }

    const { start, end } = this.appointmentService.getPeriodFromPeriodOfDay(integration, {
      periodOfDay: availableSchedules.periodOfDay,
      limit: availableSchedules.limit,
      sortMethod: availableSchedules.sortMethod,
      randomize: availableSchedules.randomize,
      period: availableSchedules.period,
    });

    if (period) {
      payload.horaDiaInicio = start;
      payload.horaDiaFim = end;
    }

    // se não tem médico para filtar tenta encontrar médicos da área de atuação selecionada para
    // enviar na request, se não tiver nenhuma não filtra
    if (!filter?.doctor?.code && filter?.occupationArea?._id) {
      const occupationArea = (await this.entitiesService.getEntityById(
        castObjectId(filter.occupationArea._id),
        EntityType.occupationArea,
        integration._id,
      )) as OccupationAreaEntityDocument;

      if (occupationArea?.params?.hasRelationshipWithDoctors) {
        const entities = await this.entitiesService.getCollection(EntityType.doctor).find({
          'references.refId': { $in: [filter.occupationArea._id] },
          'references.type': EntityType.occupationArea,
          canView: true,
          canSchedule: true,
          integrationId: castObjectId(integration._id),
          $or: [{ activeErp: true }, { activeErp: { $exists: false } }, { activeErp: { $eq: null } }],
        });

        if (!entities.length) {
          throw HTTP_ERROR_THROWER(
            HttpStatus.BAD_GATEWAY,
            {
              message: 'occupationArea: No doctors found',
            },
            HttpErrorOrigin.INTEGRATION_ERROR,
          );
        }

        customRedisKey[EntityType.occupationArea] = castObjectIdToString(occupationArea._id);
        payload.medicos.push(...entities.map((entity) => ({ codigo: entity.code })));
      }
    }

    if (patient?.bornDate) {
      const patientAge = String(moment().diff(patient.bornDate, 'years'));
      customRedisKey['patientAge'] = patientAge;
      payload.idadePaciente = patientAge;
    }

    if (patient?.sex) {
      customRedisKey['patientSex'] = patient.sex;
      payload.generoPaciente = patient.sex;
    }

    return {
      payload,
      rawRedisKey: sortByKeys(customRedisKey),
      correlation: { typeOfService: validTypeOfService },
      interAppointmentPeriodApplied,
      doctorsScheduledMapped,
    };
  }

  public async splitGetAvailableSchedules(
    payload: SimplifiedListScheduleRequest,
    availableSchedules: ListAvailableSchedules,
    integration: IntegrationDocument,
    interAppointmentPeriod: number,
  ): Promise<CMResponsePlain<SimplifiedListScheduleResponse>> {
    const maxRangeDays = integration.rules?.limitOfDaysToSplitRequestInScheduleSearch || 30;
    const dateFormat = 'YYYY-MM-DDTHH:mm:ss';

    if (availableSchedules.dateLimit) {
      const diff = moment(availableSchedules.dateLimit).diff(moment(), 'days');
      availableSchedules.untilDay = diff;
    }

    const range = availableSchedules.untilDay;

    if (range <= maxRangeDays) {
      return await this.cmApiService.getAppointments(integration, payload);
    }

    const requestsNumber = Math.ceil(range / maxRangeDays);

    const responsePromises = [];
    const response: CMResponsePlain<SimplifiedListScheduleResponse> = {
      result: {
        horarios: [],
        medicos: {},
      },
    };

    const fromDay = interAppointmentPeriod || availableSchedules.fromDay;

    for (let stack = 0; stack < requestsNumber; stack++) {
      const newFromDay = fromDay + stack * maxRangeDays;
      const untilDay = newFromDay + maxRangeDays;

      const dynamicPayload = {
        ...payload,
        dataHoraInicio: moment().add(newFromDay, 'days').startOf('day').format(dateFormat),
        dataHoraFim: moment().add(untilDay, 'days').endOf('day').format(dateFormat),
      };

      responsePromises.push(this.cmApiService.getAppointments(integration, dynamicPayload));
    }

    await Promise.allSettled(responsePromises).then((responses) => {
      responses
        .filter((response) => response.status === 'fulfilled')
        .forEach(({ value }: PromiseFulfilledResult<CMResponsePlain<SimplifiedListScheduleResponse>>) => {
          value?.result?.horarios
            // Filtra apenas horários futuros e normaliza horario API (+3h)
            ?.filter((item) => moment(item.dataHoraAgendamento).add(3, 'hours').isSameOrAfter(moment()))
            .forEach((item) => {
              item.dataHoraAgendamento = moment(item.dataHoraAgendamento).format('YYYY-MM-DDTHH:mm:ss');
              response.result.horarios.push(item);
            });

          Object.keys(value?.result?.medicos ?? {})?.forEach((doctorId) => {
            response.result.medicos[doctorId] = value?.result?.medicos[doctorId];
          });
        });
    });

    return response;
  }

  public async getAvailableSchedules(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
  ): Promise<ListAvailableSchedulesResponse> {
    try {
      const { filter } = availableSchedules;
      const {
        period,
        randomize,
        sortMethod = AppointmentSortMethod.default,
        patient,
        limit,
        periodOfDay,
      } = availableSchedules;
      const { payload, correlation, interAppointmentPeriodApplied, doctorsScheduledMapped } =
        await this.createGetAppointmentsRequestObject(integration, availableSchedules);

      let metadata: AvailableSchedulesMetadata = {
        interAppointmentPeriod: interAppointmentPeriodApplied,
      };

      const data = await this.splitGetAvailableSchedules(
        payload,
        availableSchedules,
        integration,
        interAppointmentPeriodApplied,
      );
      const result = data?.result;

      if (!result || !result.horarios || result?.horarios?.length === 0) {
        return { schedules: [], metadata };
      }

      try {
        // só aplica filtro se o código do tipo de serviço for maior ou igual a 0
        if (
          filter.typeOfService?.code &&
          Number.isInteger(Number(filter.typeOfService.code)) &&
          Number(filter.typeOfService.code) >= 0 &&
          filter.typeOfService.params?.referenceTypeOfService === TypeOfService.custom
        ) {
          result.horarios = result.horarios?.filter(
            (schedule) => schedule.codigoClassificacao === filter.typeOfService.code,
          );
        }
      } catch (error) {}

      const doctorsSet = new Set([]);
      let replacedAppointments: RawAppointment[] = [];

      // a rota retorna todos os medicos dos horários
      result.horarios?.forEach((app) => {
        if (app.idMedico) {
          doctorsSet.add(app.idMedico);
        }
      });

      const doctors: DoctorEntityDocument[] = await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        Array.from(doctorsSet),
        EntityType.doctor,
        { canSchedule: true },
      );

      const [matchedDoctors] = await this.flowService.matchEntitiesFlows({
        integrationId: integration._id,
        entities: doctors,
        targetEntity: FlowSteps.doctor,
        entitiesFilter: { ...availableSchedules.filter, ...correlation },
        filters: { patientBornDate: patient?.bornDate, patientSex: patient?.sex, patientCpf: patient?.cpf },
      });

      const validDoctors = this.entitiesFiltersService.filterEntitiesByParams(integration, matchedDoctors, {
        bornDate: patient?.bornDate,
      });

      const doctorsMap = validDoctors.reduce((map: { [key: string]: boolean }, doctor) => {
        map[doctor.code] = true;
        return map;
      }, {});

      if (availableSchedules.filter?.appointmentType?.code === SpecialityTypes.C) {
        result.horarios = result.horarios.filter((appointment) => appointment.idMedico);
      }

      result.horarios.forEach((appointment) => {
        const schedule = this.cmHelpersService.createScheduleObjectFromAvailableSchedules(integration, appointment, {
          ...availableSchedules.filter,
          ...correlation,
        });

        const filteredInterAppointmentSchedules = this.interAppointmentService.filterInterAppointmentByDoctorCode(
          integration,
          schedule,
          doctorsScheduledMapped,
          filter,
        );

        if (filteredInterAppointmentSchedules) {
          if (!appointment.idMedico || availableSchedules.filter?.appointmentType?.code === SpecialityTypes.E) {
            return replacedAppointments.push(filteredInterAppointmentSchedules);
          }

          if (doctorsMap[appointment.idMedico]) {
            replacedAppointments.push(filteredInterAppointmentSchedules);
          }
        }
      });

      try {
        ({ replacedAppointments, metadata } = await this.rulesHandlerService.removeSchedulesFilteredBySameDayRules(
          integration,
          availableSchedules,
          replacedAppointments,
          metadata,
          false,
          this.getMinifiedPatientSchedules.bind(this),
        ));
      } catch (error) {
        console.error(error);
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

      const validSchedules = await this.transformAppointments(integration, randomizedAppointments);
      return { schedules: validSchedules, metadata: { ...metadata, ...partialMetadata } };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('CmIntegrationService.getAppointments', error);
    }
  }

  private async getTypeOfService(
    integration: IntegrationDocument,
    patientCode: string,
    filter?: CorrelationFilter,
    isRetry?: boolean,
  ): Promise<CmTypeOfService> {
    if (!patientCode) {
      return CmTypeOfService.firstAppointment;
    }

    const patientSchedules = await this.integrationCacheUtilsService.getPatientSchedulesCache(integration, patientCode);

    if (!patientSchedules && !isRetry) {
      try {
        await this.getMinifiedPatientSchedules(integration, { patientCode });
        return this.getTypeOfService(integration, patientCode, filter, true);
      } catch (error) {
        throw INTERNAL_ERROR_THROWER('CmIntegrationService.getTypeOfService', error);
      }
    }

    if (patientSchedules?.schedules?.length === 0) {
      return CmTypeOfService.firstAppointment;
    }

    if (filter?.doctor) {
      const isFirstWithDoctor = !patientSchedules?.schedules.find((schedule) => {
        if (schedule.doctor?.code) {
          return schedule.doctor.code === String(filter.doctor.code);
        }
      });

      if (isFirstWithDoctor) {
        return CmTypeOfService.firstAppointment;
      }
    } else if (filter?.speciality?.code || filter?.procedure?.specialityCode) {
      const isFirstWithSpeciality = !patientSchedules?.schedules.find((schedule) => {
        if (schedule.speciality?.code) {
          return schedule.speciality.code === String(filter?.speciality?.code ?? filter?.procedure?.specialityCode);
        }
      });

      if (isFirstWithSpeciality) {
        return CmTypeOfService.firstAppointment;
      }
    }

    return CmTypeOfService.recurrence;
  }

  public async createSchedule(integration: IntegrationDocument, schedule: CreateSchedule): Promise<Appointment> {
    const { codeIntegration } = await this.credentialsHelper.getConfig<CMCredentialsResponse>(integration);
    const { appointment, insurance, organizationUnit, patient, procedure, doctor, typeOfService, speciality } =
      schedule;

    const payload: CreateAppointmentRequest = {
      codigosClientes: [codeIntegration],
      horario: {
        duracao: appointment.duration,
        dataHoraAgendamento: appointment.appointmentDate,
        codigo: appointment.code,
        unidade: {
          codigo: organizationUnit.code,
        },
        procedimento: {
          codigo: null,
          codigoEspecialidade: procedure?.specialityCode || speciality?.code,
          tipoEspecialidade: procedure?.specialityType || speciality?.specialityType,
        },
      },
      convenio: {
        codigo: insurance.code,
      },
      codigoPaciente: patient.code,
    };

    if (procedure?.code) {
      const procedureData = this.cmHelpersService.getCompositeProcedureCode(integration, procedure.code);

      payload.horario.procedimento = {
        codigo: procedureData.code,
        codigoEspecialidade: procedure.specialityCode || speciality?.code,
        tipoEspecialidade: procedure.specialityType || speciality?.specialityType,
      };

      if (procedureData.areaCode) {
        payload.horario.procedimento.codigoArea = procedureData.areaCode;
      }

      if (procedureData.lateralityCode) {
        payload.horario.procedimento.lateralidade = procedureData.lateralityCode;
      }
    }

    if (typeOfService?.code) {
      const entity: TypeOfServiceEntityDocument = await this.entitiesService.getEntityByCode(
        typeOfService.code,
        EntityType.typeOfService,
        integration._id,
      );

      if (entity?.params?.referenceTypeOfService) {
        // se for custom, enviar o mesmo código de serviço para garantir que será enviado
        // o mesmo dado que foi selecionado pela arvore
        if (entity.params.referenceTypeOfService === TypeOfService.custom) {
          payload.tipoClassificacao = typeOfService.code;
        } else {
          payload.tipoClassificacao = this.cmHelpersService.typeOfServiceToCmTypeOfService(
            entity.params.referenceTypeOfService,
          );
        }
      }
    }

    if (insurance.planCategoryCode) {
      payload.convenio.codigoCategoria = insurance.planCategoryCode;
    }

    if (insurance.subPlanCode) {
      payload.convenio.codigoSubplano = insurance.subPlanCode;
    }

    if (insurance.planCode) {
      payload.convenio.codigoPlano = insurance.planCode;
    }

    if (doctor?.code) {
      payload.horario.medico = {
        codigo: doctor.code,
      };
    }

    if (patient.insuranceNumber) {
      payload.convenio.carteirinha = removeBlankSpaces(patient.insuranceNumber);
    }

    try {
      const data: CMResponsePlain<CreateAppointmentResponse> = await this.cmApiService.createAppointment(
        integration,
        payload,
      );

      if (!data?.result || Object.values(data?.result).every((v) => v === null)) {
        const metadata = contextService.get('req:default-headers');
        Sentry.captureEvent({
          message: `ERROR:${integration._id}:${integration.name}:CM-request:createSchedule`,
          extra: {
            integrationId: integration._id,
            message: 'resultado vazio na resposta do agendamento',
            payload,
          },
          user: {
            cvId: metadata?.conversationId,
            wsId: metadata?.workspaceId,
            mbId: metadata?.memberId,
          },
        });

        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          {
            message: 'An error occurred',
          },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      const appointment: Appointment = {
        appointmentCode: data.result?.codigo,
        appointmentDate: moment(data.result?.horario?.dataHoraAgendamento).format('YYYY-MM-DDTHH:mm:ss'),
        duration: data.result?.horario?.duracao,
        status: AppointmentStatus.scheduled,
      };

      try {
        if (integration.rules?.sendGuidanceOnCreateSchedule) {
          if (data.result?.observacao) {
            appointment.guidance = data.result.observacao?.replace(new RegExp('<[^>]*>', 'g'), '');
          }

          if (data.result?.horario?.procedimento?.orientacao && !data.result?.observacao) {
            appointment.guidance = data.result.horario.procedimento.orientacao.replace(new RegExp('<[^>]*>', 'g'), '');
          }
        }
      } catch (error) {
        console.log(error);
      }

      return appointment;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('CmIntegrationService.createAppointment', error);
    }
  }

  private async getOrganizationUnits(
    payload: OrganizationUnitRequest,
    integration: IntegrationDocument,
  ): Promise<IOrganizationUnitEntity[]> {
    try {
      const data = await this.cmApiService.resourceListRequest<OrganizationUnitResponse>(
        integration,
        payload,
        EntityType.organizationUnit,
      );

      return (
        data?.result?.map((resource) => ({
          code: resource.codigo,
          integrationId: castObjectId(integration._id),
          name: resource.nome?.trim(),
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
          data: {
            address: resource.endereco?.trim(),
          },
        })) || []
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('CmIntegrationService.getOrganizationUnits', error);
    }
  }

  private async getInsurances(
    payload: InsuranceRequest,
    integration: IntegrationDocument,
  ): Promise<IInsuranceEntity[]> {
    try {
      const data = await this.cmApiService.resourceListRequest<InsuranceResponse>(
        integration,
        payload,
        EntityType.insurance,
      );

      return (
        data?.result?.map((resource) => ({
          code: resource.codigo,
          integrationId: castObjectId(integration._id),
          name: resource.nome?.trim(),
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
        })) || []
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('CmIntegrationService.getInsurances', error);
    }
  }

  private async getInsurancePlans(
    payload: InsurancePlanRequest,
    integration: IntegrationDocument,
  ): Promise<IInsurancePlanEntity[]> {
    try {
      const data = await this.cmApiService.resourceListRequest<InsurancePlanResponse>(
        integration,
        payload,
        EntityType.insurancePlan,
      );

      return (
        data?.result?.map((resource) => ({
          code: resource.codigo,
          integrationId: castObjectId(integration._id),
          name: resource.nome?.trim(),
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
          insuranceCode: resource.codigoConvenio,
        })) || []
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('CmIntegrationService.getInsurancePlans', error);
    }
  }

  private async getDoctors(payload: DoctorRequest, integration: IntegrationDocument): Promise<IDoctorEntity[]> {
    try {
      const data = await this.cmApiService.resourceListRequest<DoctorResponse>(integration, payload, EntityType.doctor);

      return (
        data?.result?.map((resource) => ({
          code: resource.codigo,
          integrationId: castObjectId(integration._id),
          name: resource.nome?.trim(),
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
        })) || []
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('CmIntegrationService.getDoctors', error);
    }
  }

  private async getSpecialities(
    payload: SpecialityRequest,
    integration: IntegrationDocument,
  ): Promise<ISpecialityEntity[]> {
    try {
      const data = await this.cmApiService.resourceListRequest<SpecialityResponse>(
        integration,
        payload,
        EntityType.speciality,
      );

      return (
        data?.result?.map((resource) => ({
          code: resource.codigo,
          integrationId: castObjectId(integration._id),
          name: resource.nome?.trim(),
          activeErp: true,
          source: EntitySourceType.erp,
          version: EntityVersionType.production,
          specialityType: resource.tipo as SpecialityTypes,
        })) || []
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('CmIntegrationService.getSpecialities', error);
    }
  }

  private async getProcedures(
    payload: ProcedureRequest,
    integration: IntegrationDocument,
  ): Promise<IProcedureEntity[]> {
    try {
      const data = await this.cmApiService.resourceListRequest<ProcedureResponse>(
        integration,
        payload,
        EntityType.procedure,
      );

      return (
        data?.result?.map((resource) => {
          const entity: IProcedureEntity = {
            code: this.cmHelpersService.createCompositeProcedureCode(
              integration,
              resource.codigo,
              resource.codigoEspecialidade,
              resource.tipoEspecialidade,
              resource.codigoArea,
              resource.lateralidade,
            ),
            integrationId: castObjectId(integration._id),
            name: resource.nome?.trim(),
            source: EntitySourceType.erp,
            activeErp: true,
            version: EntityVersionType.production,
            specialityType: resource.tipoEspecialidade as SpecialityTypes,
            specialityCode: resource.codigoEspecialidade,
            tuss: resource.tuss,
          };

          if (resource.codigoArea) {
            entity.data = {
              ...(entity.data ?? {}),
              areaCode: resource?.codigoArea,
            };
          }

          if (resource.codigoClassificacao) {
            entity.data = {
              ...(entity.data ?? {}),
              classificationCode: resource?.codigoClassificacao,
            };
          }

          if (resource.lateralidade) {
            entity.data = {
              ...(entity.data ?? {}),
              laterality: resource?.lateralidade,
            };
          }

          return entity;
        }) || []
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('CmIntegrationService.getProcedures', error);
    }
  }

  private async getPlanCategories(
    payload: PlanCategoryRequest,
    integration: IntegrationDocument,
  ): Promise<IInsurancePlanCategoryEntity[]> {
    try {
      const data = await this.cmApiService.resourceListRequest<PlanCategoryResponse>(
        integration,
        payload,
        EntityType.planCategory,
      );

      return (
        data?.result?.map((resource) => ({
          code: resource.codigo,
          integrationId: castObjectId(integration._id),
          name: resource.nome?.trim(),
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
          insuranceCode: resource.codigoConvenio,
          insurancePlanCode: resource?.codigoPlano || null,
        })) || []
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('CmIntegrationService.getPlanCategories', error);
    }
  }

  private async getInsuranceSubPlans(
    payload: InsuranceSubPlanRequest,
    integration: IntegrationDocument,
  ): Promise<IInsuranceSubPlanEntity[]> {
    try {
      const data = await this.cmApiService.resourceListRequest<InsuranceSubPlanResponse>(
        integration,
        payload,
        EntityType.insuranceSubPlan,
      );

      return (
        data?.result?.map((resource) => ({
          code: resource.codigo,
          integrationId: castObjectId(integration._id),
          name: resource.nome?.trim(),
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
          insuranceCode: resource.codigoConvenio,
          insurancePlanCode: resource.codigoPlano,
        })) || []
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('CmIntegrationService.getInsuranceSubPlans', error);
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
      throw INTERNAL_ERROR_THROWER('CmIntegrationService.getTypeOfServices', error);
    }
  }

  private async getAppointmentTypes(_, integration: IntegrationDocument): Promise<IAppointmentTypeEntity[]> {
    try {
      return (
        defaultAppointmentTypes?.map((resource) => ({
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
      throw INTERNAL_ERROR_THROWER('CmIntegrationService.getAppointmentTypes', error);
    }
  }

  private resourceFilters(filters: Partial<CorrelationFilter | EntityFilters>): { [key: string]: any } {
    if (!filters || Object.keys(filters).length === 0) {
      return {};
    }
    const resourceFilters: { [key: string]: any } = {};

    Object.values(EntityType).map((k) => {
      if (filters.hasOwnProperty(k) && filters?.[k]?.code) {
        resourceFilters[k] = filters[k].code;
      }
    });
    return resourceFilters;
  }

  public async extractSingleEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    filter?: CorrelationFilter,
    cache: boolean = false,
  ): Promise<EntityTypes[]> {
    if (entityType === EntityType.speciality) {
      return await this.extractEntity(integration, entityType, filter, cache, false);
    }

    return await this.extractEntity(integration, entityType, filter, cache);
  }

  public async extractEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    filters?: CorrelationFilter,
    cache?: boolean,
    onlyActiveToScheduling?: boolean,
  ): Promise<EntityTypes[]> {
    const { codeIntegration } = await this.credentialsHelper.getConfig<CMCredentialsResponse>(integration);

    try {
      const payload: any = {
        codigosClientes: [codeIntegration],
        ativoAgendamento: true,
        procedimento: {},
        procedimentoEspecialidade: {},
        convenio: {},
      };

      if (onlyActiveToScheduling !== undefined) {
        payload.ativoAgendamento = onlyActiveToScheduling;
      }

      if (filters) {
        if (
          filters?.organizationUnitLocation?.code &&
          filters.organizationUnitLocation?.references?.length &&
          entityType !== EntityType.organizationUnitLocation
        ) {
          const organizationUnits = await this.entitiesService.getCollection(EntityType.organizationUnit).find({
            _id: { $in: filters.organizationUnitLocation.references.map((ref) => castObjectId(ref.refId)) },
            integrationId: castObjectId(integration._id),
            canView: true,
            $or: [{ activeErp: true }, { activeErp: { $exists: false } }, { activeErp: { $eq: null } }],
          });

          if (organizationUnits.length) {
            payload.codigosUnidade = organizationUnits.map((organizationUnit) => organizationUnit.code);
          }
        } else if (filters.hasOwnProperty(EntityType.organizationUnit)) {
          payload.codigosUnidade = [filters[EntityType.organizationUnit].code];
        }

        if (filters.hasOwnProperty(EntityType.speciality)) {
          if (entityType === EntityType.procedure) {
            payload.procedimentoEspecialidade.codigoEspecialidade = filters[EntityType.speciality].code;
          } else {
            if (entityType !== EntityType.planCategory && entityType !== EntityType.insuranceSubPlan) {
              payload.procedimento.codigoEspecialidade = filters[EntityType.speciality].code;
            }
          }
        }

        if (filters.hasOwnProperty(EntityType.procedure)) {
          if (
            entityType !== EntityType.planCategory &&
            entityType !== EntityType.insurancePlan &&
            entityType !== EntityType.insuranceSubPlan
          ) {
            if (filters?.hasOwnProperty(EntityType.procedure) && integration.rules?.useProcedureWithCompositeCode) {
              const procedureData = this.cmHelpersService.getCompositeProcedureCode(
                integration,
                filters[EntityType.procedure].code,
              );

              payload.procedimento.codigo = procedureData.code;
            } else {
              payload.procedimento.codigo = filters[EntityType.procedure].code;
            }
          }
        }

        if (filters.hasOwnProperty(EntityType.insurance)) {
          if (
            entityType === EntityType.insurancePlan ||
            entityType === EntityType.planCategory ||
            entityType === EntityType.insuranceSubPlan
          ) {
            payload.codigoConvenio = filters[EntityType.insurance].code;
          } else {
            payload.convenio.codigo = filters[EntityType.insurance].code;
          }
        }

        if (filters.hasOwnProperty(EntityType.insurancePlan)) {
          if (entityType === EntityType.planCategory || entityType === EntityType.insuranceSubPlan) {
            payload.codigoPlano = filters[EntityType.insurancePlan].code;
          } else {
            payload.convenio.codigoPlano = filters[EntityType.insurancePlan].code;
          }
        }

        if (filters.hasOwnProperty(EntityType.appointmentType) || filters.hasOwnProperty(EntityType.procedure)) {
          const appointmentTypeCode =
            filters[EntityType.appointmentType]?.code ?? filters[EntityType.procedure]?.specialityType;

          if (entityType === EntityType.procedure) {
            payload.procedimentoEspecialidade.tipoEspecialidade = appointmentTypeCode;
          } else {
            if (
              entityType !== EntityType.planCategory &&
              entityType !== EntityType.insuranceSubPlan &&
              entityType !== EntityType.organizationUnit
            ) {
              payload.procedimento.tipoEspecialidade = appointmentTypeCode;
            }
          }
        }

        // setar dados do código composto
        if (
          filters.hasOwnProperty(EntityType.procedure) &&
          integration.rules?.useProcedureWithCompositeCode &&
          entityType === EntityType.doctor
        ) {
          const procedureData = this.cmHelpersService.getCompositeProcedureCode(
            integration,
            filters[EntityType.procedure].code,
          );

          if (procedureData.areaCode) {
            payload.procedimento.codigoArea = procedureData.areaCode;
          }
        }
      }

      if (Object.keys(payload.procedimento).length === 0) {
        delete payload.procedimento;
      }

      if (Object.keys(payload.procedimentoEspecialidade).length === 0) {
        delete payload.procedimentoEspecialidade;
      }

      if (Object.keys(payload.convenio).length === 0) {
        delete payload.convenio;
      }

      const resourceFilters = this.resourceFilters(filters);

      if (cache) {
        const resourceCache = await this.integrationCacheUtilsService.getCachedEntitiesFromRequest(
          entityType,
          integration,
          resourceFilters,
        );

        if (resourceCache) {
          return resourceCache || [];
        }
      }

      const getResource = async () => {
        switch (entityType) {
          case EntityType.organizationUnit:
            return await this.getOrganizationUnits(payload, integration);

          case EntityType.insurance:
            return await this.getInsurances(payload, integration);

          case EntityType.insurancePlan:
            return await this.getInsurancePlans(payload, integration);

          case EntityType.doctor:
            return await this.getDoctors(payload, integration);

          case EntityType.speciality:
            return await this.getSpecialities(payload, integration);

          case EntityType.appointmentType:
            return await this.getAppointmentTypes(payload, integration);

          case EntityType.procedure:
            return await this.getProcedures(payload, integration);

          case EntityType.typeOfService:
            return this.getTypeOfServices(integration);

          case EntityType.planCategory:
            return await this.getPlanCategories(payload, integration);

          case EntityType.insuranceSubPlan:
            return await this.getInsuranceSubPlans(payload, integration);

          default:
            return [];
        }
      };

      const resource: EntityTypes[] = await getResource();
      if (cache && resource?.length) {
        await this.integrationCacheUtilsService.setCachedEntitiesFromRequest(
          entityType,
          integration,
          resourceFilters,
          resource,
          getExpirationByEntity(entityType),
        );
      }
      return resource;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('CmIntegrationService.extractEntity', error);
    }
  }

  private async getValidApiOrganizationUnits(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<OrganizationUnitEntityDocument[]> {
    try {
      const data = (await this.extractEntity(
        integration,
        EntityType.organizationUnit,
        filters,
        cache,
      )) as OrganizationUnitEntityDocument[];
      const codes = data?.map((org) => org.code);

      return (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.organizationUnit,
      )) as OrganizationUnitEntityDocument[];
    } catch (error) {
      throw error;
    }
  }

  private async getValidApiSpecialities(
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

      const entities = (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.speciality,
      )) as SpecialityEntityDocument[];

      const grouped = data.reduce((acc, entity) => {
        acc[`${entity.code}:${entity.specialityType}`] = entity;
        return acc;
      }, {});

      const validEntities: SpecialityEntityDocument[] = [];

      entities.forEach((entity) => {
        if (entity.source === EntitySourceType.user || !!grouped[`${entity.code}:${entity.specialityType}`]) {
          validEntities.push(entity);
        }
      });

      return validEntities;
    } catch (error) {
      throw error;
    }
  }

  private async getValidApiAppointmentTypes(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<AppointmentTypeEntityDocument[]> {
    try {
      const data = (await this.extractEntity(
        integration,
        EntityType.appointmentType,
        filters,
        cache,
      )) as IAppointmentTypeEntity[];
      const codes = data?.map((org) => org.code);

      const validEntities = (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.appointmentType,
      )) as AppointmentTypeEntityDocument[];

      return validEntities;
    } catch (error) {
      throw error;
    }
  }

  private async getValidApiInsurancePlans(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    ignoreFilters?: boolean,
    cache?: boolean,
  ): Promise<InsurancePlanEntityDocument[]> {
    const entityFilters: Partial<InsurancePlanEntity> = {};

    try {
      if (!ignoreFilters) {
        if (!filters.insurance?.code) {
          throw HTTP_ERROR_THROWER(
            HttpStatus.BAD_REQUEST,
            {
              message: `Required insurance filters: ${integration._id}`,
            },
            undefined,
            true,
          );
        }

        if (filters?.insurance?.code) {
          entityFilters.insuranceCode = filters.insurance.code;
        }
      }

      const data = (await this.extractEntity(
        integration,
        EntityType.insurancePlan,
        filters,
        cache,
      )) as InsurancePlanEntity[];
      const codes = data?.map((org) => org.code);

      return (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.insurancePlan,
        entityFilters,
      )) as InsurancePlanEntityDocument[];
    } catch (error) {
      if (getErrorType(error, HttpErrorOrigin.INTEGRATION_ERROR)) {
        return (await this.entitiesService.getActiveEntities(
          EntityType.insurancePlan,
          entityFilters,
          integration._id,
        )) as InsurancePlanEntityDocument[];
      }
      throw error;
    }
  }

  private async getValidApiPlanCategories(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    ignoreFilters?: boolean,
    cache?: boolean,
  ): Promise<PlanCategoryEntityDocument[]> {
    const entityFilters: Partial<PlanCategoryEntity> = {};

    try {
      if (!ignoreFilters) {
        if (!filters.insurance?.code) {
          throw HTTP_ERROR_THROWER(
            HttpStatus.BAD_REQUEST,
            {
              message: `Required insurance filter: ${integration._id}`,
            },
            undefined,
            true,
          );
        }

        if (filters?.insurance?.code) {
          entityFilters.insuranceCode = filters.insurance.code;
        }
      }

      const data = (await this.extractEntity(
        integration,
        EntityType.planCategory,
        filters,
        cache,
      )) as PlanCategoryEntity[];
      const codes = data?.map((org) => org.code);

      return (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.planCategory,
        entityFilters,
      )) as PlanCategoryEntityDocument[];
    } catch (error) {
      if (getErrorType(error, HttpErrorOrigin.INTEGRATION_ERROR)) {
        return (await this.entitiesService.getActiveEntities(
          EntityType.planCategory,
          entityFilters,
          integration._id,
        )) as PlanCategoryEntityDocument[];
      }
      throw error;
    }
  }

  private async getValidApiInsuranceSubPlans(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    ignoreFilters?: boolean,
    cache?: boolean,
  ): Promise<InsuranceSubPlanEntityDocument[]> {
    const entityFilters: Partial<InsuranceSubPlanEntity> = {};

    try {
      if (!ignoreFilters) {
        if (!filters.insurance?.code || !filters.insurancePlan?.code) {
          throw HTTP_ERROR_THROWER(
            HttpStatus.BAD_REQUEST,
            {
              message: `Required insurance & insurancePlan filters: ${integration._id}`,
            },
            undefined,
            true,
          );
        }

        if (filters?.insurance?.code) {
          entityFilters.insuranceCode = filters.insurance.code;
        }

        if (filters?.insurancePlan?.code) {
          entityFilters.insurancePlanCode = filters.insurancePlan.code;
        }
      }

      const data = (await this.extractEntity(
        integration,
        EntityType.insuranceSubPlan,
        filters,
        cache,
      )) as InsuranceSubPlanEntity[];
      const codes = data?.map((org) => org.code);

      return (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.insuranceSubPlan,
        entityFilters,
      )) as InsuranceSubPlanEntityDocument[];
    } catch (error) {
      if (getErrorType(error, HttpErrorOrigin.INTEGRATION_ERROR)) {
        return (await this.entitiesService.getActiveEntities(
          EntityType.insuranceSubPlan,
          entityFilters,
          integration._id,
        )) as InsuranceSubPlanEntityDocument[];
      }
      throw error;
    }
  }

  private async getValidApiProcedures(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<ProcedureEntityDocument[]> {
    try {
      const data = (await this.extractEntity(integration, EntityType.procedure, filters, cache)) as IProcedureEntity[];
      const codes = data?.map((procedure) => procedure.code);

      const entities = (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.procedure,
      )) as ProcedureEntityDocument[];

      const validEntities: ProcedureEntityDocument[] = [];

      const grouped = data.reduce((acc, entity) => {
        acc[`${entity.code}:${entity.specialityCode}:${entity.specialityType}`] = entity;
        return acc;
      }, {});

      // compara com especialidade já que existem códigos iguais de procedimento
      // com exceção quando a entidade salva é criada pelo usuário para permitir entidades customizadas
      entities.forEach((entity) => {
        if (
          entity.source === EntitySourceType.user ||
          !!grouped[`${entity.code}:${entity.specialityCode}:${entity.specialityType}`]
        ) {
          validEntities.push(entity);
        }
      });
      return validEntities;
    } catch (error) {
      throw error;
    }
  }

  private async getValidApiInsurances(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<InsuranceEntityDocument[]> {
    try {
      const data = (await this.extractEntity(integration, EntityType.insurance, filters, cache)) as InsuranceEntity[];
      const codes = data?.map((org) => org.code);
      return (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.insurance,
      )) as InsuranceEntityDocument[];
    } catch (error) {
      throw error;
    }
  }

  private async getValidApiDoctors(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<DoctorEntityDocument[]> {
    try {
      const data = (await this.extractEntity(integration, EntityType.doctor, filters, cache)) as IDoctorEntity[];
      const codes = data?.map((org) => org.code);
      return (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.doctor,
      )) as DoctorEntityDocument[];
    } catch (error) {
      throw error;
    }
  }

  private async getValidOccupationArea(integration: IntegrationDocument) {
    const entities = await this.entitiesService.getValidEntities(EntityType.occupationArea, integration._id);
    return entities as OccupationAreaEntityDocument[];
  }

  private async getValidOrganizationUnitLocation(integration: IntegrationDocument) {
    const entities = await this.entitiesService.getValidEntities(EntityType.organizationUnitLocation, integration._id);
    return entities as OrganizationUnitLocationEntityDocument[];
  }

  public async getMultipleEntitiesByFilter(
    integration: IntegrationDocument,
    filter: CorrelationFilterByKey,
  ): Promise<CorrelationFilter> {
    return await this.createCorrelationFilterData(filter, integration);
  }

  private async processAppointmentDoctors(
    integration: IntegrationDocument,
    payload: SimplifiedListScheduleRequest,
    availableSchedules: ListAvailableSchedules,
  ): Promise<{ validDoctors: DoctorEntityDocument[]; appointments: RawAppointment[] }> {
    try {
      const data = await this.splitGetAvailableSchedules(payload, availableSchedules, integration, 0);
      const result = data?.result;

      if (!result || !result.medicos || result.horarios?.length === 0) {
        return { validDoctors: [], appointments: [] };
      }

      const doctorsSet = new Set([]);
      const replacedAppointments: RawAppointment[] = [];

      result.horarios?.forEach((app) => doctorsSet.add(app.idMedico));
      const validDoctors: DoctorEntityDocument[] = await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        Array.from(doctorsSet),
        EntityType.doctor,
      );

      validDoctors.forEach((doctorEntity) => {
        result.horarios.forEach((appointment) => {
          if (appointment.idMedico === doctorEntity.code) {
            replacedAppointments.push({
              appointmentCode: appointment.codigo,
              appointmentDate: moment(appointment.dataHoraAgendamento).format('YYYY-MM-DDTHH:mm:ss'),
              duration: appointment.duracao,
              procedureId: appointment.idProcedimento,
              doctorId: appointment.idMedico,
              insuranceId: appointment.idConvenio,
              organizationUnitId: appointment.idUnidade,
              status: AppointmentStatus.scheduled,
            });
          }
        });
      });

      return { validDoctors, appointments: replacedAppointments };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('CmIntegrationService.processAppointmentDoctors', error);
    }
  }

  private async getValidDoctorsFromAppointmentList(
    integration: IntegrationDocument,
    filter: CorrelationFilter,
    patient?: InitialPatient,
    dateLimit?: number,
  ): Promise<EntityDocument[]> {
    let limitDays = 90;
    const limitDaysRule = Number(integration.rules?.limitDaysForListDoctorsWithAvailableSchedules);

    if (limitDaysRule > 0 && limitDaysRule < 150) {
      limitDays = limitDaysRule;
    }

    const availableSchedules: ListAvailableSchedules = {
      filter,
      randomize: false,
      limit: limitDays,
      period: {
        start: '00:00',
        end: '23:59',
      },
      fromDay: 1,
      untilDay: limitDays,
      patient: {
        bornDate: patient?.bornDate,
        sex: patient?.sex,
        cpf: patient?.cpf,
      },
    };

    if (dateLimit) {
      availableSchedules.dateLimit = dateLimit;
    }

    try {
      const { payload, rawRedisKey } = await this.createGetAppointmentsRequestObject(integration, availableSchedules);
      const doctorsRedisKey = this.cacheService.createCustomKey(
        `${this.integrationCacheUtilsService.getRedisKey(integration)}:appointmentDoctors`,
        rawRedisKey,
      );
      const resourceCache = await this.cacheService.get(doctorsRedisKey);

      if (resourceCache) {
        // se existir cache faz a request mesmo assim para manter dados atualizados sem travar a request
        this.processAppointmentDoctors(integration, payload, availableSchedules).then(({ validDoctors }) => {
          const doctorsRedisKey = this.cacheService.createCustomKey(
            `${this.integrationCacheUtilsService.getRedisKey(integration)}:appointmentDoctors`,
            rawRedisKey,
          );

          if (validDoctors?.length) {
            this.cacheService.set(validDoctors, doctorsRedisKey, DOCTORS_FROM_SCHEDULE_LIST_CACHE_EXPIRATION);
          }
        });

        return resourceCache;
      }

      const { validDoctors } = await this.processAppointmentDoctors(integration, payload, availableSchedules);

      if (validDoctors?.length) {
        await this.cacheService.set(validDoctors, doctorsRedisKey, DOCTORS_FROM_SCHEDULE_LIST_CACHE_EXPIRATION);
      }

      return validDoctors;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('CmIntegrationService.getValidDoctorsFromAppointmentList', error);
    }
  }

  private async listOrganizationUnitFromAvailableSchedules(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    patient: InitialPatient,
  ): Promise<OrganizationUnitEntityDocument[]> {
    const organizationUnits = await this.getValidApiOrganizationUnits(integration, {}, true);
    if (!organizationUnits.length) {
      return [];
    }

    const validOrganizationUnits: OrganizationUnitEntityDocument[] = [];
    const availableSchedules: ListAvailableSchedules = {
      filter: filters,
      randomize: false,
      limit: 1,
      period: {
        start: '00:00',
        end: '23:59',
      },
      fromDay: 1,
      untilDay: filters?.doctor?.code ? 120 : 60,
      patient: {
        bornDate: patient?.bornDate,
        sex: patient?.sex,
        cpf: patient?.cpf,
      },
    };

    const { payload, interAppointmentPeriodApplied } = await this.createGetAppointmentsRequestObject(
      integration,
      availableSchedules,
    );

    await Promise.allSettled(
      organizationUnits.map((organizationUnit) =>
        this.splitGetAvailableSchedules(
          {
            ...payload,
            codigosUnidade: [organizationUnit.code],
          },
          availableSchedules,
          integration,
          interAppointmentPeriodApplied,
        ),
      ),
    ).then((responses) => {
      responses
        .filter((response) => response.status === 'fulfilled')
        .forEach(
          ({ value }: PromiseFulfilledResult<CMResponsePlain<SimplifiedListScheduleResponse>>, index: number) => {
            if (value?.result?.horarios?.length) {
              validOrganizationUnits.push(organizationUnits[index]);
            }
          },
        );
    });

    return validOrganizationUnits;
  }

  private async listOrganizationUnitFromProcedures(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
  ): Promise<OrganizationUnitEntityDocument[]> {
    const organizationUnits = await this.getValidApiOrganizationUnits(integration, {}, true);
    if (!organizationUnits.length) {
      return [];
    }

    const validOrganizationUnits: OrganizationUnitEntityDocument[] = [];

    await Promise.allSettled(
      organizationUnits.map((organizationUnit) =>
        this.extractEntity(
          integration,
          EntityType.procedure,
          {
            ...filters,
            organizationUnit,
          },
          true,
        ),
      ),
    ).then((responses) => {
      responses
        .filter((response) => response.status === 'fulfilled')
        .forEach(({ value }: PromiseFulfilledResult<IProcedureEntity[]>, index: number) => {
          if (
            value.length &&
            value.find((procedure) => {
              if (filters.procedure?.code) {
                return procedure.code === filters.procedure.code;
              }

              return procedure.specialityCode === (filters.procedure?.specialityCode ?? filters.speciality.code);
            })
          ) {
            validOrganizationUnits.push(organizationUnits[index]);
          }
        });
    });

    return validOrganizationUnits;
  }

  private async getEntityListExecutionTime(
    integration: IntegrationDocument,
    targetEntity: EntityType,
    filters: CorrelationFilter,
    cache?: boolean,
    patient?: InitialPatient,
    dateLimit?: number,
  ): Promise<EntityDocument[]> {
    const isEmptyFilter = this.cmHelpersService.filterIsEmpty(filters);

    try {
      if (targetEntity === EntityType.doctor) {
        if (
          !integration.rules?.listOnlyDoctorsWithAvailableSchedules ||
          isEmptyFilter ||
          // necessário filtro de procedimento para listar agendamentos
          // também serve para ignorar a regra de listOnlyDoctorsWithAvailableSchedules se o paciente
          // selecionou para iniciar o agendamento pelo médico
          !filters.procedure
        ) {
          return await this.getValidApiDoctors(integration, filters, cache);
        }
        return await this.getValidDoctorsFromAppointmentList(integration, filters, patient, dateLimit);
      }

      if (targetEntity === EntityType.organizationUnit) {
        const { procedure, speciality, doctor } = filters;

        if ((speciality?.code || procedure?.code || procedure?.specialityCode) && doctor?.code) {
          return await this.listOrganizationUnitFromAvailableSchedules(integration, filters, patient);
        } else if (speciality?.code || procedure?.code || procedure?.specialityCode) {
          return await this.listOrganizationUnitFromProcedures(integration, filters);
        }
        return await this.getValidApiOrganizationUnits(integration, filters, cache);
      }

      switch (targetEntity) {
        case EntityType.planCategory:
          return await this.getValidApiPlanCategories(integration, filters, false, cache);

        case EntityType.insuranceSubPlan:
          return await this.getValidApiInsuranceSubPlans(integration, filters, false, cache);

        case EntityType.insurancePlan:
          return await this.getValidApiInsurancePlans(integration, filters, false, cache);

        case EntityType.insurance:
          return await this.getValidApiInsurances(integration, filters, cache);

        case EntityType.appointmentType:
          return await this.getValidApiAppointmentTypes(integration, filters, cache);

        case EntityType.procedure:
          return await this.resolveListValidProcedures(integration, filters, cache);

        case EntityType.speciality:
          return await this.resolveListValidSpecialities(integration, filters, cache);

        case EntityType.occupationArea:
          return await this.getValidOccupationArea(integration);

        case EntityType.organizationUnitLocation:
          return await this.getValidOrganizationUnitLocation(integration);

        case EntityType.typeOfService:
          return await this.listValidApiEntities<TypeOfServiceEntityDocument>(
            integration,
            EntityType.typeOfService,
            filters,
            cache,
          );

        default:
          return [];
      }
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('CmIntegrationService.getEntityListExecutionTime', error);
    }
  }

  private async resolveListValidSpecialities(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<SpecialityEntityDocument[]> {
    const doctor = filters[EntityType.doctor];
    const appointmentType = filters[EntityType.appointmentType];
    const insurance = filters[EntityType.insurance];

    if (doctor && appointmentType && insurance) {
      const objectKey = Object.keys(filters).reduce((acc, key) => {
        acc[key] = filters[key].code;
        return acc;
      }, {});

      const doctorSpecialitiesRedisKey = this.cacheService.createCustomKey(
        `${this.integrationCacheUtilsService.getRedisKey(integration)}:doctorSpecialities`,
        objectKey,
      );

      if (cache) {
        const resourceCache = await this.cacheService.get(doctorSpecialitiesRedisKey);

        if (resourceCache) {
          return resourceCache;
        }
      }

      try {
        const { codeIntegration } = await this.credentialsHelper.getConfig<CMCredentialsResponse>(integration);
        const procedures = await this.getProcedures(
          {
            ativoAgendamento: true,
            codigosClientes: [codeIntegration],
            procedimentoEspecialidade: {
              tipoEspecialidade: appointmentType.code as unknown as any,
              medicoResponsavel: {
                codigo: `[${doctor.code}]`,
              },
            },
            convenio: {
              codigo: insurance.code,
            },
          },
          integration,
        );

        if (!procedures?.length) {
          return [];
        }

        const procedureCodes = new Set(procedures.map((procedure) => procedure.specialityCode));
        const specialities = (await this.entitiesService.getValidEntitiesbyCode(
          integration._id,
          Array.from(procedureCodes),
          EntityType.speciality,
        )) as SpecialityEntityDocument[];

        if (specialities?.length && cache) {
          await this.cacheService.set(
            specialities,
            doctorSpecialitiesRedisKey,
            SPECIALITIES_FROM_DOCTORS_CACHE_EXPIRATION,
          );
        }

        return specialities;
      } catch (error) {
        throw INTERNAL_ERROR_THROWER('CmIntegrationService.resolveListValidSpecialities', error);
      }
    }

    return await this.getValidApiSpecialities(integration, filters, cache);
  }

  private async resolveListValidProcedures(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<ProcedureEntityDocument[]> {
    const { codeIntegration } = await this.credentialsHelper.getConfig<CMCredentialsResponse>(integration);
    const doctor = filters[EntityType.doctor];
    const appointmentType = filters[EntityType.appointmentType];
    const insurance = filters[EntityType.insurance];
    const speciality = filters[EntityType.speciality];

    if (doctor && appointmentType && insurance && speciality) {
      const objectKey = Object.keys(filters).reduce((acc, key) => {
        acc[key] = filters[key].code;
        return acc;
      }, {});

      const doctorProceduresRedisKey = this.cacheService.createCustomKey(
        `${this.integrationCacheUtilsService.getRedisKey(integration)}:doctorProcedures`,
        objectKey,
      );

      if (cache) {
        const resourceCache = await this.cacheService.get(doctorProceduresRedisKey);

        if (resourceCache) {
          return resourceCache;
        }
      }

      try {
        const proceduresData = await this.getProcedures(
          {
            ativoAgendamento: true,
            codigosClientes: [codeIntegration],
            procedimentoEspecialidade: {
              tipoEspecialidade: appointmentType.code as unknown as any,
              codigoEspecialidade: speciality.code,
              medicoResponsavel: {
                codigo: `[${doctor.code}]`,
              },
            },
            convenio: {
              codigo: insurance.code,
            },
          },
          integration,
        );

        if (!proceduresData?.length) {
          return [];
        }

        const procedures = (await this.entitiesService.getValidEntitiesbyCode(
          integration._id,
          proceduresData.map((procedure) => procedure.code),
          EntityType.procedure,
        )) as ProcedureEntityDocument[];

        if (procedures?.length && cache) {
          await this.cacheService.set(procedures, doctorProceduresRedisKey, SPECIALITIES_FROM_DOCTORS_CACHE_EXPIRATION);
        }

        return procedures;
      } catch (error) {
        throw INTERNAL_ERROR_THROWER('CmIntegrationService.resolveListValidProcedures', error);
      }
    }

    return await this.getValidApiProcedures(integration, filters, cache);
  }

  async getEntityList(
    integration: IntegrationDocument,
    rawFilter: CorrelationFilter,
    targetEntity: EntityType,
    cache?: boolean,
    patient?: InitialPatient,
    dateLimit?: number,
  ): Promise<EntityDocument[]> {
    return await this.getEntityListExecutionTime(integration, targetEntity, rawFilter, cache, patient, dateLimit);
  }

  async getScheduleValue(integration: IntegrationDocument, scheduleValue: GetScheduleValue): Promise<AppointmentValue> {
    const { codeIntegration } = await this.credentialsHelper.getConfig<CMCredentialsResponse>(integration);
    const { insurance, procedure, doctor, organizationUnit } = scheduleValue;

    const payload: AppointmentValueRequest = {
      codigosClientes: [codeIntegration],
      medico: {
        codigo: doctor?.code,
      },
      convenio: {
        codigo: insurance.code,
        codigoPlano: insurance.planCode,
      },
      procedimento: {
        codigo: null,
        codigoEspecialidade: procedure.specialityCode,
        tipoEspecialidade: procedure.specialityType,
      },
    };

    if (procedure?.code) {
      const procedureData = this.cmHelpersService.getCompositeProcedureCode(integration, procedure.code);
      payload.procedimento.codigo = procedureData.code;

      if (procedureData.areaCode) {
        payload.procedimento.codigoArea = procedureData.areaCode;
      }

      if (procedureData.lateralityCode) {
        payload.procedimento.lateralidade = procedureData.lateralityCode;
      }
    }

    if (organizationUnit?.code) {
      payload.codigoUnidade = organizationUnit.code;
    }

    if (insurance.subPlanCode) {
      payload.convenio.codigoSubplano = insurance.subPlanCode;
    }

    const resourceFilters = this.resourceFilters({
      procedure,
      doctor,
      insurance,
      speciality: {
        code: procedure.specialityCode,
      },
      appointmentType: {
        code: procedure.specialityType,
      },
    });

    const resourceCache = await this.integrationCacheUtilsService.getScheduleValueCache(integration, resourceFilters);

    if (resourceCache) {
      return resourceCache as AppointmentValue;
    }

    try {
      const data: CMResponsePlain<AppointmentValueResponse> = await this.cmApiService.getAppointmentValue(
        integration,
        payload,
      );

      if (!data?.result) {
        return null;
      }

      if (!data.result?.valor || data.result?.valor <= 0) {
        return null;
      }

      const response: AppointmentValue = {
        currency: 'R$',
        value: formatCurrency(data?.result?.valor),
      };

      await this.integrationCacheUtilsService.setScheduleValueCache(integration, resourceFilters, response);
      return response;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('CmIntegrationService.getScheduleValue', error);
    }
  }

  // existem codigos iguais para um mesmo tipo de entidade
  // se buscar pelo código vai pegar a primeira ocorrência
  async createCorrelationFilterData(
    correlationFilter: CorrelationFilterByKey,
    integration: IntegrationDocument,
    forceSingleEntity?: boolean,
  ): Promise<CorrelationFilter> {
    const correlationData: CorrelationFilter = {};

    // ignora filtros combinados
    if (forceSingleEntity) {
      const correlationData: CorrelationFilter = {};

      for (const entityType of Object.keys(EntityType)) {
        if (correlationFilter[entityType]) {
          correlationData[entityType] = await this.entitiesService.getEntity(
            entityType as EntityType,
            {
              code: correlationFilter[entityType],
            },
            integration._id,
          );
        }
      }

      return correlationData;
    }

    // entidades que teoricamente tem id unico
    const defaultEntities: EntityType[] = [
      EntityType.appointmentType,
      EntityType.organizationUnit,
      EntityType.doctor,
      EntityType.insurance,
      EntityType.typeOfService,
      EntityType.organizationUnitLocation,
      EntityType.occupationArea,
    ];

    if (integration.rules?.useProcedureWithoutSpecialityRelation) {
      defaultEntities.push(EntityType.procedure);
    }

    for await (const entityType of defaultEntities) {
      if (correlationFilter[entityType]) {
        correlationData[entityType] = await this.entitiesService.getEntity(
          entityType,
          {
            code: correlationFilter[entityType],
          },
          integration._id,
        );
      }
    }

    if (correlationFilter.insurancePlan && correlationFilter.insurance) {
      const customOpts = { insuranceCode: correlationFilter.insurance as string };

      const entity = (await this.entitiesService.getEntity(
        EntityType.insurancePlan,
        {
          code: correlationFilter.insurancePlan,
          ...customOpts,
        },
        integration._id,
      )) as InsurancePlanEntityDocument;

      correlationData.insurancePlan = entity;
    }

    if (correlationFilter.planCategory && correlationFilter.insurance) {
      const customOpts = { insuranceCode: correlationFilter.insurance as string };

      const entity = (await this.entitiesService.getEntity(
        EntityType.planCategory,
        {
          code: correlationFilter.planCategory,
          ...customOpts,
        },
        integration._id,
      )) as PlanCategoryEntityDocument;

      correlationData.planCategory = entity;
    }

    if (correlationFilter.insuranceSubPlan && correlationFilter.insurancePlan && correlationFilter.insurance) {
      const customOpts = {
        insuranceCode: correlationFilter.insurance as string,
        insurancePlanCode: correlationFilter.insurancePlan as string,
      };

      const entity = (await this.entitiesService.getEntity(
        EntityType.insuranceSubPlan,
        {
          code: correlationFilter.insuranceSubPlan,
          ...customOpts,
        },
        integration._id,
      )) as InsuranceSubPlanEntityDocument;

      correlationData.insuranceSubPlan = entity;
    }

    if (
      !integration.rules?.useProcedureWithoutSpecialityRelation &&
      correlationFilter.procedure &&
      correlationFilter.speciality
    ) {
      const customOpts = { specialityCode: correlationFilter.speciality as string };

      const entity = (await this.entitiesService.getEntity(
        EntityType.procedure,
        {
          code: correlationFilter.procedure,
          ...customOpts,
        },
        integration._id,
      )) as ProcedureEntityDocument;

      correlationData.procedure = entity;
    }

    if (correlationFilter.speciality && correlationFilter.appointmentType) {
      const customOpts = { specialityType: correlationFilter.appointmentType as string };

      const entity = (await this.entitiesService.getEntity(
        EntityType.speciality,
        {
          code: correlationFilter.speciality,
          ...customOpts,
        },
        integration._id,
      )) as SpecialityEntityDocument;

      correlationData.speciality = entity;
    }

    return correlationData;
  }

  async getEntitiesFromInsurance(
    integration: IntegrationDocument,
    insurance: InsuranceEntityDocument,
    cpf: string,
  ): Promise<CorrelationFilter> {
    try {
      if (!insurance.params?.referenceInsuranceType) {
        return null;
      }

      const response = await this.externalInsurancesService.getData(cpf, insurance.params.referenceInsuranceType);
      const data: CorrelationFilter = {};

      if (!response?.insuranceSubPlan) {
        return data;
      }

      const textsToMatchSubPlan: string[] = [...response.insuranceSubPlan.name];

      const entities = (await this.entitiesService.getEntitiesByTargetAndName(
        integration._id,
        EntityType.insuranceSubPlan,
        textsToMatchSubPlan,
        undefined,
        { insuranceCode: insurance.code },
      )) as InsuranceSubPlanEntityDocument[];

      if (entities.length) {
        data.insuranceSubPlan = entities[0];

        const insurancePlan = (await this.entitiesService.getModel(EntityType.insurancePlan).findOne({
          code: entities[0].insurancePlanCode,
          insuranceCode: insurance.code,
          integrationId: castObjectId(integration._id),
          $or: [{ activeErp: true }, { activeErp: { $exists: false } }, { activeErp: { $eq: null } }],
          canView: true,
        })) as InsurancePlanEntityDocument;

        if (insurancePlan) {
          data.insurancePlan = insurancePlan;
        }
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getStatus(integration: IntegrationDocument): Promise<OkResponse> {
    try {
      const { codeIntegration } = await this.credentialsHelper.getConfig<CMCredentialsResponse>(integration);
      const data = await this.cmApiService.resourceListRequest(
        integration,
        {
          codigosClientes: [codeIntegration],
          ativoAgendamento: true,
        },
        EntityType.organizationUnit,
        true,
      );

      if (data?.result?.length) {
        return { ok: true };
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cria um novo agendamento e caso tenha sucesso cancela o anterior.
   * se o cancelamento falhar, cancela o agendamento
   * @param integration
   * @param reschedule
   * @returns
   */
  async reschedule(integration: IntegrationDocument, reschedule: Reschedule): Promise<Appointment> {
    const { scheduleToCancelCode, scheduleToCreate, patient } = reschedule;

    try {
      // busca agendamentos do paciente para pegar dados de qual será cancelado
      const patientAppointments = await this.getPatientSchedules(integration, { patientCode: patient.code });
      const appointmentToCancel = patientAppointments.find(
        (appointment) => appointment.appointmentCode == scheduleToCancelCode,
      );

      if (!appointmentToCancel) {
        throw INTERNAL_ERROR_THROWER('CmIntegrationService.reschedule', {
          message: 'Invalid appointment code to cancel',
        });
      }

      // Cria novo agendamento enquanto o anterior permanece ativo
      const createdAppointment = await this.createSchedule(integration, scheduleToCreate);

      if (!createdAppointment.appointmentCode) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          {
            message: 'CmIntegrationService.reschedule: error creating new schedule',
          },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      const { procedure, appointmentCode, speciality } = appointmentToCancel;

      // após criar novo agendamento, cancela o anterior
      const cancelSchedulePayload = {
        appointmentCode,
        patientCode: patient.code,
        procedure: {
          code: null,
          specialityCode: procedure.specialityCode || speciality?.code,
          specialityType: procedure.specialityType || speciality?.specialityType,
        },
      };
      const canceledOldAppointment = await this.cancelSchedule(integration, cancelSchedulePayload);

      if (procedure?.code) {
        const procedureData = this.cmHelpersService.getCompositeProcedureCode(integration, procedure.code);
        cancelSchedulePayload.procedure.code = procedureData.code;
      }

      // caso o cancelamento do agendamento anterior falhe, cancela o que foi gerado no inicio do fluxo
      if (!canceledOldAppointment.ok) {
        const { appointmentCode, procedure, speciality } = createdAppointment;

        await this.cancelSchedule(integration, {
          appointmentCode,
          patientCode: patient.code,
          procedure: {
            code: procedure.code || null,
            specialityCode: procedure.specialityCode || speciality?.code,
            specialityType: procedure.specialityType || speciality?.specialityType,
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

  private async listValidApiEntities<T>(
    integration: IntegrationDocument,
    targetEntity: EntityType,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<T[]> {
    try {
      const data = await this.extractEntity(integration, targetEntity, filters, cache);
      const codes = data?.map((entity) => entity.code);

      if (cache) {
        const cachedEntities = await this.integrationCacheUtilsService.getProcessedEntities(
          integration,
          targetEntity,
          codes,
        );

        if (cachedEntities) {
          return cachedEntities as unknown as T[];
        }
      }

      const entities = await this.entitiesService.getValidEntitiesbyCode(integration._id, codes, targetEntity);

      if (cache && entities?.length) {
        await this.integrationCacheUtilsService.setProcessedEntities(integration, targetEntity, entities, codes);
      }

      return entities as unknown as T[];
    } catch (error) {
      throw error;
    }
  }

  async getPatientFollowUpSchedules(
    integration: IntegrationDocument,
    filters: PatientFollowUpSchedules,
    ignoreException = false,
  ): Promise<FollowUpAppointment[]> {
    const { patientCode } = filters;
    const { codeIntegration } = await this.credentialsHelper.getConfig<CMCredentialsResponse>(integration);

    try {
      const response = await this.cmApiService.getFollowUpPatientAppointments(
        integration,
        {
          codigoPaciente: patientCode,
          codigosClientes: [codeIntegration],
        },
        undefined,
        ignoreException,
      );

      if (!response?.result?.length) {
        return [];
      }

      const typeOfService: TypeOfServiceEntityDocument = await this.entitiesService
        .getModel(EntityType.typeOfService)
        .findOne({
          code: defaultTypesOfServiceMap[TypeOfService.followUp],
          integrationId: castObjectId(integration._id),
        });

      const schedules: FollowUpAppointment[] = await Promise.all(
        response.result
          // só retorna agendamentos que podem gerar um retorno
          .filter((schedule) => !schedule.possuiRetorno && moment(schedule.dataLimite).isAfter())
          .map(async (schedule) => {
            const speciality = (await this.entitiesService.getEntityByCode(
              schedule.codigoEspecialidade,
              EntityType.speciality,
              integration._id,
            )) as SpecialityEntityDocument;

            const replacedEntities = await this.createCorrelationFilterData(
              {
                procedure: this.cmHelpersService.createCompositeProcedureCode(
                  integration,
                  schedule.codigoProcedimento,
                  schedule.codigoEspecialidade,
                  speciality?.specialityType,
                  schedule.codigoArea,
                  schedule.lateralidade,
                ),
                doctor: schedule.codigoMedico,
                organizationUnit: schedule.codigoUnidade,
                speciality: schedule.codigoEspecialidade,
                insurance: schedule.codigoConvenio,
                insurancePlan: schedule.codigoConvenio,
                planCategory: schedule.codigoCategoria,
              },
              integration,
              true,
            );

            const followUpSchedule: FollowUpAppointment = {
              ...replacedEntities,
              followUpLimit: schedule.dataLimite,
              appointmentDate: schedule.dataAgenda,
              inFollowUpPeriod: moment(schedule.dataLimite).isSameOrAfter(moment()),
              typeOfService,
            };

            return followUpSchedule;
          }),
      );

      return schedules;
    } catch (error) {
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, error, HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }
}
