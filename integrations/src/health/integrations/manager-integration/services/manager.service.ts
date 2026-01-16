import { HttpStatus, Injectable } from '@nestjs/common';
import { orderBy, uniqBy } from 'lodash';
import * as moment from 'moment';
import { HTTP_ERROR_THROWER, INTERNAL_ERROR_THROWER, HttpErrorOrigin } from '../../../../common/exceptions.service';
import { formatCurrency } from '../../../../common/helpers/format-currency';
import { convertPhoneNumber, formatPhone } from '../../../../common/helpers/format-phone';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import {
  AppointmentTypeEntityDocument,
  ScheduleType,
  DoctorEntityDocument,
  EntityDocument,
  TypeOfService,
} from '../../../entities/schema';
import { EntitiesService } from '../../../entities/services/entities.service';
import { FlowSteps } from '../../../flow/interfaces/flow.interface';
import { FlowService } from '../../../flow/service/flow.service';
import { PATIENT_CACHE_EXPIRATION } from '../../../integration-cache-utils/cache-expirations';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { CancelSchedule } from '../../../integrator/interfaces/cancel-schedule.interface';
import { ConfirmSchedule } from '../../../integrator/interfaces/confirm-schedule.interface';
import { CreatePatient } from '../../../integrator/interfaces/create-patient.interface';
import { CreateSchedule } from '../../../integrator/interfaces/create-schedule.interface';
import { GetScheduleValue } from '../../../integrator/interfaces/get-schedule-value.interface';
import { IIntegratorService } from '../../../integrator/interfaces/integrator-service.interface';
import {
  AvailableSchedulesMetadata,
  ListAvailableSchedules,
  ListAvailableSchedulesResponse,
} from '../../../integrator/interfaces/list-available-schedules.interface';
import { PatientFilters } from '../../../integrator/interfaces/patient-filters.interface';
import { PatientSchedules } from '../../../integrator/interfaces/patient-schedules.interface';
import { InitialPatient } from '../../../integrator/interfaces/patient.interface';
import {
  Appointment,
  AppointmentSortMethod,
  AppointmentStatus,
  AppointmentValue,
  MinifiedAppointments,
} from '../../../interfaces/appointment.interface';
import { CorrelationFilter, CorrelationFilterByKey } from '../../../interfaces/correlation-filter.interface';
import { EntityType, EntityTypes, IDoctorEntity } from '../../../interfaces/entity.interface';
import { Patient } from '../../../interfaces/patient.interface';
import { AppointmentService, RawAppointment } from '../../../shared/appointment.service';
import {
  ManagerAvailableSchedules,
  ManagerAvailableSchedulesResponse,
  ManagerCancelScheduleResponse,
  ManagerCreatePatient,
  ManagerCreateSchedule,
  ManagerCreateScheduleExam,
  ManagerCreateScheduleResponse,
  ManagerPatientPhoneType,
  ManagerPatientSchedulesResponse,
  ManagerScheduleValue,
  ManagerScheduleValueResponse,
  ManagerUpdatePatient,
  ManagerFollowUpSchedulesResponse,
  ManagerFollowUpSchedulesRequest,
  ManagerPatientFollowUpResponse,
} from '../interfaces';
import { ManagerApiService } from './manager-api.service';
import { ManagerEntitiesService } from './manager-entities.service';
import { ManagerHelpersService } from './manager-helpers.service';
import * as Sentry from '@sentry/node';
import * as contextService from 'request-context';
import { MatchFlowActions } from '../../../flow/interfaces/match-flow-actions';
import { getDefaultPatientAppointmentFlow } from '../../../shared/default-flow-appointment';
import { DoctorData } from '../interfaces/entities';
import { InterAppointmentService } from '../../../shared/inter-appointment.service';
import { betweenDate } from '../../../../common/helpers/between';
import { EntitiesFiltersService } from '../../../shared/entities-filters.service';
import { Reschedule, UpdatePatient } from '../../../integrator/interfaces';
import { castObjectIdToString, castObjectId } from '../../../../common/helpers/cast-objectid';
import { FollowUpAppointment } from '../../../interfaces/appointment.interface';
import { TypeOfServiceEntityDocument } from '../../../entities/schema';

type DoctorEntityWithData = DoctorEntityDocument & { data: DoctorData };

@Injectable()
export class ManagerService implements IIntegratorService {
  constructor(
    private readonly managerApiService: ManagerApiService,
    private readonly managerEntitiesService: ManagerEntitiesService,
    private readonly entitiesService: EntitiesService,
    private readonly appointmentService: AppointmentService,
    private readonly flowService: FlowService,
    private readonly entitiesFiltersService: EntitiesFiltersService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
    private readonly managerHelpersService: ManagerHelpersService,
    private readonly interAppointmentService: InterAppointmentService,
  ) {}

  async cancelSchedule(integration: IntegrationDocument, cancelSchedule: CancelSchedule): Promise<OkResponse> {
    const { appointmentCode } = cancelSchedule;

    try {
      const response: ManagerCancelScheduleResponse = await this.managerApiService.cancelSchedule(
        integration,
        Number(appointmentCode),
      );

      if (response?.handle) {
        return { ok: true };
      }

      return { ok: false };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ManagerService.cancelSchedule', error);
    }
  }

  async confirmSchedule(integration: IntegrationDocument, confirmSchedule: ConfirmSchedule): Promise<OkResponse> {
    const { appointmentCode } = confirmSchedule;

    try {
      const response = await this.managerApiService.confirmSchedule(integration, Number(appointmentCode));
      if (!response.handle) {
        return { ok: false };
      }

      return { ok: true };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ManagerService.confirmSchedule', error);
    }
  }

