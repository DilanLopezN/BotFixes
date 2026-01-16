import { HttpStatus, Injectable } from '@nestjs/common';
import { ClinicApiService } from './clinic-api.service';
import { EntitiesService } from '../../../entities/services/entities.service';
import { AppointmentService, RawAppointment } from '../../../shared/appointment.service';
import { FlowService } from '../../../flow/service/flow.service';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { ClinicHelpersService } from './clinic-helpers.service';
import {
  AvailableSchedulesMetadata,
  CancelSchedule,
  CancelScheduleV2,
  ConfirmSchedule,
  ConfirmScheduleV2,
  CreatePatient,
  CreateSchedule,
  IIntegratorService,
  InitialPatient,
  ListAvailableSchedules,
  ListAvailableSchedulesResponse,
  ListSchedulesToConfirmV2,
  MatchFlowsConfirmation,
  PatientFilters,
  PatientSchedules,
  Reschedule,
} from '../../../integrator/interfaces';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { EntityType, EntityTypes } from '../../../interfaces/entity.interface';
import { Patient } from '../../../interfaces/patient.interface';
import {
  Appointment,
  AppointmentSortMethod,
  AppointmentStatus,
  AppointmentValue,
  MinifiedAppointments,
} from '../../../interfaces/appointment.interface';
import {
  AppointmentTypeEntityDocument,
  DoctorEntityDocument,
  EntityDocument,
  ScheduleType,
} from '../../../entities/schema';
import { CorrelationFilter, CorrelationFilterByKey } from '../../../interfaces/correlation-filter.interface';
import { HTTP_ERROR_THROWER, HttpErrorOrigin, INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { formatPhone } from '../../../../common/helpers/format-phone';
import * as moment from 'moment';
import {
  ClinicCreatePatient,
  ClinicCreateScheduleData,
  ClinicCreateSchedulePayload,
  ClinicListAvailableScheduleData,
  ClinicListAvailableScheduleParams,
  ClinicPatientResponse,
  ClinicResponseArray,
  ClinicSchedule,
  ConfirmationCancelErpParams,
} from '../interfaces';
import { ClinicEntitiesService } from './clinic-entities.service';
import { FlowAction, FlowActionElement, FlowSteps } from '../../../flow/interfaces/flow.interface';
import { MatchFlowActions } from '../../../flow/interfaces/match-flow-actions';
import { orderBy } from 'lodash';
import { ConfirmationSchedule } from '../../../interfaces/confirmation-schedule.interface';
import { ClinicConfirmationService } from './clinic-confirmation.service';
import { EntitiesFiltersService } from '../../../shared/entities-filters.service';
import { InterAppointmentService } from '../../../shared/inter-appointment.service';
import { GetScheduleByIdData } from '../../../integrator/interfaces/get-schedule-by-id.interface';
import { Schedules } from '../../../schedules/entities/schedules.entity';
import { getExpirationByEntity } from '../../../integration-cache-utils/cache-expirations';

@Injectable()
export class ClinicService implements IIntegratorService {
  constructor(
    private readonly clinicApiService: ClinicApiService,
    private readonly clinicHelpersService: ClinicHelpersService,
    private readonly clinicEntitiesService: ClinicEntitiesService,
    private readonly clinicConfirmationService: ClinicConfirmationService,
    private readonly entitiesService: EntitiesService,
    private readonly entitiesFiltersService: EntitiesFiltersService,
    private readonly appointmentService: AppointmentService,
    private readonly flowService: FlowService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
    private readonly interAppointmentService: InterAppointmentService,
  ) {}

  public async cancelSchedule(integration: IntegrationDocument, cancelSchedule: CancelSchedule): Promise<OkResponse> {
    const { appointmentCode: scheduleCode } = cancelSchedule;

    try {
      await this.clinicApiService.cancelSchedule(integration, {
        scheduleCode,
      });
      return { ok: true };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('Clinic.cancelSchedule', error);
    }
  }

  public async confirmSchedule(
    integration: IntegrationDocument,
    confirmSchedule: ConfirmSchedule,
  ): Promise<OkResponse> {
    const { appointmentCode: scheduleCode } = confirmSchedule;

    try {
      await this.clinicApiService.confirmSchedule(integration, {
        scheduleCode,
      });
      return { ok: true };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('Clinic.confirmSchedule', error);
    }
  }

  public async createSchedule(integration: IntegrationDocument, createSchedule: CreateSchedule): Promise<Appointment> {
    try {
      const { appointment, doctor, patient, insurance } = createSchedule;

      const payload: ClinicCreateSchedulePayload = {
        obs: '',
        patient_id: Number(patient.code),
        external_id: 1,
        address_service_id: 1,
        healthInsuranceCode: Number(insurance.code),
      };

      const data: ClinicCreateScheduleData = {
        address_id: 1,
        facility_id: 1,
        doctor_id: doctor.code,
        slot_start: appointment.appointmentDate,
      };

      const response = await this.clinicApiService.createSchedule(integration, payload, data);

      if (response?.result?.id) {
        return {
          appointmentDate: appointment.appointmentDate,
          duration: appointment.duration,
          guidance: '',
          appointmentCode: String(response.result.id),
          status: AppointmentStatus.scheduled,
        };
      }
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinicService.createSchedule', error);
    }
  }

  public async createPatient(integration: IntegrationDocument, { patient }: CreatePatient): Promise<Patient> {
    try {
      const payload: ClinicCreatePatient = {
        birthday: moment(patient.bornDate).format('YYYY-MM-DD'),
        nin: patient.cpf,
        email: patient.email || '',
        name: patient.name,
        mobile: formatPhone(patient.cellPhone ?? patient.phone, true),
        sex: patient.sex || '',
        rg: '',
        healthInsuranceCode: '',
        external_id: '',
      };

      const response = await this.clinicApiService.createPatient(integration, payload);
      const clinicPatient = response.result;
      const createdPatient = this.clinicHelpersService.replaceClinicPatientToPatient(clinicPatient);

      try {
        await this.integrationCacheUtilsService.setPatientCache(
          integration,
          createdPatient.code,
          createdPatient.cpf,
          createdPatient,
        );
      } catch (error) {}

      return createdPatient;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinicService.createPatient', error);
    }
  }

  public async extractSingleEntity(
    integration: IntegrationDocument,
    targetEntity: EntityType,
    filters?: CorrelationFilter,
    cache: boolean = false,
  ): Promise<EntityTypes[]> {
    return await this.clinicEntitiesService.extractEntity({
      integration,
      targetEntity,
      cache,
      filters,
      fromImport: true,
    });
  }

  public async getAvailableSchedules(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
  ): Promise<ListAvailableSchedulesResponse> {
    let {
      filter,
      limit,
      patient,
      period,
      randomize,
      sortMethod = AppointmentSortMethod.default,
      fromDay,
      untilDay,
      periodOfDay,
    } = availableSchedules;
    const { speciality, insurance, doctor, organizationUnit, appointmentType, procedure } = filter;

    try {
      // médicos que terão horários listados individualmente
      const validDoctorsToExtract: EntityDocument[] = [];

      if (doctor?.code) {
        validDoctorsToExtract.push(doctor);
      } else {
        // Lista médicos válidos para retornar horários individuais para cada um
        const entities = await this.clinicEntitiesService.listDoctors(integration, filter, patient);
        const doctors: DoctorEntityDocument[] = await this.entitiesService.getValidEntitiesbyCode(
          integration._id,
          entities.map((doctor) => doctor.code),
          EntityType.doctor,
        );

        const [matchedDoctors] = await this.flowService.matchEntitiesFlows({
          integrationId: integration._id,
          entities: doctors,
          targetEntity: FlowSteps.doctor,
          filters: { patientBornDate: patient?.bornDate, patientSex: patient?.sex, patientCpf: patient?.cpf },
          entitiesFilter: filter,
        });

        const validDoctors = this.entitiesFiltersService.filterEntitiesByParams(integration, matchedDoctors, {
          bornDate: patient?.bornDate,
        });

        validDoctorsToExtract.push(...validDoctors);
      }

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
              null,
              availableSchedules.appointmentCodeToCancel ? [availableSchedules.appointmentCodeToCancel] : undefined,
            );

          doctorsScheduledMap.forEach((value, key) => {
            doctorsScheduledMapped.set(key, value);
          });

          if (interAppointmentPeriod > 0 && fromDay < interAppointmentPeriod) {
            interAppointmentPeriodApplied = interAppointmentPeriod;
            fromDay = interAppointmentPeriod;
          }
        }
      } catch (error) {
        throw HTTP_ERROR_THROWER(HttpStatus.BAD_GATEWAY, error);
      }

      const interAppointmentMetadata: AvailableSchedulesMetadata = {
        interAppointmentPeriod: interAppointmentPeriodApplied,
      };

      const params: ClinicListAvailableScheduleParams = {
        start_date: moment().add(fromDay, 'days').startOf('day').format('YYYY-MM-DD'),
        end_date: moment()
          .add(fromDay + untilDay, 'days')
          .startOf('day')
          .format('YYYY-MM-DD'),
      };

      const promises: Promise<unknown>[] = [];
      for (const doctor of validDoctorsToExtract) {
        const data: ClinicListAvailableScheduleData = {
          address_id: 1,
          facility_id: 1,
          doctor_id: doctor.code,
        };

        promises.push(
          Promise.all([
            new Promise((resolve) => resolve(doctor.code)),
            this.clinicApiService.listAvailableSchedules(integration, params, data),
          ]),
        );
      }

      const doctorSchedulesMap: { [key: string]: string[] } = {};
      await Promise.allSettled(promises).then((responses) => {
        responses
          .filter((response) => response.status === 'fulfilled')
          .forEach(({ value: data }: PromiseFulfilledResult<[string, ClinicResponseArray<string>]>) => {
            const [doctorCode, value] = data;
            doctorSchedulesMap[doctorCode] = value?.result?.items ?? [];
          });
      });

      const replacedAppointments: RawAppointment[] = [];

      Object.entries(doctorSchedulesMap).forEach(([doctorCode, schedules]) => {
        schedules.forEach((scheduleDate) => {
          const appointmentDate = moment(scheduleDate).format('YYYY-MM-DDTHH:mm:ss');

          const appointmentDateUtc = moment(appointmentDate).utc();
          const nowUtc = moment.utc();

          // Validação se o horário já passou
          if (moment(appointmentDateUtc).isBefore(nowUtc)) {
            return;
          }

          const replacedAppointment: RawAppointment = {
            appointmentCode: '-1',
            appointmentDate,
            doctorId: doctorCode,
            status: AppointmentStatus.scheduled,
          };

          if (organizationUnit?.code) {
            replacedAppointment.organizationUnitId = organizationUnit.code;
          }

          if (procedure?.code) {
            replacedAppointment.procedureId = procedure.code;
          }

          if (speciality?.code) {
            replacedAppointment.specialityId = speciality.code;
          }

          if (appointmentType?.code) {
            replacedAppointment.appointmentTypeId = appointmentType.code;
          }

          if (insurance?.code) {
            replacedAppointment.insuranceId = insurance.code;
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
        });
      });

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
      return { schedules: validSchedules, metadata: { ...partialMetadata, ...interAppointmentMetadata } };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinicService.getAvailableSchedules', error);
    }
  }

  public getScheduleValue(): Promise<AppointmentValue> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'ClinicService.getScheduleValue: Not implemented',
      undefined,
      true,
    );
  }

  public async getEntityList(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    targetEntity: EntityType,
    cache?: boolean,
    patient?: InitialPatient,
  ): Promise<EntityDocument[]> {
    switch (targetEntity) {
      case EntityType.speciality:
      case EntityType.organizationUnit:
      case EntityType.insurance:
      case EntityType.insurancePlan:
      case EntityType.typeOfService:
      case EntityType.appointmentType:
      case EntityType.procedure:
      case EntityType.doctor:
        return await this.clinicEntitiesService.listValidApiEntities({
          integration,
          targetEntity,
          filters,
          cache,
          patient,
        });

      case EntityType.organizationUnitLocation:
      case EntityType.occupationArea:
        return await this.entitiesService.getValidEntities(targetEntity, integration._id);

      default:
        return [] as EntityDocument[];
    }
  }

  // Filtro de agendamentos de paciente válidos para listagem - por Tipos de Agendamentos Válidos
  private async filterPatientSchedulesByValidAppointmentType(
    data: ClinicResponseArray<ClinicSchedule>,
    integration: IntegrationDocument,
  ): Promise<ClinicSchedule[]> {
    let appointmentTypesEntities: AppointmentTypeEntityDocument[] = [];

    const appointmentTypesEntitiesCache = await this.integrationCacheUtilsService.getCachedEntitiesFromRequest(
      EntityType.appointmentType,
      integration,
      { integrationId: integration._id },
    );

    if (!appointmentTypesEntitiesCache) {
      appointmentTypesEntities = (await this.entitiesService.getEntities(
        EntityType.appointmentType,
        { activeErp: true },
        integration._id,
      )) as AppointmentTypeEntityDocument[];

      // Cache os tipos de agendamentos
      await this.integrationCacheUtilsService.setCachedEntitiesFromRequest(
        EntityType.appointmentType,
        integration,
        { integrationId: integration._id },
        appointmentTypesEntities,
        getExpirationByEntity(EntityType.appointmentType),
      );
    } else {
      appointmentTypesEntities = appointmentTypesEntitiesCache as AppointmentTypeEntityDocument[];
    }

    const validAppointmentTypeCodes = appointmentTypesEntities
      .filter((type) => {
        // Verifica se o tipo de agendamento é válido para ser exibido
        const isValidAppointmentType =
          type.canView || type.canReschedule || type.canCancel || type.canConfirmActive || type.canConfirmPassive;

        return isValidAppointmentType;
      })
      .map((type) => type.code);

    // Filtra os agendamentos com base nos códigos válidos, aplicando o mapeamento de tipos CLINIC / BOT
    const filteredSchedulesByValidAppointmentTypes = data.result.items
      .map((schedule) => ({
        ...schedule,
        type: this.clinicEntitiesService.clinicAppointmentTypesMapping[schedule.type] || schedule.type,
      }))
      .filter((schedule) => validAppointmentTypeCodes.includes(schedule.type));

    return filteredSchedulesByValidAppointmentTypes;
  }

  // Filtro de agendamentos ja passados
  // Retorna apenas os agendamentos que ainda não passaram do dia e hora atual
  private filterSchedulesOverdueDates(
    response: ClinicResponseArray<ClinicSchedule>,
  ): ClinicResponseArray<ClinicSchedule> {
    const schedulesFiltered = response.result.items.filter((schedule) => {
      // filtra os agendamentos que já passaram
      const convertedSchedule = moment(
        `${schedule.date_schedule} ${schedule.hour_schedule}`,
        'DD/MM/YYYY HH:mm:ss:SSS',
      );
      const scheduleDateTime = moment(convertedSchedule).utc();
      const now = moment.utc();

      return scheduleDateTime.isSameOrAfter(now);
    });

    return {
      ...response,
      result: {
        ...response.result,
        items: schedulesFiltered,
      },
    };
  }

  public async getMinifiedPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<MinifiedAppointments> {
    const minifiedSchedules: MinifiedAppointments = {
      appointmentList: [],
      lastAppointment: null,
      nextAppointment: null,
    };

    const { patientCode } = patientSchedules;
    const dateFormat = 'YYYY-MM-DD';

    try {
      const data = await this.clinicApiService.listSchedules(integration, {
        patient_id: patientCode,
        start_date: moment().format(dateFormat),
        end_date: moment().add(4, 'months').format(dateFormat),
      });

      // filtrar a resposta da API com datas futuras
      const dataWithNoOverdueDate = this.filterSchedulesOverdueDates(data);

      if (!dataWithNoOverdueDate?.result?.items || !dataWithNoOverdueDate.result.items.length) {
        await this.integrationCacheUtilsService.setPatientSchedulesCache(integration, patientCode, {
          minifiedSchedules,
          schedules: [],
        });

        return minifiedSchedules;
      }

      const filteredSchedulesByValidAppointmentTypes = await this.filterPatientSchedulesByValidAppointmentType(
        dataWithNoOverdueDate,
        integration,
      );

      const schedules: Appointment[] = await Promise.all(
        filteredSchedulesByValidAppointmentTypes.map(async (drMobileSchedule) => {
          const [schedule] = await this.appointmentService.transformSchedules(integration, [
            await this.clinicHelpersService.createPatientAppointmentObject(integration, drMobileSchedule),
          ]);

          const flowSteps: FlowSteps[] = [FlowSteps.listPatientSchedules];

          if (patientSchedules.target) {
            flowSteps.push(patientSchedules.target);
          }

          const matchFlows: MatchFlowActions = {
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
          };

          const flowActions = await this.flowService.matchFlowsAndGetActions(matchFlows);

          minifiedSchedules.appointmentList.push({
            appointmentCode: String(drMobileSchedule.id),
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
      throw INTERNAL_ERROR_THROWER('ClinicService.getMinifiedPatientSchedules', error);
    }
  }

  public async getMultipleEntitiesByFilter(
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

      if (!filters?.code && !filters?.cpf) {
        return undefined;
      }

      let response: ClinicResponseArray<ClinicPatientResponse> = undefined;

      if (filters.code) {
        response = await this.clinicApiService.getPatient(integration, { id: filters.code });
      } else if (filters.cpf) {
        response = await this.clinicApiService.getPatient(integration, { nin: filters.cpf });
      }

      // CLINIC permite salvar mais de um paciente com o mesmo CPF.
      // caso tenha mais de um, pega aquele que tem a combinação de CPF e Data de nascimento
      if (response?.result?.items?.length > 1) {
        response.result.items = response?.result?.items?.filter(
          (patient) =>
            patient.nin.toString() === filters.cpf &&
            moment.utc(patient?.birthday, 'DD/MM/YYYY').startOf('day').valueOf() ===
              moment.utc(filters.bornDate).startOf('day').valueOf(),
        );
      }

      const clinicPatient = response?.result?.items?.[0];

      if (!clinicPatient) {
        return undefined;
      }

      const patient = this.clinicHelpersService.replaceClinicPatientToPatient(clinicPatient);

      if (!patient) {
        return undefined;
      }

      // CLinic retorna o cpf como número removendo o digito 0 do inicio do cpf. Entao se tem um cpf como filtro
      // eu adiciono o que veio no filtro para que seja criado um cache corretamente
      if (filters.cpf) {
        patient.cpf = filters.cpf;
      }

      await this.integrationCacheUtilsService.setPatientCache(integration, patient.code, patient.cpf, patient);
      return patient;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinuxService.getPatient', error);
    }
  }

  public async getPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<Appointment[]> {
    const { patientCode } = patientSchedules;
    const dateFormat = 'YYYY-MM-DD';

    try {
      const data = await this.clinicApiService.listSchedules(integration, {
        patient_id: patientCode,
        start_date: moment().format(dateFormat),
        end_date: moment().add(4, 'months').format(dateFormat),
      });

      if (!data.result?.items || !data.result.items.length) {
        return [];
      }

      // filtrar a resposta da API com datas futuras
      const dataWithNoOverdueDate = this.filterSchedulesOverdueDates(data);

      const filteredSchedulesByValidAppointmentTypes = await this.filterPatientSchedulesByValidAppointmentType(
        dataWithNoOverdueDate,
        integration,
      );

      return await this.appointmentService.transformSchedules(
        integration,
        await Promise.all(
          filteredSchedulesByValidAppointmentTypes.map(
            async (schedule) => await this.clinicHelpersService.createPatientAppointmentObject(integration, schedule),
          ),
        ),
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinicService.getPatientSchedules', error);
    }
  }

  public async getStatus(integration: IntegrationDocument): Promise<OkResponse> {
    try {
      const response = await this.clinicApiService.listOrganizationUnits(integration, true);
      const organizationUnits = response?.result?.items;

      if (organizationUnits?.length) {
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

      // Cria novo agendamento enquanto o anterior permanece ativo
      const createdAppointment = await this.createSchedule(integration, scheduleToCreate);

      if (!createdAppointment.appointmentCode) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          {
            message: 'ClinicIntegrationService.reschedule: error creating new schedule',
          },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      if (appointmentToCancel) {
        const { appointmentCode, speciality } = appointmentToCancel;

        // após criar novo agendamento, cancela o anterior
        const cancelSchedulePayload = {
          appointmentCode,
          patientCode: patient.code,
          procedure: {
            code: null,
            specialityCode: speciality?.code,
            specialityType: speciality?.specialityType,
          },
        };
        const canceledOldAppointment = await this.cancelSchedule(integration, cancelSchedulePayload);

        // caso o cancelamento do agendamento anterior falhe, cancela o que foi gerado no inicio do fluxo
        if (!canceledOldAppointment.ok) {
          const { appointmentCode, speciality } = createdAppointment;

          await this.cancelSchedule(integration, {
            appointmentCode,
            patientCode: patient.code,
            procedure: {
              code: null,
              specialityCode: speciality?.code,
              specialityType: speciality?.specialityType,
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
      }

      return createdAppointment;
    } catch (error) {
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, error, HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  public updatePatient(): Promise<Patient> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'ClinicService.updatePatient: Not implemented',
      undefined,
      true,
    );
  }

  public async matchFlowsConfirmation(
    integration: IntegrationDocument,
    data: MatchFlowsConfirmation,
  ): Promise<FlowAction<FlowActionElement>[]> {
    return await this.clinicConfirmationService.matchFlowsConfirmation(integration, data);
  }

  public async confirmationCancelSchedule(
    integration: IntegrationDocument,
    cancelSchedule: CancelScheduleV2<ConfirmationCancelErpParams>,
  ): Promise<OkResponse> {
    return await this.clinicConfirmationService.cancelSchedule(integration, cancelSchedule);
  }

  public async confirmationConfirmSchedule(
    integration: IntegrationDocument,
    confirmSchedule: ConfirmScheduleV2,
  ): Promise<OkResponse> {
    return await this.clinicConfirmationService.confirmSchedule(integration, confirmSchedule);
  }

  async listSchedulesToConfirm(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2,
  ): Promise<ConfirmationSchedule> {
    return await this.clinicConfirmationService.listSchedulesToConfirm(integration, data);
  }

  async getConfirmationScheduleById(integration: IntegrationDocument, data: GetScheduleByIdData): Promise<Schedules> {
    return await this.clinicConfirmationService.getConfirmationScheduleById(integration, data);
  }
}
