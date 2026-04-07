import { HttpStatus, Injectable } from '@nestjs/common';
import { orderBy, pick } from 'lodash';
import * as moment from 'moment';
import { HttpErrorOrigin, HTTP_ERROR_THROWER, INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import {
  AppointmentTypeEntityDocument,
  ScheduleType,
  DoctorEntityDocument,
  EntityDocument,
} from '../../../entities/schema';
import { EntitiesService } from '../../../entities/services/entities.service';
import { FlowSteps } from '../../../flow/interfaces/flow.interface';
import { FlowService } from '../../../flow/service/flow.service';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { CancelSchedule } from '../../../integrator/interfaces/cancel-schedule.interface';
import { CreatePatient } from '../../../integrator/interfaces/create-patient.interface';
import { CreateSchedule } from '../../../integrator/interfaces/create-schedule.interface';
import { IIntegratorService } from '../../../integrator/interfaces/integrator-service.interface';
import {
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
import { EntityType, EntityTypes } from '../../../interfaces/entity.interface';
import { Patient } from '../../../interfaces/patient.interface';
import { AppointmentService, RawAppointment } from '../../../shared/appointment.service';
import { DEFAULT_USER_TO_AUTH, PATIENT_TOKEN_EXPIRATION } from '../defaults';
import { AppointmentData, ProcedureData } from '../interfaces/entities';
import { SIDoPatientLoginRequest, SIGetPatientByCpfRequest } from '../interfaces/patient.interface';
import {
  SICreateScheduleExamParamsRequest,
  SICreateScheduleExamResponse,
  SICreateScheduleParamsRequest,
  SICreateScheduleResponse,
  SiListAvailableExamsParamsRequest,
  SIListAvailableSchedulesParamsRequest,
  SIListAvailableSchedulesResponse,
  SIPatientSchedule,
  SIPatientSchedulesParamsRequest,
} from '../interfaces/schedule.interface';
import { SuporteInformaticaApiService } from './suporte-informatica-api.service';
import { SuporteInformaticaEntitiesService } from './suporte-informatica-entities.service';
import { SuporteInformaticaExtractorService } from './suporte-informatica-extractor.service';
import { SuporteInformaticaHelpersService } from './suporte-informatica-helpers.service';
import { EntitiesFiltersService } from '../../../shared/entities-filters.service';
import { PATIENT_CACHE_EXPIRATION } from '../../../integration-cache-utils/cache-expirations';
import { formatCurrency } from '../../../../common/helpers/format-currency';

@Injectable()
export class SuporteInformaticaService implements IIntegratorService {
  constructor(
    private readonly suporteInformaticaApiService: SuporteInformaticaApiService,
    private readonly entitiesService: EntitiesService,
    private readonly appointmentService: AppointmentService,
    private readonly flowService: FlowService,
    private readonly entitiesFiltersService: EntitiesFiltersService,
    private readonly suporteInformaticaHelpersService: SuporteInformaticaHelpersService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
    private readonly suporteInformaticaEntitiesService: SuporteInformaticaEntitiesService,
    private readonly suporteInformaticaExtractorService: SuporteInformaticaExtractorService,
  ) {}

  async cancelSchedule(integration: IntegrationDocument, cancelSchedule: CancelSchedule): Promise<OkResponse> {
    const { appointmentCode, patientCode, patient } = cancelSchedule;

    try {
      const response = await this.suporteInformaticaApiService.cancelSchedule(
        integration,
        {
          COD_USUARIOLOGADO: Number(patientCode),
          AceiteMensagemConfirmacao: false,
          ID_HORARIO: Number(appointmentCode),
          DES_MOTIVOCANCELAMENTO: 'Cancelado via chatbot botdesigner',
          ID_MOTIVOCANCELAMENTO: 1,
        },
        {
          bornDate: patient.bornDate,
          cpf: patient.cpf,
          name: patient.name,
          phone: patient.phone,
        },
      );

      if (response?.CodErro > 0 || response?.MensagemErro) {
        return { ok: false };
      }
      return { ok: true };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SuporteInformaticaService.cancelSchedule', error);
    }
  }

  confirmSchedule(): Promise<OkResponse> {
    throw HTTP_ERROR_THROWER(HttpStatus.NOT_IMPLEMENTED, 'SuporteInformaticaService.confirmSchedule: Not implemented');
  }

  async createScheduleDefault(
    integration: IntegrationDocument,
    createSchedule: CreateSchedule,
  ): Promise<SICreateScheduleResponse> {
    const { appointment, organizationUnit, insurance, doctor, patient, speciality, appointmentType } = createSchedule;
    const appointmentDate = moment.utc(appointment.appointmentDate);
    const dataUserCode: string = patient.data?.codUsuario;
    const dateFormat = 'YYYY-MM-DDTHH:mm:ss';

    const { code: specialityCode } = this.suporteInformaticaHelpersService.getCompositeProcedureCode(speciality.code);

    const payload: SICreateScheduleParamsRequest = {
      CODUsuarioRespReserva: Number(dataUserCode || 0),
      IDHorario: Number(appointment.code),
      DHOAtendimento: appointmentDate.format(dateFormat),
      CODPessoa: Number(patient.code),
      CODEspecialidade: Number(specialityCode),
      DatAtendimento: appointmentDate.startOf('day').format(dateFormat),
      CODConvenio: Number(insurance.code),
      CODTipoAtendimento: Number(appointmentType.code),
      CODProfissional: Number(doctor.code),
      DataNascimentoCliente: moment.utc(patient.bornDate).format(dateFormat),
      SexoCliente: patient.sex.toUpperCase(),
      AceiteMensagemConfirmacao: false,
      EmailPessoa: patient.email || 'email@gmail.com',
    };

    if (organizationUnit) {
      payload.CODLocal = Number(organizationUnit.code);
    }

    return await this.suporteInformaticaApiService.createSchedule(integration, payload, {
      bornDate: patient.bornDate,
      cpf: patient.cpf,
      name: patient.name,
      phone: patient.phone,
    });
  }

  async createScheduleExam(
    integration: IntegrationDocument,
    createSchedule: CreateSchedule,
  ): Promise<SICreateScheduleExamResponse> {
    const { appointment, organizationUnit, insurance, doctor, patient, procedure, appointmentType } = createSchedule;
    const appointmentDate = moment.utc(appointment.appointmentDate);
    const dataUserCode: string = patient.data?.codUsuario;
    const dateFormat = 'YYYY-MM-DDTHH:mm:ss';

    const payload: SICreateScheduleExamParamsRequest = {
      CODUsuarioMarcacao: Number(dataUserCode || 0),
      CODConvenioMarcacao: Number(insurance.code),
      IDRedeAtendimentoConvenio: 0,
      CODTipoAtendimento: Number(appointmentType.code),
      DesEmailMarcacao: patient.email || '',
      CodAtualizarCadastro: false,
      CODPessoaMarcacao: Number(patient.code),
      IndFamiliar: false,
      ConfirmaLeituraTermo: 0,
      CodFormaAtendimento: 0,
      ListaExamesSelecionados: [
        {
          COD_LOCAL: Number(organizationUnit.code),
          ID_PROCEDIMENTO: Number((procedure.data as ProcedureData).idProcedure),
          COD_PROFISSIONAL: Number(doctor?.code || 0),
          ID_HORARIO: Number(appointment.code),
          DAT_ATENDIMENTO: appointmentDate.format(dateFormat),
          HOR_ATENDIMENTO: appointmentDate.format(dateFormat),
          NUM_VALORATENDIMENTO: 0,
          EXIGECONFIRMACAOLEITURAALERTAS: false,
          CONFIRMALEITURAALERTA: false,
          COD_RECEBENOTIFICACAO: 0,
          COD_TIPOAGENDAMENTO: 0,
          ID_PROGRAMACAO: (appointment.data as AppointmentData).idProgramacao,
        },
      ],
    };

    return await this.suporteInformaticaApiService.createScheduleExam(integration, payload, {
      bornDate: patient.bornDate,
      cpf: patient.cpf,
      name: patient.name,
      phone: patient.phone,
    });
  }

  async createSchedule(integration: IntegrationDocument, createSchedule: CreateSchedule): Promise<Appointment> {
    const { appointment, appointmentType } = createSchedule;

    try {
      let response: SICreateScheduleResponse | SICreateScheduleExamResponse;

      const appointmentTypeEntity = (await this.entitiesService.getEntityByCode(
        appointmentType.code,
        EntityType.appointmentType,
        integration._id,
      )) as AppointmentTypeEntityDocument;

      if (appointmentTypeEntity.params.referenceScheduleType === ScheduleType.Exam) {
        response = await this.createScheduleExam(integration, createSchedule);
      } else {
        response = await this.createScheduleDefault(integration, createSchedule);
      }

      if (response?.CodErro > 0 || response?.MensagemErro) {
        if (response?.MensagemErro?.includes('já foi reservado')) {
          throw HTTP_ERROR_THROWER(HttpStatus.CONFLICT, 'Filled schedule', HttpErrorOrigin.INTEGRATION_ERROR);
        }

        // retorna essa exception se o agendamento deveria ser um retorno, teria que mudar
        // o tipo de agendamento na seleção
        if (response?.MensagemErro?.includes('tipo de atendimento Retorno')) {
          throw HTTP_ERROR_THROWER(HttpStatus.CONFLICT, 'Type of service conflict', HttpErrorOrigin.INTEGRATION_ERROR);
        }

        if (response?.MensagemErro?.includes('outra marcação dentro do intervalo')) {
          throw HTTP_ERROR_THROWER(
            HttpStatus.CONFLICT,
            'Overlapping Schedules conflict',
            HttpErrorOrigin.INTEGRATION_ERROR,
          );
        }

        throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, response.MensagemErro);
      }

      return {
        appointmentDate: appointment.appointmentDate,
        duration: appointment.duration,
        guidance: '',
        appointmentCode: appointment.code,
        status: AppointmentStatus.scheduled,
      };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SuporteInformaticaService.createSchedule', error);
    }
  }

  async createPatient(integration: IntegrationDocument, createPatient: CreatePatient): Promise<Patient> {
    try {
      const payload = this.suporteInformaticaHelpersService.createPatientPayload(createPatient);
      const response = await this.suporteInformaticaApiService.createPatient(integration, payload);

      if ((!response?.PessoaLogin || !response?.UsuarioLogin) && response?.CodErro > 0) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.CONFLICT,
          `SuporteInformaticaService.createPatient: ${response?.MensagemErro}`,
        );
      }

      if (!response?.PessoaLogin || !response?.UsuarioLogin) {
        throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'SuporteInformaticaService.createPatient');
      }

      const patient = this.suporteInformaticaHelpersService.replaceSIPatientFromTokenLogin(response);

      if (patient) {
        await this.integrationCacheUtilsService.setPatientCache(integration, patient.code, patient.cpf, patient);
        await this.integrationCacheUtilsService.setPatientTokenCache(
          integration,
          patient.cpf,
          response.Token,
          PATIENT_TOKEN_EXPIRATION,
        );
      }

      return patient;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SuporteInformaticaService.createPatient', error);
    }
  }

  async extractSingleEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    filter?: CorrelationFilter,
    cache: boolean = false,
  ): Promise<EntityTypes[]> {
    return await this.suporteInformaticaEntitiesService.extractEntity(
      integration,
      entityType,
      filter,
      undefined,
      cache,
    );
  }

  public async splitGetAvailableSchedules(
    payload: SIListAvailableSchedulesParamsRequest,
    availableSchedules: ListAvailableSchedules,
    integration: IntegrationDocument,
  ): Promise<SIListAvailableSchedulesResponse> {
    const { untilDay, fromDay, patient } = availableSchedules;
    const dateFormat = 'YYYY-MM-DDTHH:mm:ss';

    const responseAvailableDates = await this.suporteInformaticaApiService.listAvailableSchedules(
      integration,
      payload,
      {
        bornDate: patient.bornDate,
        cpf: patient.cpf,
        name: patient.name,
        phone: patient.phone,
      },
    );

    // encontra horários disponiveis na request e filtra pelo limite máximo de dias do untilDay e fromDay
    const availableDates = responseAvailableDates.listaHorarios
      .map((schedule) => schedule.DAT_ATENDIMENTO)
      .filter(
        (date) =>
          moment.utc(date).isSameOrBefore(moment().utc().add(untilDay, 'day')) &&
          moment.utc(date).isSameOrAfter(moment().utc().add(fromDay, 'day').startOf('day')),
      );

    const defaultResponse: SIListAvailableSchedulesResponse = {
      CodErro: 0,
      MensagemErro: '',
      listaHorarios: [],
      listaLocais: [],
      listaProfissionais: [],
    };

    if (!availableDates.length) {
      return defaultResponse;
    }

    const availableDatesLimitToSearch = 10;
    const responsePromises = [];
    const daysToSearch =
      availableDates.length > availableDatesLimitToSearch ? availableDatesLimitToSearch : availableDates.length;

    for (let stack = 0; stack < daysToSearch; stack++) {
      const currentDate = availableDates[stack];

      const dynamicPayload: SIListAvailableSchedulesParamsRequest = {
        ...payload,
        DATReferenciaHorarios: moment(currentDate).startOf('day').format(dateFormat),
      };

      responsePromises.push(
        this.suporteInformaticaApiService.listAvailableSchedules(integration, dynamicPayload, {
          bornDate: patient.bornDate,
          cpf: patient.cpf,
          name: patient.name,
          phone: patient.phone,
        }),
      );
    }

    await Promise.allSettled(responsePromises).then((responses) => {
      responses
        .filter((response) => response.status === 'fulfilled')
        .forEach(({ value }: PromiseFulfilledResult<SIListAvailableSchedulesResponse>) => {
          defaultResponse.listaHorarios = defaultResponse?.listaHorarios.concat(value.listaHorarios);
        });
    });

    return defaultResponse;
  }

  async listAvailableConsultations(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
  ): Promise<RawAppointment[]> {
    const { filter, patient } = availableSchedules;
    const { speciality, insurance, doctor, organizationUnit, appointmentType } = filter;
    const dateFormat = 'YYYY-MM-DDTHH:mm:ss';

    const { code: specialityCode } = this.suporteInformaticaHelpersService.getCompositeProcedureCode(speciality.code);

    const payload: SIListAvailableSchedulesParamsRequest = {
      CODConvenio: Number(insurance.code),
      CODEspecialidade: Number(specialityCode),
      CODPessoa: Number(patient.code),
      DATNascimentoCliente: moment(patient.bornDate).format(dateFormat),
      CODTipoProfissional: 1,
      CODTipoAtendimento: Number(appointmentType.code),
      SexoCliente: patient.sex?.toUpperCase(),
    };

    if (doctor?.code) {
      payload.CODProfissional = Number(doctor.code);
    }

    if (organizationUnit?.code) {
      payload.CODLocal = Number(organizationUnit.code);
    }

    if (filter.organizationUnitLocation?.code) {
      payload.CODSeqLocalidade = Number(filter.organizationUnitLocation.code);
    }

    try {
      const data: SIListAvailableSchedulesResponse = await this.splitGetAvailableSchedules(
        payload,
        availableSchedules,
        integration,
      );

      const doctors: DoctorEntityDocument[] = await this.entitiesService.getValidEntities(
        EntityType.doctor,
        integration._id,
      );

      const [matchedDoctors] = await this.flowService.matchEntitiesFlows({
        integrationId: integration._id,
        entities: doctors,
        targetEntity: FlowSteps.doctor,
        filters: { patientBornDate: patient?.bornDate, patientSex: patient?.sex, patientCpf: patient?.cpf },
        entitiesFilter: availableSchedules.filter,
      });

      const validDoctors = this.entitiesFiltersService.filterEntitiesByParams(integration, matchedDoctors, {
        bornDate: patient?.bornDate,
      });

      const doctorsMap: { [key: string]: EntityDocument } = validDoctors.reduce((acc, doctor) => {
        acc[doctor.code] = doctor;
        return acc;
      }, {});

      const replacedAppointments: RawAppointment[] = [];
      const canReturnSchedulePrice = filter.insurance?.params?.showAppointmentValue || false;

      for await (const schedule of data?.listaHorarios || []) {
        if (doctorsMap[schedule.COD_PROFISSIONAL]) {
          const replacedAppointment: Appointment & { [key: string]: any } = {
            appointmentCode: String(schedule.ID_HORARIO),
            appointmentDate: schedule.HOR_ATENDIMENTO,
            procedureId: filter.procedure?.code,
            doctorId: String(schedule.COD_PROFISSIONAL),
            organizationUnitId: String(schedule.COD_LOCAL),
            status: AppointmentStatus.scheduled,
            specialityId: String(schedule.COD_ESPECIALIDADE),
          };

          if (canReturnSchedulePrice && schedule.NUM_PRECOATENDIMENTO) {
            replacedAppointment.price = {
              value: formatCurrency(schedule.NUM_PRECOATENDIMENTO, 2),
              currency: 'R$',
            };
          }

          replacedAppointments.push(replacedAppointment);
        }
      }

      return replacedAppointments;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SuporteInformaticaService.listAvailableConsultations', error);
    }
  }

  async listAvailableExams(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
  ): Promise<RawAppointment[]> {
    const { filter, patient, untilDay, fromDay } = availableSchedules;
    const dateFormat = 'YYYY-MM-DDTHH:mm:ss';

    const payload: SiListAvailableExamsParamsRequest = {
      CodConvenio: Number(filter.insurance.code),
      CodTipoProfissional: 0,
      CodCliente: 0,
      TipoConsulta: 1,
      CodTipoAtendimento: Number(filter.appointmentType.code),
      SexoCliente: patient.sex?.toUpperCase(),
      CodSexo: patient.sex?.toUpperCase(),
      IdadeCliente: moment().diff(patient.bornDate, 'months'),
      ListaProcedimentoLocal: [
        {
          ID_PROCEDIMENTO: Number((filter.procedure.data as unknown as ProcedureData).idProcedure),
          COD_PROCEDIMENTO: Number(filter.procedure.code),
          CodProfissional: -1,
          CodLocal: -1,
        },
      ],
      CodClienteMarcacao: Number(patient.code),
      DATInicialPeriodo: moment().add(fromDay, 'days').startOf('day').format(dateFormat),
      DATFinalPeriodo: moment().add(untilDay, 'days').endOf('day').format(dateFormat),
    };

    if (filter.doctor?.code) {
      payload.ListaProcedimentoLocal = payload.ListaProcedimentoLocal.map((procedimentoLocal) => ({
        ...procedimentoLocal,
        CodProfissional: Number(filter.doctor.code),
      }));
      payload.CodProfissional = Number(filter.doctor.code);
    }

    if (filter.organizationUnit?.code) {
      payload.ListaProcedimentoLocal = payload.ListaProcedimentoLocal.map((procedimentoLocal) => ({
        ...procedimentoLocal,
        CodLocal: Number(filter.organizationUnit.code),
      }));
    }

    if (filter.organizationUnitLocation?.code) {
      payload.CodSeqLocalidade = Number(filter.organizationUnitLocation.code);
    }

    try {
      const response = await this.suporteInformaticaApiService.listAvailableExams(integration, payload, {
        bornDate: patient.bornDate,
        cpf: patient.cpf,
        name: patient.name,
        phone: patient.phone,
      });

      const doctors: DoctorEntityDocument[] = await this.entitiesService.getValidEntities(
        EntityType.doctor,
        integration._id,
      );

      const [matchedDoctors] = await this.flowService.matchEntitiesFlows({
        integrationId: integration._id,
        entities: doctors,
        targetEntity: FlowSteps.doctor,
        filters: { patientBornDate: patient?.bornDate, patientSex: patient?.sex, patientCpf: patient?.cpf },
        entitiesFilter: availableSchedules.filter,
      });

      const validDoctors = this.entitiesFiltersService.filterEntitiesByParams(integration, matchedDoctors, {
        bornDate: patient?.bornDate,
      });

      const doctorsMap: { [key: string]: EntityDocument } = validDoctors.reduce((acc, doctor) => {
        acc[doctor.code] = doctor;
        return acc;
      }, {});

      const validSchedules: RawAppointment[] = [];
      const canReturnSchedulePrice = filter.insurance?.params?.showAppointmentValue || false;

      for (const local of response.LISTALOCAIS) {
        for (const procedimentoLocal of local?.LISTAPROCEDIMENTOSLOCAL || []) {
          for (const profissionalProcLocal of procedimentoLocal?.LISTAPROFISSIONAISPROCEDLOCAL || []) {
            if (doctorsMap[profissionalProcLocal.COD_PROFISSIONAL]) {
              for (const dataDisponivel of profissionalProcLocal?.LISTADATAS || []) {
                for (const horarioDisponivel of dataDisponivel?.LISTAHORARIOS || []) {
                  const schedule: RawAppointment = {
                    appointmentCode: String(horarioDisponivel.ID_HORARIO),
                    appointmentDate: horarioDisponivel.HOR_ATENDIMENTO,
                    appointmentTypeId: filter.appointmentType.code,
                    procedureId: filter.procedure.code,
                    doctorId: String(dataDisponivel.COD_PROFISSIONAL),
                    organizationUnitId: String(local.COD_LOCAL),
                    status: AppointmentStatus.scheduled,
                    insuranceId: filter.insurance.code,
                    data: {
                      idProgramacao: horarioDisponivel.ID_PROGRAMACAO,
                    } as AppointmentData,
                  };

                  if (canReturnSchedulePrice && horarioDisponivel.NUM_PRECOPROCEDIMENTOPROF) {
                    schedule.price = {
                      value: formatCurrency(horarioDisponivel.NUM_PRECOPROCEDIMENTOPROF, 2),
                      currency: 'R$',
                    };
                  }

                  validSchedules.push(schedule);
                }
              }
            }
          }
        }
      }

      return validSchedules;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SuporteInformaticaService.listAvailableExams', error);
    }
  }

  async getAvailableSchedules(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
  ): Promise<ListAvailableSchedulesResponse> {
    const {
      period,
      randomize,
      sortMethod = AppointmentSortMethod.default,
      filter,
      limit,
      periodOfDay,
    } = availableSchedules;
    let schedules: RawAppointment[] = [];

    const appointmentTypeEntity = (await this.entitiesService.getEntityByCode(
      filter.appointmentType.code,
      EntityType.appointmentType,
      integration._id,
    )) as AppointmentTypeEntityDocument;

    if (appointmentTypeEntity.params.referenceScheduleType === ScheduleType.Exam) {
      schedules = await this.listAvailableExams(integration, availableSchedules);
    } else {
      schedules = await this.listAvailableConsultations(integration, availableSchedules);
    }

    try {
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
      return { schedules: validSchedules, metadata: { ...partialMetadata } };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SuporteInformaticaService.getAvailableSchedules', error);
    }
  }

  getScheduleValue(): Promise<AppointmentValue> {
    throw HTTP_ERROR_THROWER(HttpStatus.NOT_IMPLEMENTED, 'SuporteInformaticaService.getScheduleValue: Not implemented');
  }

  async extractAllEntities(integration: IntegrationDocument): Promise<OkResponse> {
    return await this.suporteInformaticaExtractorService.extract(integration);
  }

  async getEntityList(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    targetEntity: EntityType,
    cache?: boolean,
    patient?: InitialPatient,
  ): Promise<EntityDocument[]> {
    if (!patient?.cpf || !patient?.bornDate) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        'Cannot authenticate patient',
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }

    switch (targetEntity) {
      case EntityType.insurancePlan:
      case EntityType.speciality:
      case EntityType.appointmentType:
      case EntityType.insurance:
      case EntityType.doctor:
      case EntityType.procedure:
      case EntityType.organizationUnit:
        return await this.suporteInformaticaEntitiesService.listValidApiEntities(
          integration,
          targetEntity,
          filters,
          patient,
          cache,
        );

      case EntityType.organizationUnitLocation:
      case EntityType.occupationArea:
        return await this.entitiesService.getValidEntities(targetEntity, integration._id);

      default:
        return [] as EntityDocument[];
    }
  }

  private async listActivePatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<SIPatientSchedule[]> {
    const { patientCode } = patientSchedules;

    const payload: SIPatientSchedulesParamsRequest = {
      COD_PESSOA: Number(patientCode),
      RetornarHistorico: false,
    };

    try {
      const data = await this.suporteInformaticaApiService.listPatientSchedules(integration, payload, {
        bornDate: patientSchedules.patientBornDate,
        cpf: patientSchedules.patientCpf,
        name: patientSchedules.patientName,
        phone: patientSchedules.patientPhone,
      });
      return data?.listaAgendamentos?.filter((siSchedule) => siSchedule.COD_STATUSHORARIO !== 6) || [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SuporteInformaticaService.listActivePatientSchedules', error);
    }
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
      const siSchedules = await this.listActivePatientSchedules(integration, patientSchedules);

      if (!siSchedules?.length) {
        await this.integrationCacheUtilsService.setPatientSchedulesCache(integration, patientCode, {
          minifiedSchedules,
          schedules: [],
        });

        return minifiedSchedules;
      }

      const results = await Promise.all(
        siSchedules.map((schedule) =>
          this.suporteInformaticaApiService.listPatientScheduleDetails(
            integration,
            {
              COD_PESSOA: Number(patientCode),
              ID_HORARIO: schedule.ID_HORARIO,
            },
            {
              bornDate: DEFAULT_USER_TO_AUTH.bornDate,
              cpf: DEFAULT_USER_TO_AUTH.cpf,
              name: DEFAULT_USER_TO_AUTH.name,
              phone: DEFAULT_USER_TO_AUTH.phone,
            },
          ),
        ),
      );

      const schedules: Appointment[] = await Promise.all(
        results.map(async (siSchedule) => {
          const [schedule] = await this.appointmentService.transformSchedules(integration, [
            await this.suporteInformaticaHelpersService.createPatientScheduleObject(integration, siSchedule),
          ]);

          const flowSteps = [FlowSteps.listPatientSchedules];

          if (patientSchedules.target) {
            flowSteps.push(patientSchedules.target);
          }

          const flowActions = await this.flowService.matchFlowsAndGetActions({
            integrationId: integration._id,
            targetFlowTypes: flowSteps,
            entitiesFilter: {
              ...pick(schedule, [
                EntityType.appointmentType,
                EntityType.doctor,
                EntityType.procedure,
                EntityType.insurance,
                EntityType.insurancePlan,
                EntityType.organizationUnit,
                EntityType.speciality,
                EntityType.organizationUnitLocation,
                EntityType.occupationArea,
                EntityType.typeOfService,
                EntityType.insuranceSubPlan,
              ]),
            },
          });

          minifiedSchedules.appointmentList.push({
            appointmentCode: String(siSchedule.Agendamento.ID_HORARIO),
            appointmentDate: siSchedule.Agendamento.HOR_ATENDIMENTO,
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
      throw INTERNAL_ERROR_THROWER('SuporteInformaticaService.getMinifiedPatientSchedules', error);
    }
  }

  async getMultipleEntitiesByFilter(
    integration: IntegrationDocument,
    filter: CorrelationFilterByKey,
  ): Promise<CorrelationFilter> {
    return await this.entitiesService.createCorrelationFilterData(filter, 'code', integration._id);
  }

  async getPatient(integration: IntegrationDocument, filters: PatientFilters): Promise<Patient> {
    const { cpf, code, name, phone, bornDate, motherName, cache } = filters;
    const patientCache = await this.integrationCacheUtilsService.getPatientFromCache(integration, code, cpf);
    const dateFormat = 'YYYY-MM-DD HH:mm:ss';

    if (patientCache && cache) {
      return patientCache;
    }

    try {
      const payload: SIGetPatientByCpfRequest = {
        CPF: cpf,
        DataNascimento: moment(bornDate).format(dateFormat),
        NomePessoa: '',
        Telefone: '',
        NomeMae: '',
      };

      if (name) {
        const patientName = name.trim();
        payload.NomePessoa = patientName;
      }

      if (phone) {
        payload.Telefone = phone;
      }

      if (motherName) {
        const patientMotherName = motherName.trim();
        payload.NomeMae = patientMotherName;
      }

      const response = await this.suporteInformaticaApiService.getPatientByCpf(integration, payload);

      // Existe um CPF mas a data de nascimento não confere
      if (response?.CodErro === 2) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.FORBIDDEN,
          'Validation failed: bornDate',
          HttpErrorOrigin.INTEGRATION_ERROR,
          true,
        );
      }

      // Existe mais de um usuário com o mesmo CPF
      if (response?.CodErro === 3) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.CONFLICT,
          'Validation failed: Multiple users with the same CPF',
          HttpErrorOrigin.INTEGRATION_ERROR,
          true,
        );
      }

      if (response?.CodErro === 1) {
        throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', HttpErrorOrigin.INTEGRATION_ERROR, true);
      }

      if (response?.CodErro === 5) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.NOT_FOUND,
          'Required more data to validate patient',
          HttpErrorOrigin.INTEGRATION_ERROR,
          true,
        );
      }

      if (response?.CodErro === 7) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.NOT_FOUND,
          'User with invalid account',
          HttpErrorOrigin.INTEGRATION_ERROR,
          true,
        );
      }

      // Depois de encontrar a pessoa realiza login para manter o token nas próximas requests
      if (response?.CodPessoa) {
        const { DesNomePessoa, TelefoneCelular, TelefoneComercial, DatNascimento, DesCPF } = response;

        const doLoginPayload: SIDoPatientLoginRequest = {
          CPF: DesCPF,
          DataNascimento: moment(DatNascimento).format(dateFormat),
          Nome: DesNomePessoa,
          Telefone: String(TelefoneCelular || TelefoneComercial) || '',
          TipoLogin: 1,
          PrimeiroNome: DesNomePessoa.split(' ')[0],
          UltimoNome: '',
          Carteira: '',
        };

        const patientDoLoginResponse = await this.suporteInformaticaApiService.doPatientLogin(
          integration,
          doLoginPayload,
        );

        if (patientDoLoginResponse?.CodErro === 1 || !patientDoLoginResponse?.PessoaLogin) {
          throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
        }

        const patient = this.suporteInformaticaHelpersService.replaceSIPatientFromTokenLogin(patientDoLoginResponse);

        // response de login não retorna número do celular então pego número da request anterior
        if (!patient.cellPhone) {
          patient.cellPhone = String(TelefoneCelular);
        }

        await this.integrationCacheUtilsService.setPatientCache(integration, patient.code, patient.cpf, patient);
        await this.integrationCacheUtilsService.setPatientTokenCache(
          integration,
          patient.cpf,
          patientDoLoginResponse.Token,
          PATIENT_CACHE_EXPIRATION,
        );

        return patient;
      }

      throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SuporteInformaticaService.getPatient', error);
    }
  }

  async getPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<Appointment[]> {
    const { patientCode } = patientSchedules;
    try {
      const siSchedules = await this.listActivePatientSchedules(integration, patientSchedules);

      if (!siSchedules?.length) {
        return [];
      }

      const results = await Promise.all(
        siSchedules.map(
          async (schedule) =>
            await this.suporteInformaticaApiService.listPatientScheduleDetails(
              integration,
              {
                COD_PESSOA: Number(patientCode),
                ID_HORARIO: schedule.ID_HORARIO,
              },
              {
                bornDate: DEFAULT_USER_TO_AUTH.bornDate,
                cpf: DEFAULT_USER_TO_AUTH.cpf,
                name: DEFAULT_USER_TO_AUTH.name,
                phone: DEFAULT_USER_TO_AUTH.phone,
              },
            ),
        ),
      );

      const rawAppointments: RawAppointment[] = await Promise.all(
        results.map(async (schedule) =>
          this.suporteInformaticaHelpersService.createPatientScheduleObject(integration, schedule),
        ),
      );

      return await this.appointmentService.transformSchedules(integration, rawAppointments);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SuporteInformaticaService.getPatientSchedules', error);
    }
  }

  async getStatus(integration: IntegrationDocument): Promise<OkResponse> {
    return { ok: true };
  }

  reschedule(): Promise<Appointment> {
    throw HTTP_ERROR_THROWER(HttpStatus.NOT_IMPLEMENTED, 'SuporteInformaticaService.reschedule: Not implemented');
  }

  updatePatient(): Promise<Patient> {
    throw HTTP_ERROR_THROWER(HttpStatus.NOT_IMPLEMENTED, 'SuporteInformaticaService.updatePatient: Not implemented');
  }
}