  private async createScheduleDefault(
    integration: IntegrationDocument,
    createSchedule: CreateSchedule,
  ): Promise<ManagerCreateScheduleResponse> {
    const { appointment, organizationUnit, insurance, procedure, patient, appointmentType, speciality, typeOfService } =
      createSchedule;

    const payload: ManagerCreateSchedule = {
      celular: null,
      convenio: Number(insurance.code),
      imagensAtendimento: null,
      data: moment(appointment.appointmentDate).utc().format('YYYY-MM-DDTHH:mm:ss'),
      duracao: Number(appointment.duration) || null,
      unidadeFilial: null,
      paciente: {
        handle: Number(patient.code),
        email: null,
      },
      tipoAgendamento: appointmentType.code,
      medico: Number(appointment.data.handle),
      listaEspera: '',
      servico: null,
      servicos: null,
      recurso: Number(appointment.data.handle),
    };

    // Se o tipo de serviço for retorno (code 3), é agendado na API como retorno
    if (typeOfService?.code === '3') {
      payload.tipoAgendamento = 'R';
    }

    // Lógica para saúde santa monica, não sei do impacto de enviar para as demais
    // integrações que já estão funcionando
    if (speciality?.code && castObjectIdToString(integration._id) === '64d518046ba2080008564f4d') {
      payload.especialidade = Number(speciality.code);
      delete payload.servicos;
    }

    if (organizationUnit?.code) {
      payload.unidadeFilial = Number(organizationUnit.code);
    }

    if (patient.cellPhone) {
      const phone = formatPhone(convertPhoneNumber(patient.cellPhone ?? patient.phone), true);
      payload.celular = phone;
    }

    if (procedure) {
      payload.servicos = Number(procedure.code);
    }

    if (insurance?.planCode) {
      payload.plano = Number(insurance.planCode);
    }

    return await this.managerApiService.createSchedule(integration, payload, {
      bornDate: patient.bornDate,
      cpf: patient.cpf,
    });
  }

  private async createScheduleExam(
    integration: IntegrationDocument,
    createSchedule: CreateSchedule,
  ): Promise<ManagerCreateScheduleResponse> {
    const { appointment, organizationUnit, insurance, procedure, patient, appointmentType, speciality } =
      createSchedule;

    const payload: ManagerCreateScheduleExam = {
      celular: null,
      convenio: Number(insurance.code),
      imagensAtendimento: null,
      data: moment(appointment.appointmentDate).utc().format('YYYY-MM-DDTHH:mm:ss'),
      duracao: Number(appointment.duration) || null,
      unidadeFilial: null,
      paciente: {
        handle: Number(patient.code),
        email: null,
      },
      tipoAgendamento: appointmentType.code,
      medico: Number(appointment.data.handleRecursoMedicoResponsavel),
      listaEspera: '',
      servico: null,
      servicos: null,
      recurso: Number(appointment.data.handle),
      observacao: '',
      convenioServico: null,
    };

    if (organizationUnit?.code) {
      payload.unidadeFilial = Number(organizationUnit.code);
    }

    if (patient.cellPhone) {
      const phone = formatPhone(convertPhoneNumber(patient.cellPhone ?? patient.phone), true);
      payload.celular = phone;
    }

    if (procedure) {
      payload.servico = Number(procedure.code);
    }

    if (insurance?.planCode) {
      payload.plano = Number(insurance.planCode);
    }

    const procedures = await this.managerApiService.listProceduresExams(integration, {
      convenio: Number(insurance.code),
      grupoServico1: Number(speciality.code),
      plano: Number(insurance.planCode),
    });

    const servico = procedures.find((servico) => servico.handle === Number(procedure.code));

    if (!servico) {
      const metadata = contextService.get('req:default-headers');
      Sentry.captureEvent({
        message: `ERROR:${integration._id}:${integration.name}:MANAGER-request:createScheduleExam`,
        extra: {
          integrationId: integration._id,
          message: 'Não foi possível obter convenioServico',
          payload,
        },
        user: {
          cvId: metadata?.conversationId,
          wsId: metadata?.workspaceId,
          mbId: metadata?.memberId,
        },
      });
      return;
    }

    if (servico) {
      payload.convenioServico = Number(servico.convenioServico);
    }

    return await this.managerApiService.createScheduleExam(integration, payload, {
      bornDate: patient.bornDate,
      cpf: patient.cpf,
    });
  }

  async createSchedule(integration: IntegrationDocument, createSchedule: CreateSchedule): Promise<Appointment> {
    const { appointment, appointmentType } = createSchedule;

    try {
      let response: ManagerCreateScheduleResponse;

      const appointmentTypeEntity = (await this.entitiesService.getEntityByCode(
        appointmentType.code,
        EntityType.appointmentType,
        integration._id,
      )) as AppointmentTypeEntityDocument;

      if (appointmentTypeEntity.params?.referenceScheduleType === ScheduleType.Exam) {
        response = await this.createScheduleExam(integration, createSchedule);
      } else {
        response = await this.createScheduleDefault(integration, createSchedule);
      }

      if (!!response?.handle) {
        return {
          appointmentDate: appointment.appointmentDate,
          appointmentCode: String(response.handle),
          status: AppointmentStatus.scheduled,
        };
      }
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ManagerService.createSchedule', error);
    }
  }

  async createPatient(integration: IntegrationDocument, { patient }: CreatePatient): Promise<Patient> {
    const phone = formatPhone(convertPhoneNumber(patient.cellPhone ?? patient.phone), true);
    const payload: ManagerCreatePatient = {
      cpf: patient.cpf,
      dataNascimento: moment(patient.bornDate).toISOString(),
      email: patient.email,
      nome: patient.name,
      sexo: String(patient.sex).toUpperCase(),
      telefones: [
        {
          telefoneNumerico: phone,
          telefone: phone,
          tipo: {
            handle: ManagerPatientPhoneType.cellPhone,
            nome: 'Celular',
          },
        },
      ],
    };

    try {
      await this.managerApiService.createPatient(integration, payload);
      const createdPatient = await this.getPatient(integration, {
        bornDate: patient.bornDate,
        cpf: patient.cpf,
      });

      return createdPatient;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ManagerService.createPatient', error);
    }
  }

  extract(): Promise<OkResponse> {
    throw HTTP_ERROR_THROWER(HttpStatus.NOT_IMPLEMENTED, 'ManagerService.extract: Not implemented');
  }

  async extractSingleEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    filter?: CorrelationFilter,
    cache: boolean = false,
  ): Promise<EntityTypes[]> {
    return await this.managerEntitiesService.extractEntity(integration, entityType, filter, cache);
  }

  private async createListAvailableSchedulesObject(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
  ): Promise<{
    payload: ManagerAvailableSchedules;
    interAppointmentPeriodApplied: number;
    doctorsScheduledMapped: Map<string, number>;
  }> {
    const { filter, patient } = availableSchedules;
    const dateFormat = 'YYYY-MM-DD';
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

        if (interAppointmentPeriod > 0 && availableSchedules.fromDay < interAppointmentPeriod) {
          availableSchedules.fromDay = interAppointmentPeriod;
          interAppointmentPeriodApplied = interAppointmentPeriod;
        }
      }
    } catch (error) {
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_GATEWAY, error);
    }

    const { fromDay } = availableSchedules;

    const { start, end } = this.appointmentService.getPeriodFromPeriodOfDay(integration, {
      periodOfDay: availableSchedules.periodOfDay,
      limit: availableSchedules.limit,
      sortMethod: availableSchedules.sortMethod,
      randomize: availableSchedules.randomize,
      period: availableSchedules.period,
    });

    const payload: ManagerAvailableSchedules = {
      convenio: null,
      disponivelWeb: true,
      altura: 0,
      peso: 0,
      dataInicial: moment().add(fromDay, 'days').startOf('day').format(dateFormat),
      grupoServico: null,
      handlePaciente: null,
      horaInicial: start,
      horaFinal: end,
      idade: null,
      medicosResponsaveis: [],
      plano: null,
      sexo: null,
      unidadesFiliais: [],
      tipoServico: null,
      tipoProcedimento: null,
      servico: null,
      especialidade: null,
      usarCache: true,
    };

    if (patient?.bornDate) {
      payload.idade = moment().diff(patient.bornDate, 'years');
    }

    if (filter.insurance?.code) {
      payload.convenio = Number(filter.insurance.code);
    }

    if (filter.speciality?.code) {
      payload.especialidade = Number(filter.speciality.code);
    }

    if (patient?.code) {
      payload.handlePaciente = Number(patient.code);
    }

    if (filter.procedure?.code) {
      payload.servico = Number(filter.procedure.code);
    }

    if (filter.insurancePlan?.code) {
      const { insurancePlan } = filter;
      payload.plano = Number(insurancePlan.code);
    }

    if (filter.organizationUnit?.code) {
      payload.unidadesFiliais.push(Number(filter.organizationUnit.code));
    } else {
      const organizationUnits = await this.managerHelpersService.listActiveOrganizationUnits(integration);
      payload.unidadesFiliais = organizationUnits.map((orgUnit) => Number(orgUnit.code));
    }

    if (filter.appointmentType?.code) {
      const { appointmentType } = filter;

      payload.tipoServico = appointmentType.code;
      payload.tipoProcedimento = appointmentType.code;
    }

    // Agendamento de exame necessita de grupoServico. Na usuy é o mesmo codigo da especialidade
    // precisa validar em outra clinica se é o mesmo comportamento
    if (
      filter.appointmentType?.params?.referenceScheduleType === ScheduleType.Exam &&
      filter.speciality?.code &&
      filter.procedure?.code
    ) {
      payload.grupoServico = Number(filter.speciality?.code);
    }

    return { payload, interAppointmentPeriodApplied, doctorsScheduledMapped };
  }

  public async splitListAvailableSchedules(
    payload: ManagerAvailableSchedules,
    availableSchedules: ListAvailableSchedules,
    integration: IntegrationDocument,
  ): Promise<ManagerAvailableSchedulesResponse[]> {
    const { untilDay } = availableSchedules;
    const dateFormat = 'YYYY-MM-DD';

    const daysToSearch = 7;

    if (untilDay <= daysToSearch) {
      return await this.managerApiService.listAvailableSchedules(integration, payload);
    }

    const requestsNumber = Math.ceil(untilDay / daysToSearch);

    const responsePromises = [];
    const managerResponse: ManagerAvailableSchedulesResponse[] = [];

    for (let stack = 0; stack < requestsNumber; stack++) {
      const fromDay = availableSchedules.fromDay + stack * daysToSearch;
      const dynamicPayload: ManagerAvailableSchedules = {
        ...payload,
        dataInicial: moment().add(fromDay, 'days').startOf('day').format(dateFormat),
      };

      responsePromises.push(this.managerApiService.listAvailableSchedules(integration, dynamicPayload));
    }

    await Promise.allSettled(responsePromises).then((responses) => {
      responses
        .filter((response) => response.status === 'fulfilled')
        .forEach(({ value }: PromiseFulfilledResult<ManagerAvailableSchedulesResponse[]>) => {
          value?.forEach((data, index) => {
            if (!managerResponse.length) {
              managerResponse.push(...value);
            } else {
              managerResponse[index].recursosServico = managerResponse[index].recursosServico.concat(
                data.recursosServico,
              );
            }
          });
        });
    });

    return managerResponse;
  }

  private createFollowUpSchedulesObject(
    filter: CorrelationFilter,
    allPatientsFollowUpSchedules: ManagerPatientFollowUpResponse[],
  ): ManagerFollowUpSchedulesRequest {
    const patientFollowUpScheduleMatch = allPatientsFollowUpSchedules.find(
      (schedule) =>
        schedule?.recurso?.handle === Number(filter?.doctor?.code) &&
        schedule?.convenio?.handle === Number(filter?.insurance?.code) &&
        schedule?.especialidade?.handle === Number(filter?.speciality?.code),
    );

    const dataInicial = moment().startOf('day').format('YYYY-MM-DDTHH:mm:ss');
    const dataFinal = patientFollowUpScheduleMatch.prazoMaximoParaRetorno;

    const doctorCode = filter?.doctor?.code || patientFollowUpScheduleMatch?.recurso?.handle;
    const insuranceCode = filter?.insurance?.code || patientFollowUpScheduleMatch?.convenio?.handle;
    const insurancePlanCode = filter?.insurancePlan?.code || patientFollowUpScheduleMatch?.plano?.handle;
    const specialityCode = filter?.speciality?.code || patientFollowUpScheduleMatch?.especialidade?.handle;
    const procedureCode = filter?.procedure?.code || patientFollowUpScheduleMatch?.servico?.handle;
    const organizationUnitCode = filter?.organizationUnit?.code || patientFollowUpScheduleMatch?.unidadeFilial?.handle;

    // campos obrigatórios: recurso (doctor.code), dataInicial, dataFinal, convenio
    const payload: ManagerFollowUpSchedulesRequest = {
      recurso: Number(doctorCode),
      convenio: Number(insuranceCode),
      dataInicial,
      dataFinal,
      usarCache: true,
      tipoServico: null,
      disponivelWeb: true,
      unidadesFiliais: [],
      unidadeFilial: null,
      plano: null,
      servico: null,
      especialidade: null,
      peso: null,
      altura: null,
      idade: null,
      medicosResponsaveis: null,
      medicoResponsavel: null,
      sexo: null,
      duracao: null,
      intervalo: null,
    };

    if (specialityCode) {
      payload.especialidade = Number(specialityCode);
    }

    if (procedureCode) {
      payload.servico = Number(procedureCode);
    }

    if (insurancePlanCode) {
      payload.plano = Number(insurancePlanCode);
    }

    if (organizationUnitCode) {
      payload.unidadesFiliais.push(Number(organizationUnitCode));
    }

    return payload;
  }

  private transformFollowUpSchedulesToAvailableSchedules(
    followUpSchedules: ManagerFollowUpSchedulesResponse,
  ): ManagerAvailableSchedulesResponse[] {
    if (!followUpSchedules?.datasDisponiveisExame?.length) return [];

    // Agrupa por unidadeFilial
    const unidadesMap = new Map<
      number,
      {
        handleUnidadeFilial: number;
        nomeUnidadeFilial: string;
        recursosServico: any[][];
      }
    >();

    followUpSchedules.datasDisponiveisExame.forEach((dateData) => {
      dateData.horarios.forEach((horario) => {
        const unidadeFilial = horario.unidadeFilial;
        const nomeUnidadeFilial = horario.unidadeFilialNome;

        if (!unidadesMap.has(unidadeFilial)) {
          unidadesMap.set(unidadeFilial, {
            handleUnidadeFilial: unidadeFilial,
            nomeUnidadeFilial: nomeUnidadeFilial,
            recursosServico: [],
          });
        }

        // Monta o recursoServico no mesmo padrão da listagem
        const recursoServico = {
          handle: followUpSchedules.handle,
          handleServico: followUpSchedules.handleServico,
          handleRecursoMedicoResponsavel: followUpSchedules.handleRecursoMedicoResponsavel,
          recursoMedicoResponsavel: followUpSchedules.recursoMedicoResponsavel,
          nome: followUpSchedules.nome,
          datasDisponiveisExame: [
            {
              data: dateData.data,
              horarios: [horario],
            },
          ],
        };

        // Procura se já existe um recurso igual para agrupar os horários na mesma data
        let recursos = unidadesMap.get(unidadeFilial).recursosServico;
        let recursoExistente = recursos.find(
          (rs) => rs[0].handle === recursoServico.handle && rs[0].handleServico === recursoServico.handleServico,
        );

        if (recursoExistente) {
          // Agrupa datasDisponiveisExame
          let dataExistente = recursoExistente[0].datasDisponiveisExame.find((d) => d.data === dateData.data);
          if (dataExistente) {
            dataExistente.horarios.push(horario);
          } else {
            recursoExistente[0].datasDisponiveisExame.push({
              data: dateData.data,
              horarios: [horario],
            });
          }
        } else {
          recursos.push([recursoServico]);
        }
      });
    });

    return Array.from(unidadesMap.values());
  }

  async getAvailableSchedules(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
  ): Promise<ListAvailableSchedulesResponse> {
    try {
      const {
        filter,
        patient,
        period,
        randomize,
        sortMethod = AppointmentSortMethod.default,
        limit,
        periodOfDay,
      } = availableSchedules;

      const isFollowUpAppointment = filter.typeOfService?.params?.referenceTypeOfService === TypeOfService.followUp;

      if (isFollowUpAppointment && !patient?.code) {
        return { schedules: [], metadata: {} };
      }

      let response: ManagerAvailableSchedulesResponse[] = [];
      let metadata: AvailableSchedulesMetadata = {};
      let doctorsScheduledMappedFromObject: Map<string, number> = new Map<string, number>();

      if (isFollowUpAppointment) {
        // pega do cache a lista horários para retornos do paciente
        // precisa complementar a informação com limite de data de retorno
        let patientFollowUpSchedules = await this.integrationCacheUtilsService.getPatientSchedulesGenericsCache<
          ManagerPatientFollowUpResponse[]
        >(integration, patient.code, TypeOfService.followUp);

        if (!patientFollowUpSchedules) {
          patientFollowUpSchedules = await this.managerApiService.listPatientFollowUpSchedules(
            integration,
            Number(patient.code),
          );
        }

        if (!patientFollowUpSchedules || !patientFollowUpSchedules.length) {
          return { schedules: [], metadata };
        }

        const payload = this.createFollowUpSchedulesObject(filter, patientFollowUpSchedules);

        const availableFollowUpSchedulesForPatient = await this.managerApiService.listFollowUpSchedules(
          integration,
          payload,
        );

        if (!availableFollowUpSchedulesForPatient?.datasDisponiveisExame?.length) {
          return { schedules: [], metadata };
        }

        // transformar follow up em available schedules
        response = this.transformFollowUpSchedulesToAvailableSchedules(availableFollowUpSchedulesForPatient);
      }
      // fluxo padrão de busca de horários - quando não é busca de horários para retorno.
      else {
        const { payload, interAppointmentPeriodApplied, doctorsScheduledMapped } =
          await this.createListAvailableSchedulesObject(integration, availableSchedules);

        doctorsScheduledMappedFromObject.clear();
        doctorsScheduledMapped.forEach((value, key) => {
          doctorsScheduledMappedFromObject.set(key, value);
        });

        metadata = {
          interAppointmentPeriod: interAppointmentPeriodApplied,
        };

        response = await this.splitListAvailableSchedules(payload, availableSchedules, integration);
      }

      // se não tem horário para nenhuma unidade que retornou na request
      if (!response?.length || response?.every((data) => !data?.recursosServico?.length)) {
        return { schedules: [], metadata };
      }

      const schedules: RawAppointment[] = [];

      const defaultScheduleData: Partial<RawAppointment> = {
        appointmentTypeId: filter.appointmentType.code,
        insuranceId: filter.insurance.code,
      };

      if (filter.procedure?.code) {
        defaultScheduleData.procedureId = filter.procedure.code;
      }

      if (filter.speciality?.code) {
        defaultScheduleData.specialityId = filter.speciality.code;
      }

      if (filter.insurancePlan?.code) {
        defaultScheduleData.insurancePlanId = filter.insurancePlan.code;
      }

      const doctors: DoctorEntityDocument[] = await this.entitiesService.getValidEntities(
        EntityType.doctor,
        integration._id,
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

      const doctorsMap = validDoctors.reduce((map, doctor) => {
        map[doctor.code] = doctor;
        return map;
      }, {});

      // como agrupou por crm utiliza para filtrar os horarios na saida de todos os codigos
      // de medico do mesmo CRM
      let doctorsCodes: string[] = [];

      if (filter.doctor?.code) {
        const doctorData = filter.doctor?.data as unknown as DoctorData;

        // faz essa busca pq o medico enviado para a selecao do paciente foi agrupado pelo crm
        // como um medico pode ter mais de um cadastro em multiplas unidades, se eu nao selecionar
        // a unidade, entao retorna dois medicos, e aqui eu busco os cadastros deles pelo crm
        // para passar na logica abaixo de se ele existe na listagem de horarios
        if (doctorData?.crm) {
          const crmDoctors = await this.entitiesService.getActiveEntities(
            EntityType.doctor,
            {
              'data.crm': doctorData.crm,
            },
            integration._id,
          );

          doctorsCodes.push(...crmDoctors.map((doctor) => doctor.code));
        }

        doctorsCodes.push(filter.doctor.code);
      }

      // valor médicos agrupados pelo crm
      if (filter.doctor?.code) {
        const doctorData = filter.doctor.data as unknown as DoctorData;

        if (doctorData?.handle) {
          doctorsCodes.push(...(doctorData?.handle.split(',') ?? []));
        }
      }

      response?.forEach(({ recursosServico }) => {
        recursosServico.forEach((recursoServico) => {
          recursoServico.forEach((resource) => {
            if (filter.appointmentType.params?.referenceScheduleType === ScheduleType.Consultation) {
              let doctorOrResource = doctorsMap[String(resource.handle)];
              let doctor = doctorsMap[String(resource.handleRecursoMedicoResponsavel)];

              if (filter.doctor?.code && !!doctor && !doctorsCodes.includes(String(doctor?.code))) {
                doctor = undefined;
              }

              if (filter.doctor?.code && !!doctorOrResource && !doctorsCodes.includes(doctorOrResource?.code)) {
                doctorOrResource = undefined;
              }

              const hasDoctor = !!doctor || !!doctorOrResource;

              if (hasDoctor) {
                resource.datasDisponiveisExame.forEach((resourceAvailability) => {
                  resourceAvailability.horarios.forEach((resourceDate) => {
                    const doctorId = String(resource.handle);
                    const scheduleDate = this.managerHelpersService.formatDate(
                      resourceAvailability.data,
                      resourceDate.horario,
                    );

                    const schedule: RawAppointment = {
                      ...defaultScheduleData,
                      appointmentCode: scheduleDate,
                      duration: String(resourceDate.duracao),
                      appointmentDate: scheduleDate,
                      status: AppointmentStatus.scheduled,
                      doctorId,
                      doctorDefault: {
                        name: resource.recursoMedicoResponsavel?.trim(),
                        friendlyName: resourceDate.medicoRespEscala,
                        code: doctorId,
                      } as Partial<IDoctorEntity>,
                      organizationUnitId: String(resourceDate.unidadeFilial ?? -1),
                      data: {
                        type: 1,
                        handleRecursoMedicoResponsavel: String(resource.handleRecursoMedicoResponsavel),
                        handle: String(resource.handle),
                        resourceCode: String(resourceDate.recurso),
                      },
                    };
                    if (isFollowUpAppointment) {
                      schedules.push(schedule);
                    } else {
                      const filteredInterAppointmentSchedules =
                        this.interAppointmentService.filterInterAppointmentByDoctorCode(
                          integration,
                          schedule,
                          doctorsScheduledMappedFromObject,
                          filter,
                        );

                      if (filteredInterAppointmentSchedules) {
                        schedules.push(filteredInterAppointmentSchedules);
                      }
                    }
                  });
                });
              }
            }

            if (filter.appointmentType.params?.referenceScheduleType === ScheduleType.Exam) {
              resource.datasDisponiveisExame.forEach((resourceAvailability) => {
                resourceAvailability.horarios.forEach((resourceDate) => {
                  const doctorId = String(resourceDate.handleMedicoRespEscala);
                  const scheduleDate = this.managerHelpersService.formatDate(
                    resourceAvailability.data,
                    resourceDate.horario,
                  );

                  let doctor = doctorsMap[String(resourceDate.handleMedicoRespEscala)];
                  let doctorOrResource = doctorsMap[String(resource.handle)];

                  if (filter.doctor?.code && !!doctorOrResource && !doctorsCodes.includes(doctorOrResource?.code)) {
                    doctorOrResource = undefined;
                  }

                  if (filter.doctor?.code && !!doctor && !doctorsCodes.includes(String(doctor?.code))) {
                    doctor = undefined;
                  }

                  const hasDoctor = !!doctor || !!doctorOrResource;

                  if (hasDoctor) {
                    const schedule: RawAppointment = {
                      ...defaultScheduleData,
                      appointmentCode: scheduleDate,
                      duration: String(resourceDate.duracao),
                      appointmentDate: scheduleDate,
                      status: AppointmentStatus.scheduled,
                      doctorId,
                      doctorDefault: {
                        name: resourceDate.medicoRespEscala,
                        friendlyName: resourceDate.medicoRespEscala,
                        code: doctorId,
                      } as Partial<IDoctorEntity>,
                      organizationUnitId: String(resourceDate.unidadeFilial ?? -1),
                      data: {
                        type: 1,
                        handleRecursoMedicoResponsavel: doctorId,
                        handle: resourceDate.recurso,
                        resourceCode: String(resourceDate.recurso),
                      },
                    };

                    if (isFollowUpAppointment) {
                      schedules.push(schedule);
                    } else {
                      const filteredInterAppointmentSchedules =
                        this.interAppointmentService.filterInterAppointmentByDoctorCode(
                          integration,
                          schedule,
                          doctorsScheduledMappedFromObject,
                          filter,
                        );

                      if (filteredInterAppointmentSchedules) {
                        schedules.push(filteredInterAppointmentSchedules);
                      }
                    }
                  }
                });
              });
            }
          });
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
          schedules,
        );

      const validSchedules = await this.appointmentService.transformSchedules(integration, randomizedAppointments);
      return { schedules: validSchedules, metadata: { ...metadata, ...partialMetadata } };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ManagerService.getAvailableSchedules', error);
    }
  }

  async getScheduleValue(integration: IntegrationDocument, scheduleValue: GetScheduleValue): Promise<AppointmentValue> {
    const { insurance, doctor, appointmentType } = scheduleValue;

    const payload: ManagerScheduleValue = {
      convenio: Number(insurance.code),
      data: moment().format('YYYY-MM-DD'),
      recurso: Number(doctor.code),
      tipoServico: appointmentType.code,
    };

    // Para exames deve passar o id do recurso para apresentar os valores corretos
    if (scheduleValue.data?.resourceCode && appointmentType.code === 'P') {
      payload.recurso = Number(scheduleValue.data.resourceCode);
    }

    try {
      const response: ManagerScheduleValueResponse = await this.managerApiService.getScheduleValue(
        integration,
        payload,
      );

      if (!response?.valorTotal) {
        return null;
      }

      return {
        currency: 'R$',
        value: formatCurrency(response.valorTotal),
      };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ManagerService.getScheduleValue', error);
    }
  }

  async getEntityList(
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
        return await this.managerEntitiesService.listValidApiEntities(integration, targetEntity, filters, cache);

      case EntityType.doctor:
        return await this.resolveListValidApiDoctors(integration, filters, cache, patient);

      case EntityType.organizationUnitLocation:
      case EntityType.occupationArea:
        return await this.entitiesService.getValidEntities(targetEntity, integration._id);

      default:
        return [] as EntityDocument[];
    }
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
      const response = await this.managerApiService.listPatientSchedules(integration, {
        paciente: Number(patientCode),
      });

      if (!response?.content) {
        await this.integrationCacheUtilsService.setPatientSchedulesCache(integration, patientCode, {
          minifiedSchedules,
          schedules: [],
        });

        return minifiedSchedules;
      }

      const validSchedules =
        !startDate && !endDate
          ? response?.content
          : response?.content?.filter((schedule) => betweenDate(schedule.data, startDate, endDate));

      const activeSchedules: ManagerPatientSchedulesResponse[] = this.managerHelpersService.omitCanceledSchedules(
        integration,
        validSchedules,
      );

      const schedules: Appointment[] = await Promise.all(
        activeSchedules?.map(async (managerSchedule) => {
          const [schedule] = await this.appointmentService.transformSchedules(
            integration,
            [await this.managerHelpersService.createPatientAppointmentObject(integration, managerSchedule)],
            false,
          );

          const flowSteps: FlowSteps[] = [FlowSteps.listPatientSchedules];

          if (patientSchedules.target) {
            flowSteps.push(patientSchedules.target);
          }

          const flowAction = getDefaultPatientAppointmentFlow(schedule, integration);
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

          if (flowAction) {
            matchFlows.customFlowActions = [flowAction];
          }

          const flowActions = await this.flowService.matchFlowsAndGetActions(matchFlows);

          delete schedule.canCancel;
          delete schedule.canConfirm;
          delete schedule.canReschedule;

          minifiedSchedules.appointmentList.push({
            appointmentCode: String(managerSchedule.handle),
            appointmentDate: managerSchedule.data,
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
      throw INTERNAL_ERROR_THROWER('ManagerService.getMinifiedPatientSchedules', error);
    }
  }

  async getMultipleEntitiesByFilter(
    integration: IntegrationDocument,
    filter: CorrelationFilterByKey,
  ): Promise<CorrelationFilter> {
    return await this.entitiesService.createCorrelationFilterData(filter, 'code', integration._id);
  }

  async getPatient(integration: IntegrationDocument, filters: PatientFilters): Promise<Patient> {
    const { cpf, code, bornDate, cache } = filters;
    const patientCache = await this.integrationCacheUtilsService.getPatientFromCache(integration, code, cpf);

    if (patientCache && cache) {
      return patientCache;
    }

    const patientExists = await this.managerApiService.checkPatientExists(integration, {
      cpf,
    });

    if (!patientExists) {
      throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
    }

    const patientAuth = await this.managerApiService.patientAuth(integration, {
      cpfOrProtocolo: cpf,
      dataNascimento: bornDate,
    });

    const managerPatient = await this.managerApiService.getAuthenticatedPatient(integration, {
      bornDate,
      cpf,
    });
    const patient = this.managerHelpersService.replaceManagerPatientToPatient(managerPatient);
    await Promise.all([
      this.integrationCacheUtilsService.setPatientCache(integration, patient.code, patient.cpf, patient),
      this.integrationCacheUtilsService.setPatientTokenCache(
        integration,
        patient.code,
        patientAuth.token,
        PATIENT_CACHE_EXPIRATION,
      ),
    ]);

    return patient;
  }

  async getPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<Appointment[]> {
    const { patientCode, startDate, endDate } = patientSchedules;

    try {
      const response = await this.managerApiService.listPatientSchedules(integration, {
        paciente: Number(patientCode),
      });

      if (!response?.content?.length) {
        return [];
      }

      const validSchedules =
        !startDate && !endDate
          ? response?.content
          : response?.content?.filter((schedule) => betweenDate(schedule.data, startDate, endDate));

      const activeSchedules: ManagerPatientSchedulesResponse[] = this.managerHelpersService.omitCanceledSchedules(
        integration,
        validSchedules,
      );

      return await this.appointmentService.transformSchedules(
        integration,
        await Promise.all(
          activeSchedules?.map(
            async (schedule) => await this.managerHelpersService.createPatientAppointmentObject(integration, schedule),
          ),
        ),
        false,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ManagerService.getPatientSchedules', error);
    }
  }

  async getStatus(integration: IntegrationDocument): Promise<OkResponse> {
    try {
      const organizationUnits = await this.managerApiService.listOrganizationUnits(integration, false, true);

      if (organizationUnits?.length) {
        return { ok: true };
      }

      const insurances = await this.managerApiService.listInsurances(integration, {}, false, true);

      if (insurances?.length) {
        return { ok: true };
      }

      return { ok: false };
    } catch (error) {
      throw error;
    }
  }

  public async reschedule(integration: IntegrationDocument, reschedule: Reschedule): Promise<Appointment> {
    const { scheduleToCancelCode, scheduleToCreate, patient } = reschedule;

    try {
      // busca agendamentos do paciente para pegar dados de qual será cancelado
      let patientAppointments = await this.getPatientSchedules(integration, { patientCode: patient.code });
      const appointmentToCancel = patientAppointments.find(
        (appointment) => appointment.appointmentCode == scheduleToCancelCode,
      );

      if (!appointmentToCancel) {
        throw INTERNAL_ERROR_THROWER('ManagerService.reschedule', {
          message: 'ManagerService.reschedule: unable to find appointment to cancel',
        });
      }

      const { procedure, appointmentCode, speciality } = appointmentToCancel;
      const cancelSchedulePayload = {
        appointmentCode,
        patientCode: patient.code,
        procedure: {
          code: null,
          specialityCode: procedure?.specialityCode || speciality?.code,
          specialityType: procedure?.specialityType || speciality?.specialityType,
        },
      };
      const canceledOldAppointment = await this.cancelSchedule(integration, cancelSchedulePayload);

      if (!canceledOldAppointment.ok) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          {
            message: 'ManagerService.reschedule: unable to cancel old appointment',
          },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      const createdAppointment = await this.createSchedule(integration, scheduleToCreate);

      if (!createdAppointment.appointmentCode) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          {
            message: 'ManagerService.reschedule: error creating new schedule',
          },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      return createdAppointment;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ManagerService.reschedule', error);
    }
  }

  async updatePatient(
    integration: IntegrationDocument,
    patientCode: string,
    { patient }: UpdatePatient,
  ): Promise<Patient> {
    const managerPatient = await this.managerApiService.getAuthenticatedPatient(integration, {
      cpf: patient.cpf,
      bornDate: patient.bornDate,
    });

    if (!managerPatient?.handle) {
      return null;
    }

    const phone = formatPhone(convertPhoneNumber(patient.cellPhone ?? patient.phone), true);
    const payload: ManagerUpdatePatient = {
      ...managerPatient,
      handle: Number(patientCode),
      nome: patient.name,
      cpf: patient.cpf,
      dataNascimento: moment(patient.bornDate).toISOString(),
      sexo: String(patient.sex).toUpperCase(),
      email: patient.email,
      telefones: [
        ...managerPatient.telefones?.filter(({ tipo }) => tipo?.handle != ManagerPatientPhoneType.cellPhone),
        {
          telefone: phone,
          telefoneNumerico: phone,
          tipo: {
            handle: ManagerPatientPhoneType.cellPhone,
            nome: 'Celular',
          },
        },
      ],
    };

    try {
      const managerPatient = await this.managerApiService.updatePatient(integration, payload, {
        bornDate: patient.bornDate,
        cpf: patient.cpf,
      });
      const replacedPatient = this.managerHelpersService.replaceManagerPatientToPatient(managerPatient);
      await this.integrationCacheUtilsService.setPatientCache(
        integration,
        replacedPatient.code,
        replacedPatient.cpf,
        replacedPatient,
      );
      return replacedPatient;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ManagerService.updatePatient', error);
    }
  }

  private async getValidDoctorsFromScheduleList(
    integration: IntegrationDocument,
    filter: CorrelationFilter,
    patient?: InitialPatient,
  ): Promise<EntityDocument[]> {
    const availableSchedules: ListAvailableSchedules = {
      filter,
      randomize: false,
      limit: 30,
      period: {
        start: '00:00',
        end: '23:59',
      },
      fromDay: 1,
      untilDay: 21,
      patient: {
        bornDate: patient?.bornDate,
        sex: patient?.sex,
        cpf: patient?.cpf,
      },
    };

    try {
      const { payload } = await this.createListAvailableSchedulesObject(integration, availableSchedules);
      const response = await this.splitListAvailableSchedules(payload, availableSchedules, integration);

      if (!response?.length || response?.every((data) => !data?.recursosServico?.length)) {
        return [];
      }

      const doctorsSet = new Set<string>();

      response?.forEach(({ recursosServico }) => {
        recursosServico?.forEach((rs) =>
          rs.forEach((resource) => {
            resource.datasDisponiveisExame.forEach((resourceAvailability) => {
              resourceAvailability.horarios.forEach((resourceDate) => {
                const doctorId = this.managerHelpersService.getValidDoctorIdByAppointmentType(
                  filter.appointmentType,
                  resource,
                  resourceDate,
                );

                if (doctorId) {
                  doctorsSet.add(doctorId);
                }
              });
            });
          }),
        );
      });

      if (!doctorsSet.size) {
        return [];
      }

      const doctors = (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        Array.from(doctorsSet),
        EntityType.doctor,
      )) as DoctorEntityWithData[];

      // Passo o handle para filtrar os medicos na listagem de horarios
      // @TODO: Talvez aqui chamar a rota agendador/recurso-medico?handleRecurso=? para
      // mostrar o nome do médico e não o nome do aparelho / recurso
      const doctorsGroup: { [crm: string]: DoctorEntityWithData & any } = {};
      const doctorsList: DoctorEntityWithData[] = [];

      doctors.forEach((doctor) => {
        const crm = doctor.data?.crm;

        if (!crm) {
          doctorsList.push(doctor);
        } else {
          const crmGroup = doctorsGroup[crm];

          if (crmGroup) {
            doctorsGroup[crm] = {
              ...crmGroup,
              data: {
                ...crmGroup.data,
                handle: `${crmGroup.data.handle},${doctor.code}`,
              },
            };
          } else {
            doctorsGroup[crm] = {
              ...doctor.toJSON(),
              data: {
                ...(doctor.data ?? {}),
                handle: doctor.code,
              },
            };
          }
        }
      });

      return [...Object.values(doctorsGroup), ...doctorsList];
    } catch (error) {
      console.error(error);
      throw INTERNAL_ERROR_THROWER('ManagerService.getValidDoctorsFromScheduleList', error);
    }
  }

  public async resolveListValidApiDoctors(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
    patient?: InitialPatient,
  ) {
    if (
      integration.rules?.listOnlyDoctorsWithAvailableSchedules ||
      // hoje se for exame só busca médicos se pegar de quem tem horários disponíveis
      // @TODO: ver futuramente se tem outra forma de buscar
      filters.appointmentType?.params?.referenceScheduleType === ScheduleType.Exam
    ) {
      return await this.getValidDoctorsFromScheduleList(integration, filters, patient);
    }

    const doctors = await this.managerEntitiesService.listValidApiEntities<DoctorEntityDocument>(
      integration,
      EntityType.doctor,
      filters,
      cache,
    );

    // ao retornar os médicos sem um filtro de unidade, pode retornar de forma duplicada
    // por isso realizar um filtro por crm para nao mostrar mais de um na selecao do paciente

    // A listagem de horários nao envia o codigo do medico na listagem de horarios, o filtro é em memória
    // entao na listagem de horarios tambem tem um agrupamento para considerar os dois ids de medicos agrupados pelo crm, se existir
    // e se for um médico realmente e não um recurso
    const doctorsWithCrm: DoctorEntityDocument[] = [];
    const doctorsWithoutCrm: DoctorEntityDocument[] = [];

    doctors.forEach((doctor) => {
      if ((doctor.data as unknown as DoctorData)?.crm) {
        doctorsWithCrm.push(doctor);
      } else {
        doctorsWithoutCrm.push(doctor);
      }
    });

    const groupedDoctors = uniqBy(doctorsWithCrm, 'data.crm') || [];
    return [...groupedDoctors, ...doctorsWithoutCrm];
  }

  async getPatientFollowUpSchedules(integration: IntegrationDocument, filters: any): Promise<FollowUpAppointment[]> {
    const { patientCode } = filters;

    try {
      // lista horários para retorno do paciente
      const patientFollowUpSchedules = await this.managerApiService.listPatientFollowUpSchedules(
        integration,
        Number(patientCode),
      );

      if (!patientFollowUpSchedules?.length) {
        return [];
      }

      if (patientFollowUpSchedules) {
        await this.integrationCacheUtilsService.setPatientSchedulesGenericsCache<ManagerPatientFollowUpResponse[]>(
          integration,
          patientCode,
          patientFollowUpSchedules,
          TypeOfService.followUp,
        );
      }

      const typeOfServiceFollowUp: TypeOfServiceEntityDocument = await this.entitiesService
        .getModel(EntityType.typeOfService)
        .findOne({
          'params.referenceTypeOfService': TypeOfService.followUp,
          integrationId: castObjectId(integration._id),
        });

      const schedules: FollowUpAppointment[] = await Promise.all(
        patientFollowUpSchedules.map(async (singleFollowUpSchedule) => {
          const replacedEntities = await this.entitiesService.createCorrelationFilterData(
            {
              procedure: singleFollowUpSchedule.servico?.handle?.toString(),
              doctor: singleFollowUpSchedule.recurso?.handle?.toString(),
              insurance: singleFollowUpSchedule.convenio?.handle?.toString(),
              insurancePlan: singleFollowUpSchedule.plano?.handle?.toString(),
              organizationUnit: singleFollowUpSchedule.unidadeFilial?.handle?.toString(),
              speciality: singleFollowUpSchedule.especialidade?.handle?.toString(),
              appointmentType: 'C',
            },
            'code',
            integration._id,
          );

          const followUpSchedule: FollowUpAppointment = {
            ...replacedEntities,
            followUpLimit: singleFollowUpSchedule.prazoMaximoParaRetorno,
            appointmentDate: singleFollowUpSchedule.dataHoraAtendimento,
            inFollowUpPeriod: moment(singleFollowUpSchedule.prazoMaximoParaRetorno).isSameOrAfter(moment()),
            typeOfServiceFollowUp,
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
