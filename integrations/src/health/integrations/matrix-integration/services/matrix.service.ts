import { HttpStatus, Injectable } from '@nestjs/common';
import { HTTP_ERROR_THROWER, HttpErrorOrigin, INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { formatPhone } from '../../../../common/helpers/format-phone';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import {
  DoctorEntityDocument,
  EntityDocument,
  InsuranceEntityDocument,
  InsurancePlanEntityDocument,
  OrganizationUnitEntityDocument,
} from '../../../entities/schema';
import { EntitiesService } from '../../../entities/services/entities.service';
import { FlowAction, FlowActionElement, FlowSteps } from '../../../flow/interfaces/flow.interface';
import { FlowService } from '../../../flow/service/flow.service';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import {
  AvailableSchedulesMetadata,
  CancelSchedule,
  ConfirmationScheduleGuidance,
  ConfirmationScheduleGuidanceResponse,
  ConfirmSchedule,
  CreateSchedule,
  DownloadDocumentData,
  GetScheduleValue,
  IIntegratorService,
  ListAvailableSchedules,
  ListAvailableSchedulesResponse,
  MatchFlowsConfirmation,
  PatientFilters,
  PatientSchedules,
  UpdatePatient,
} from '../../../integrator/interfaces';
import { CreatePatient } from '../../../integrator/interfaces/create-patient.interface';
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
import {
  MatrixAvailableSchedules,
  MatrixAvailableSchedulesResponse,
  MatrixBlockSchedule,
  MatrixCreateSchedules,
} from '../interfaces/appointment.interface';
import {
  MatrixCreatePatient,
  MatrixPatientResponseV2,
  MatrixPatientSchedulesResponse,
  MatrixUpdatePatient,
} from '../interfaces/patient.interface';
import { MatrixApiService } from './matrix-api.service';
import { MatrixEntitiesService } from './matrix-entities.service';
import { CompositeProcedureCodeData, MatrixHelpersService } from './matrix-helpers.service';
import * as moment from 'moment';
import { MatrixCancelScheduleData } from '../interfaces/entities.interface';
import { formatCurrency } from '../../../../common/helpers/format-currency';
import { MatrixProcedureDataRequest } from '../interfaces/base-register.interface';
import { getDefaultPatientAppointmentFlow } from '../../../shared/default-flow-appointment';
import { MatchFlowActions } from '../../../flow/interfaces/match-flow-actions';
import { orderBy } from 'lodash';
import * as Sentry from '@sentry/node';
import { EntitiesFiltersService } from '../../../shared/entities-filters.service';
import { ExternalInsurancesService } from '../../../external-insurances/services/external-insurances.service';
import { MatrixDownloadService } from './matrix-download.service';
import { MatrixPatientV2, ValidatePatientRecoverAccessProtocol } from '../interfaces/recover-password.interface';
import { MatrixRecoverPasswordService } from './matrix-recover-password.service';
import { RecoverAccessProtocol, RecoverAccessProtocolResponse } from 'kissbot-health-core';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';
import { RulesHandlerService } from '../../../rules-handler/rules-handler.service';
import { MatrixConfirmationService } from './matrix-confirmation.service';
import { CancelScheduleV2, ConfirmScheduleV2, ListSchedulesToConfirmV2 } from '../../../integrator/interfaces';
import { ConfirmationSchedule } from '../../../interfaces/confirmation-schedule.interface';
import { GetScheduleByIdData } from '../../../integrator/interfaces/get-schedule-by-id.interface';
import { Schedules } from '../../../schedules/entities/schedules.entity';
import { SchedulesService } from '../../../schedules/schedules.service';

@Injectable()
export class MatrixService implements IIntegratorService {
  constructor(
    private readonly matrixApiService: MatrixApiService,
    private readonly matrixHelpersService: MatrixHelpersService,
    private readonly matrixEntitiesService: MatrixEntitiesService,
    private readonly matrixConfirmationService: MatrixConfirmationService,
    private readonly entitiesService: EntitiesService,
    private readonly entitiesFiltersService: EntitiesFiltersService,
    private readonly appointmentService: AppointmentService,
    private readonly flowService: FlowService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
    private readonly externalInsurancesService: ExternalInsurancesService,
    private readonly matrixDownloadService: MatrixDownloadService,
    private readonly matrixRecoverPasswordService: MatrixRecoverPasswordService,
    private readonly rulesHandlerService: RulesHandlerService,
    private readonly schedulesService: SchedulesService,
  ) {}

  async generateLoginToken(integration: IntegrationDocument): Promise<boolean> {
    try {
      let token = await this.matrixHelpersService.getLoginToken(integration);

      if (!token) {
        token = await this.matrixApiService.getLoginToken(integration);
        await this.matrixHelpersService.setLoginToken(integration, token);
      }

      return !!token;
    } catch (error) {
      return false;
    }
  }

  async cancelSchedule(integration: IntegrationDocument, cancelSchedule: CancelSchedule): Promise<OkResponse> {
    const { appointmentCode, data } = cancelSchedule;
    const { codigo_pre_pedido }: MatrixCancelScheduleData = data;

    try {
      await this.matrixApiService.cancelSchedule(integration, {
        consulta_id: appointmentCode,
        codigo_pre_pedido,
      });

      return { ok: true };
    } catch (error) {
      const errorMessage = error.response.error.erro;
      if (errorMessage.includes('Não foi possível desmarcar o agendamento.')) {
        return { ok: false };
      }

      throw INTERNAL_ERROR_THROWER('MatrixService.cancelSchedule', error);
    }
  }

  async confirmSchedule(integration: IntegrationDocument, confirmSchedule: ConfirmSchedule): Promise<OkResponse> {
    const { appointmentCode, data } = confirmSchedule;
    const { codigo_pre_pedido }: MatrixCancelScheduleData = data;

    try {
      await this.matrixApiService.confirmSchedule(integration, {
        consulta_id: appointmentCode,
        codigo_pre_pedido,
      });

      return { ok: true };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('MatrixService.confirmSchedule', error);
    }
  }

  async createSchedule(integration: IntegrationDocument, createSchedule: CreateSchedule): Promise<Appointment> {
    const { appointment, organizationUnit, insurance, patient, speciality, procedure, doctor } = createSchedule;
    const dateFormat = 'YYYY-MM-DDTHH:mm:ss';
    let procedureData: CompositeProcedureCodeData = undefined;
    let blockScheduleId: string | undefined = undefined;

    try {
      procedureData = this.matrixHelpersService.getCompositeProcedureCode(integration, procedure.code);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('MatrixService.createSchedule', error);
    }

    try {
      if (!procedureData) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.PRECONDITION_FAILED,
          'Unable to get Procedure Code Composition',
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      const blockSchedulePayload: MatrixBlockSchedule = {
        codigoRegiaoColeta: procedureData.lateralityCode,
        dataHora: moment(appointment.appointmentDate).add('3', 'hours').format(dateFormat),
        duracao: appointment.data.duracao,
        horario_id: appointment.code,
        paciente_id: patient.code,
        procedimento_ID: procedureData.code,
        responsavel_id: doctor.code,
        sala_id: appointment.data.sala_id,
      };
      const blockScheduleResponse = await this.matrixApiService.blockSchedule(integration, blockSchedulePayload);
      blockScheduleId = blockScheduleResponse.id_consulta;
    } catch (error) {
      if (error.response?.error?.erro) {
        const errorMessage = error.response.error.erro;
        if (
          errorMessage.includes('Numero máximo de consultas') ||
          errorMessage.includes('horário já está preenchido') ||
          errorMessage.includes('existe uma consulta que ocupa este horário') ||
          errorMessage.includes('não está disponível') ||
          errorMessage.includes('Não foi possível reservar horário')
        ) {
          throw HTTP_ERROR_THROWER(
            HttpStatus.CONFLICT,
            'Unable to Schedule With Blocked Schedule',
            HttpErrorOrigin.INTEGRATION_ERROR,
          );
        }
      }
      throw INTERNAL_ERROR_THROWER('MatrixService.createSchedule', error);
    }

    try {
      if (!blockScheduleId) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.PRECONDITION_FAILED,
          'Unable to get blocked Schedule Id',
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      const payload: MatrixCreateSchedules = {
        horario_id: appointment.code,
        consulta_id: blockScheduleId,
        convenio_id: insurance.code,
        plano_id: insurance.planCode,
        matricula: '',
        setor_id: speciality.code,
        procedimento_id: procedureData.code,
        codigoRegiaoColeta: procedureData.lateralityCode,
        responsavel_id: doctor.code,
        sala_id: appointment.data.sala_id,
        unidade_id: organizationUnit.code,
        paciente_id: patient.code,
        codigo_pre_pedido: '',
        peso: patient.weight.toString(),
        altura: patient.height.toString(),
        questionarios: [{ codigo: '', resposta: '' }],
      };

      // Lógica fixa para a tecnolab. Se for o convênio particular, fixa CARTEC.
      if (insurance.code === 'PART') {
        payload.convenio_id = 'CARTEC';
        payload.plano_id = 'CARTEC';
      }

      try {
        const pre_schedule_code = await this.matrixHelpersService.getCachePreScheduleCode(integration, {
          patientCpf: patient.cpf,
          patientCode: patient.code,
        });

        if (pre_schedule_code) {
          payload.codigo_pre_pedido = pre_schedule_code;
        }
      } catch (error) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.PRECONDITION_FAILED,
          'Unable to get Pre Schedule Code',
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      const response = await this.matrixApiService.createSchedule(integration, payload);
      const result = response?.[0];

      if (result?.consulta_id) {
        try {
          await this.matrixHelpersService.setCachePreScheduleCode(integration, {
            patientCpf: patient.cpf,
            patientCode: patient.code,
            codigoPrePedido: result.codigo_pre_pedido,
          });
        } catch (error) {}

        return {
          appointmentDate: appointment.appointmentDate,
          duration: appointment.duration,
          appointmentCode: result.consulta_id,
          status: AppointmentStatus.scheduled,
          data: {
            codigo_pre_pedido: result.codigo_pre_pedido,
            consulta_id: result.consulta_id,
          },
        };
      }
    } catch (error) {
      if (error.response?.error?.erro) {
        const errorMessage = error.response.error.erro;
        if (errorMessage.includes('sobrepor') || errorMessage.includes('não está disponível')) {
          throw HTTP_ERROR_THROWER(HttpStatus.CONFLICT, 'Unable to Schedule', HttpErrorOrigin.INTEGRATION_ERROR);
        }
      }

      throw INTERNAL_ERROR_THROWER('MatrixService.createSchedule', error);
    }
  }

  async createPatient(integration: IntegrationDocument, { patient }: CreatePatient): Promise<Patient> {
    const payload: MatrixCreatePatient = {
      documento: patient.cpf,
      tipoDocumento: 'CPF',
      nome: patient.name,
      dataNascimento: moment(patient.bornDate).format('DD/MM/YYYY'),
      sexo: String(patient.sex).toUpperCase(),
      email: patient.email,
    };

    if (patient.phone) {
      const phone = formatPhone(patient.phone, true);
      payload.telefoneDDD = phone.slice(0, 2);
      payload.telefone = phone.slice(2, phone.length);
    }

    if (patient.cellPhone) {
      const cellPhone = formatPhone(patient.cellPhone, true);
      payload.celularDDD = cellPhone.slice(0, 2);
      payload.celular = cellPhone.slice(2, cellPhone.length);
    }

    try {
      await this.matrixApiService.createPatient(integration, payload);

      const createdPatient = await this.matrixApiService.getMatrixPatientWithToken(integration, {
        document: payload.documento,
        documentType: 'CPF',
      });

      const patient = this.matrixHelpersService.replaceMatrixPatientToPatient(createdPatient?.[0]);
      await this.integrationCacheUtilsService.setPatientCache(integration, patient.code, patient.cpf, patient);

      return patient;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('MatrixService.createPatient', error);
    }
  }

  async extractSingleEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    filter?: CorrelationFilter,
    cache: boolean = false,
  ): Promise<EntityTypes[]> {
    return await this.matrixEntitiesService.extractEntity(integration, entityType, filter, undefined, cache, true);
  }

  private async createListAvailableSchedulesObject(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
    multiplierUntilDay: number,
  ): Promise<MatrixAvailableSchedules> {
    const {
      fromDay,
      filter: { insurance, insurancePlan, organizationUnit, speciality, doctor, procedure },
      patient: { code, weight, height },
    } = availableSchedules;

    const maxRangeDays = integration.rules?.limitOfDaysToSplitRequestInScheduleSearch || 7;
    const procedureData = this.matrixHelpersService.getCompositeProcedureCode(integration, procedure.code);
    let newUntilDay = maxRangeDays * multiplierUntilDay || maxRangeDays;
    let newFromDay = fromDay;

    if (multiplierUntilDay > 1) {
      newFromDay = maxRangeDays * (multiplierUntilDay - 1) + fromDay;
    }

    if (newUntilDay <= newFromDay) {
      newUntilDay = newFromDay + maxRangeDays;
    }

    const payload: MatrixAvailableSchedules = {
      dataHora_inicio: moment().add(newFromDay, 'days').startOf('day').format('YYYY-MM-DD'),
      dataHora_fim: moment().add(newUntilDay, 'days').startOf('day').format('YYYY-MM-DD'),
      paciente_id: code,
      peso: weight?.toString(),
      altura: height?.toString(),
      procedimentos: [
        {
          procedimento_id: procedureData.code,
          codigoRegiaoColeta: procedureData.lateralityCode,
        },
      ],
      convenio_id: insurance?.code,
      plano_id: insurancePlan?.code,
      setor_id: speciality?.code,
      responsavel_id: doctor?.code || '',
      unidade_id: organizationUnit?.code || '',
    };

    // Lógica fixa para a tecnolab. Se for o convênio particular, fixa CARTEC.
    if (insurance?.code === 'PART') {
      payload.convenio_id = 'CARTEC';
      payload.plano_id = 'CARTEC';
    }

    return payload;
  }

  public async splitGetAvailableSchedulesByOraganization(
    integration: IntegrationDocument,
    payload: MatrixAvailableSchedules,
    validatedOrganizationUnits: Set<string>,
  ): Promise<MatrixAvailableSchedulesResponse['procedimentos']> {
    const responsePromises = [];
    const response: MatrixAvailableSchedulesResponse['procedimentos'] = [];

    validatedOrganizationUnits.forEach((organization) => {
      const dynamicPayload: MatrixAvailableSchedules = {
        ...payload,
        unidade_id: organization,
      };

      responsePromises.push(this.matrixApiService.listAvailableSchedules(integration, dynamicPayload));
    });

    await Promise.allSettled(responsePromises).then((responses) => {
      responses
        .filter((response) => response.status === 'fulfilled')
        .forEach(({ value }: PromiseFulfilledResult<MatrixAvailableSchedulesResponse['procedimentos']>) => {
          response.push(...(value ?? []));
        });
    });

    return response;
  }

  private async getAvailableSchedulesRecursive(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
    organizationUnitEntity: OrganizationUnitEntityDocument[] = [],
    retryifEmptyCount = 1,
    appointmentsStack = [],
    validatedOrganizationUnits: Set<string> = new Set<string>(),
  ): Promise<ListAvailableSchedulesResponse> {
    const {
      patient,
      filter,
      period,
      randomize,
      sortMethod = AppointmentSortMethod.default,
      limit,
      periodOfDay,
    } = availableSchedules;

    let metadata: AvailableSchedulesMetadata = {};

    if (retryifEmptyCount > 20) {
      Sentry.captureEvent({
        message: 'TECNOLAB:getAvailableSchedulesRecursive',
        extra: {
          integrationId: castObjectIdToString(integration._id),
          message: 'recursividade > 20',
        },
      });
    }

    // maxRangeDays pequeno aumenta a eficiência da rota de busca inteligente da Matrix
    // maxRangeResults deve ser inversamente proporcional ao maxRangeDays para garantir oferta de horario
    const maxRangeDays = integration.rules?.limitOfDaysToSplitRequestInScheduleSearch || 7;
    const maxRangeResults = 7;
    const payload: MatrixAvailableSchedules = await this.createListAvailableSchedulesObject(
      integration,
      availableSchedules,
      retryifEmptyCount,
    );

    const limitDaysToSearchSchedules = integration.rules?.limitUntilDaySearchAppointments || 90;
    const maxRequestsNumber = Math.floor(limitDaysToSearchSchedules / maxRangeDays);

    // chamada da rota horários inteligente da Matrix
    // garantir que todas as regras aplicadas naquele horário seja respeitada,
    // pois a rota de horário normal não possui essa validação.
    validatedOrganizationUnits = await this.getOrganizationUnitsByAvailableSchedulesIntelligent(
      integration,
      payload,
      organizationUnitEntity,
    );

    // garante o fim do loop da recursividade
    // garante busca validada de unidades para outros períodos
    if (retryifEmptyCount >= maxRequestsNumber && !appointmentsStack.length) {
      return { schedules: [], metadata: null };
    }

    if (validatedOrganizationUnits.size === 0 && retryifEmptyCount <= maxRequestsNumber) {
      retryifEmptyCount++;
      return await this.getAvailableSchedulesRecursive(
        integration,
        availableSchedules,
        organizationUnitEntity,
        retryifEmptyCount,
        appointmentsStack,
        validatedOrganizationUnits,
      );
    }

    // garante que a rota normal traga horários de acordo com as unidades validadas pela rota inteligente.
    const resultsByValidOrganizationUnit = await this.splitGetAvailableSchedulesByOraganization(
      integration,
      payload,
      validatedOrganizationUnits,
    );

    const doctorsSet = new Set([]);
    const organizationUnitsSet = new Set([]);

    resultsByValidOrganizationUnit.forEach((procedimento) => {
      procedimento.horarios.forEach((horario) => {
        doctorsSet.add(horario.responsavel_id);
        organizationUnitsSet.add(horario.unidade_id);
      });
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
      entitiesFilter: availableSchedules.filter,
      targetEntity: FlowSteps.doctor,
      filters: { patientBornDate: patient?.bornDate, patientSex: patient?.sex, patientCpf: patient?.cpf },
    });

    const validDoctors = this.entitiesFiltersService.filterEntitiesByParams(integration, matchedDoctors, {
      bornDate: patient?.bornDate,
    });

    const doctorsMap: { [drCode: string]: DoctorEntityDocument } = validDoctors.reduce((map, doctor) => {
      map[doctor.code] = doctor;
      return map;
    }, {});

    const [matchedOrganizationUnits] = await this.flowService.matchEntitiesFlows({
      integrationId: integration._id,
      entities: organizationUnitEntity,
      entitiesFilter: availableSchedules.filter,
      targetEntity: FlowSteps.organizationUnit,
      filters: { patientBornDate: patient?.bornDate, patientSex: patient?.sex, patientCpf: patient?.cpf },
    });

    const validOrganizationUnits = this.entitiesFiltersService.filterEntitiesByParams(
      integration,
      matchedOrganizationUnits,
      {
        bornDate: patient?.bornDate,
      },
    );

    const organizationUnitsMap: { [organizationUnitCode: string]: OrganizationUnitEntityDocument } =
      validOrganizationUnits.reduce((map, organizationUnit) => {
        map[organizationUnit.code] = organizationUnit;
        return map;
      }, {});

    if (retryifEmptyCount > 20) {
      Sentry.captureEvent({
        message: `ERROR:${integration._id}:${integration.name}:MATRIX:getAvailableSchedulesRecursive`,
        extra: {
          integrationId: integration._id,
          message: 'LOOP INFINITO',
        },
      });

      return { schedules: [], metadata: null };
    }

    //garante que não fará mais busca caso não esteja encontrando horários pela rota normal
    if (retryifEmptyCount >= maxRequestsNumber && !appointmentsStack.length) {
      return { schedules: [], metadata: null };
    }

    // se não possui médicos ou empresas validadas, faz mais buscas.
    if (
      (!Object.keys(doctorsMap).length || !Object.keys(organizationUnitsMap).length) &&
      retryifEmptyCount <= maxRequestsNumber
    ) {
      retryifEmptyCount++;
      return await this.getAvailableSchedulesRecursive(
        integration,
        availableSchedules,
        organizationUnitEntity,
        retryifEmptyCount,
        appointmentsStack,
        validatedOrganizationUnits,
      );
    }

    if (
      !resultsByValidOrganizationUnit?.length &&
      !appointmentsStack.length &&
      retryifEmptyCount <= maxRequestsNumber
    ) {
      retryifEmptyCount++;
      return await this.getAvailableSchedulesRecursive(
        integration,
        availableSchedules,
        organizationUnitEntity,
        retryifEmptyCount,
        appointmentsStack,
        validatedOrganizationUnits,
      );
    }

    const schedules: RawAppointment[] = [];

    for await (const matrixSchedule of resultsByValidOrganizationUnit) {
      for (const matrixTimeSchedule of matrixSchedule.horarios) {
        if (doctorsMap[matrixTimeSchedule.responsavel_id] && organizationUnitsMap[matrixTimeSchedule.unidade_id]) {
          const procedureId = filter?.procedure?.code
            ? this.matrixHelpersService.getCompositeProcedureCode(integration, filter?.procedure?.code).code
            : null;
          const schedule: RawAppointment = {
            appointmentTypeId: filter.appointmentType.code,
            procedureId,
            insuranceId: filter.insurance.code,
            appointmentCode: String(matrixTimeSchedule.horario_id),
            duration: '-1',
            appointmentDate: this.matrixHelpersService.convertDate(matrixTimeSchedule.dataHora),
            status: AppointmentStatus.scheduled,
            doctorId: String(matrixTimeSchedule.responsavel_id),
            organizationUnitId: String(matrixTimeSchedule.unidade_id || filter.organizationUnit.code),
            data: {
              sala_id: matrixTimeSchedule.sala_id,
              duracao: matrixTimeSchedule.duracao,
            },
          };
          schedules.push(schedule);
        }
      }
    }

    // filtrando por periodo do dia.
    const appointmentsFiltered = this.appointmentService.filterPeriodOfDay(
      integration,
      {
        limit: 500,
        period,
        periodOfDay,
        randomize: false,
        sortMethod: AppointmentSortMethod.default,
      },
      schedules,
    );

    appointmentsStack = [...appointmentsStack.concat(appointmentsFiltered)];

    let dayFilteredAppointments: RawAppointment[] = [];
    const filterScheduleBySameProcedure = integration?.rules?.doNotAllowSameDayAndProcedureScheduling ?? false;

    try {
      ({ replacedAppointments: dayFilteredAppointments, metadata } =
        await this.rulesHandlerService.removeSchedulesFilteredBySameDayRules(
          integration,
          availableSchedules,
          appointmentsStack,
          metadata,
          filterScheduleBySameProcedure,
          this.getMinifiedPatientSchedules.bind(this),
        ));
    } catch (error) {
      dayFilteredAppointments = [...appointmentsStack];
      console.error(error);
    }

    // se possuir menos horarios, faz uma nova busca.
    if (dayFilteredAppointments?.length < maxRangeResults && retryifEmptyCount <= maxRequestsNumber) {
      retryifEmptyCount++;
      return await this.getAvailableSchedulesRecursive(
        integration,
        availableSchedules,
        organizationUnitEntity,
        retryifEmptyCount,
        dayFilteredAppointments,
        validatedOrganizationUnits,
      );
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
        dayFilteredAppointments,
      );

    const validSchedules = await this.appointmentService.transformSchedules(integration, randomizedAppointments);
    return { schedules: validSchedules, metadata: { ...metadata, ...partialMetadata } };
  }

  private async getOrganizationUnitsByAvailableSchedulesIntelligent(
    integration: IntegrationDocument,
    payload: MatrixAvailableSchedules,
    filterOrganizarionUnit: OrganizationUnitEntityDocument[],
  ): Promise<Set<string>> {
    // deconstruindo o payload para não enviar o paciente_id, peso e altura (para cache)
    const { paciente_id, peso, altura, ...payloaNoPatientData } = payload;

    const results: MatrixAvailableSchedulesResponse['procedimentos'] = [];
    let cachedData = false;

    try {
      //Faz cache da busca inteligente, pois se não tem horario, ela fica onerosa.
      // o cache é baseado nos filtros de busca, excluindo as informações do paciente.
      const cachedSchedules = await this.matrixHelpersService.getAvailableSchedulesIntelligentCache(
        integration,
        payloaNoPatientData,
      );
      if (!cachedSchedules) {
        const schedulePromises = filterOrganizarionUnit.map(async (organizationUnit) => {
          const unitPayload = { ...payload, unidade_id: organizationUnit.code };
          return this.matrixApiService.listAvailableSchedules(integration, unitPayload, true);
        });

        const schedulesSmart = await Promise.all(schedulePromises);
        schedulesSmart.forEach((schedule) => results.push(...schedule));
      } else {
        results.push(...cachedSchedules);
        cachedData = true;
      }
    } catch (error) {}

    // obtem as unidades que foram validadas (que vieram na rota inteligente)
    const organizationUnitsValidated = new Set<string>([]);
    results.forEach((procedimento) => {
      procedimento.horarios.forEach((horario) => {
        organizationUnitsValidated.add(horario.unidade_id);
      });
    });

    try {
      if (results.length && !cachedData) {
        await this.matrixHelpersService.setAvailableSchedulesIntelligentCache(
          integration,
          payloaNoPatientData,
          results,
        );
      }
    } catch (error) {}

    return organizationUnitsValidated;
  }

  async getAvailableSchedules(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
  ): Promise<ListAvailableSchedulesResponse> {
    const { filter } = availableSchedules;

    let filterOrganizationUnit: OrganizationUnitEntityDocument[] = [];

    // Ou pega a empresa selecionada Ou pega todas as empresas disponíveis
    if (filter?.organizationUnit && filter?.organizationUnit?.code !== '-1') {
      filterOrganizationUnit = [filter.organizationUnit];
    } else {
      // Busca unidade pela API Matrix, com filtros, para melhorar eficiência
      const organizationUnitEntities = (await this.matrixEntitiesService.extractEntity(
        integration,
        EntityType.organizationUnit,
        filter,
        availableSchedules.patient,
        true,
        false,
      )) as OrganizationUnitEntityDocument[];

      if (organizationUnitEntities?.length) {
        filterOrganizationUnit = await this.entitiesService.getValidErpEntitiesByCode(
          integration._id,
          organizationUnitEntities.map((unit) => unit.code),
          EntityType.organizationUnit,
        );
      }
    }

    if (!filterOrganizationUnit?.length) {
      return { schedules: [], metadata: null };
    }

    // busca de horários recursivo para garantir diversidade de datas e horários.
    return await this.getAvailableSchedulesRecursive(integration, availableSchedules, filterOrganizationUnit);
  }

  async getScheduleValue(integration: IntegrationDocument, scheduleValue: GetScheduleValue): Promise<AppointmentValue> {
    const { insurance, procedure } = scheduleValue;
    const procedureData = this.matrixHelpersService.getCompositeProcedureCode(integration, procedure.code);

    const payload: MatrixProcedureDataRequest = {
      convenio_id: insurance.code,
      plano_id: insurance.planCode,
      procedimentos: [
        {
          codigoRegiaoColeta: '',
          procedimento_id: procedureData.code,
        },
      ],
    };

    // Lógica fixa para a tecnolab. Se for o convênio particular, lê de outra tabela de valores.
    if (insurance.code === 'PART') {
      payload.convenio_id = 'CARTEC';
      payload.plano_id = 'CARTEC';
    }

    // Lógica fixa para a tecnolab. Para teste em homologação
    if (insurance.code === 'PART' && castObjectIdToString(integration._id) === '65e62055dab10e90925eb704') {
      payload.convenio_id = 'VITAL';
      payload.plano_id = 'VITAL';
    }

    try {
      const response = await this.matrixApiService.getProcedureData(integration, payload);
      const procedureValue = response?.[0]?.procedimentos?.[0]?.preco;

      if (!procedureValue) {
        return null;
      }

      return {
        currency: 'R$',
        value: formatCurrency(procedureValue),
      };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('MatrixService.getScheduleValue', error);
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
      case EntityType.organizationUnit:
      case EntityType.organizationUnitLocation:
      case EntityType.insurance:
      case EntityType.insurancePlan:
      case EntityType.doctor:
      case EntityType.speciality:
      case EntityType.appointmentType:
      case EntityType.procedure:
      case EntityType.typeOfService:
        return await this.matrixEntitiesService.listValidApiEntities(
          integration,
          targetEntity,
          filters,
          patient,
          cache,
        );
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
    const { patientCode } = patientSchedules;
    const minifiedSchedules: MinifiedAppointments = {
      appointmentList: [],
      lastAppointment: null,
      nextAppointment: null,
    };

    try {
      const data: MatrixPatientSchedulesResponse['agendamentos'] = await this.listMatrixPatientSchedules(
        integration,
        patientSchedules,
      );

      if (!data?.length) {
        await this.integrationCacheUtilsService.setPatientSchedulesCache(integration, patientCode, {
          minifiedSchedules,
          schedules: [],
        });

        return minifiedSchedules;
      }

      const schedules: Appointment[] = await Promise.all(
        data?.map(async (matrixSchedule) => {
          const [schedule] = await this.appointmentService.transformSchedules(
            integration,
            [
              await this.matrixHelpersService.createPatientAppointmentObject(
                integration,
                matrixSchedule,
                patientSchedules,
              ),
            ],
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
            appointmentCode: String(matrixSchedule.consulta_id),
            appointmentDate: this.matrixHelpersService.convertDate(matrixSchedule.data_marcacao),
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
      throw INTERNAL_ERROR_THROWER('MatrixService.getMinifiedPatientSchedules', error);
    }
  }

  async getMultipleEntitiesByFilter(
    integration: IntegrationDocument,
    filter: CorrelationFilterByKey,
  ): Promise<CorrelationFilter> {
    return await this.entitiesService.createCorrelationFilterData(filter, 'code', integration._id);
  }

  public async matchFlowsConfirmation(
    integration: IntegrationDocument,
    data: MatchFlowsConfirmation,
  ): Promise<FlowAction<FlowActionElement>[]> {
    try {
      return await this.schedulesService.matchFlowsConfirmation(castObjectIdToString(integration._id), data);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('MatrixService.matchFlowsConfirmation', error);
    }
  }

  async getPatient(integration: IntegrationDocument, filters: PatientFilters): Promise<MatrixPatientV2> {
    try {
      const { cpf, code, cache } = filters;
      const patientCache = await this.integrationCacheUtilsService.getPatientFromCache(integration, code, cpf);

      if (patientCache && cache) {
        return patientCache as MatrixPatientV2;
      }

      await this.generateLoginToken(integration);
      const response = await this.matrixApiService.getMatrixPatientWithToken(integration, {
        document: cpf,
        documentType: 'CPF',
      });

      const matrixPatient: MatrixPatientResponseV2 = response?.[0];

      if (!matrixPatient) {
        throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
      }

      const patient = this.matrixHelpersService.replaceMatrixPatientToPatient(matrixPatient);
      await this.integrationCacheUtilsService.setPatientCache(integration, patient.code, patient.cpf, patient);

      return patient;
    } catch (error) {
      const msgError = error.response?.error?.erro;
      if (msgError?.includes('Não foi possível recuperar os dados do paciente.')) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.CONFLICT,
          'Validation failed: Multiple users with the same CPF',
          HttpErrorOrigin.INTEGRATION_ERROR,
          true,
        );
      }

      throw INTERNAL_ERROR_THROWER('MatrixService.getPatient', error);
    }
  }

  private async listMatrixPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<MatrixPatientSchedulesResponse['agendamentos']> {
    // Não trocar a posição do confirmado neste array. Se alterado, a lógica abaixo vai parar de funcionar
    const statusSchedule = ['confirmado', 'agendado'];
    const { patientCode } = patientSchedules;

    const promises = statusSchedule.map((status) =>
      this.matrixApiService.listPatientSchedules(integration, {
        paciente_id: patientCode,
        status,
      }),
    );

    const [confirmedSchedules, ...otherSchedules] = await Promise.all(promises);

    const processedConfirmedSchedules = confirmedSchedules.map((schedule) => ({
      ...schedule,
      status: 'Confirmado',
    }));

    return [...processedConfirmedSchedules, ...otherSchedules].flat() as MatrixPatientSchedulesResponse['agendamentos'];
  }

  async getPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<Appointment[]> {
    try {
      const data: MatrixPatientSchedulesResponse['agendamentos'] = await this.listMatrixPatientSchedules(
        integration,
        patientSchedules,
      );

      return await this.appointmentService.transformSchedules(
        integration,
        await Promise.all(
          data
            .filter((scheduleWithinDate) => {
              const scheduleDateConverted = this.matrixHelpersService.convertDate(scheduleWithinDate.data_marcacao);
              if (moment(scheduleDateConverted).valueOf() > moment().valueOf()) {
                return scheduleWithinDate;
              }
            })
            .map(
              async (schedule) =>
                await this.matrixHelpersService.createPatientAppointmentObject(integration, schedule, {
                  ...patientSchedules,
                  returnGuidance: true,
                }),
            ),
        ),
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('MatrixService.getPatientSchedules', error);
    }
  }

  async getStatus(integration: IntegrationDocument): Promise<OkResponse> {
    try {
      const organizationUnits = await this.matrixApiService.listOrganizationUnits(integration, true);

      if (organizationUnits?.length) {
        return { ok: true };
      }

      const insurances = await this.matrixApiService.listInsurances(integration, true);

      if (insurances?.length) {
        return { ok: true };
      }

      return { ok: false };
    } catch (error) {
      throw error;
    }
  }

  reschedule() {
    return null;
  }

  async updatePatient(
    integration: IntegrationDocument,
    patientCode: string,
    { patient }: UpdatePatient,
  ): Promise<Patient> {
    const payload: MatrixUpdatePatient = {
      paciente_id: patientCode,
      documento: patient.cpf,
      tipoDocumento: 'CPF',
      nome: patient.name,
      dataNascimento: patient.bornDate,
      sexo: patient.sex,
      email: patient.email ?? '',
    } as MatrixUpdatePatient;

    if (patient.phone) {
      const phone = formatPhone(patient.phone, true);
      payload.telefoneDDD = phone.slice(0, 2);
      payload.telefone = phone.slice(2, phone.length);
    }

    if (patient.cellPhone) {
      const cellPhone = formatPhone(patient.cellPhone, true);
      payload.celularDDD = cellPhone.slice(0, 2);
      payload.celular = cellPhone.slice(2, cellPhone.length);
    }

    try {
      await this.matrixApiService.updatePatient(integration, payload);

      const updatedPatient = await this.matrixApiService.getMatrixPatientWithToken(integration, {
        document: payload.documento,
        documentType: 'CPF',
      });

      const patient = this.matrixHelpersService.replaceMatrixPatientToPatient(updatedPatient?.[0]);

      await this.integrationCacheUtilsService.setPatientCache(integration, patient.code, patient.cpf, patient);

      return patient;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('MatrixIntegrationService.updatePatient', error);
    }
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

      const textsToMatchPlan: string[] = [...(response.insuranceSubPlan.name ?? [])];

      const entities = (await this.entitiesService.getEntitiesByTargetAndName(
        integration._id,
        EntityType.insurancePlan,
        textsToMatchPlan,
        undefined,
        { insuranceCode: insurance.code },
      )) as InsurancePlanEntityDocument[];

      if (entities.length) {
        data.insurancePlan = entities[0];
      }

      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async downloadDocument(integration: IntegrationDocument, data: DownloadDocumentData): Promise<Buffer> {
    if (data.type === 'guidance') {
      const patientSchedules: MatrixPatientSchedulesResponse['agendamentos'] = await this.listMatrixPatientSchedules(
        integration,
        { patientCode: data.patientCode },
      );

      const validPatientSchedules = [];

      if (data.scheduleCode) {
        validPatientSchedules.push(
          ...patientSchedules.filter((schedule) => schedule.consulta_id === data.scheduleCode),
        );
      } else {
        validPatientSchedules.push(...patientSchedules);
      }

      const procedureCodes = validPatientSchedules.map((matrixSchedule) => matrixSchedule.procedimento_id);
      return await this.matrixDownloadService.downloadGuidancePdf(procedureCodes ?? []);
    }

    return null;
  }

  async validateRecoverAccessProtocol(
    integration: IntegrationDocument,
    data: ValidatePatientRecoverAccessProtocol,
  ): Promise<{ ok: boolean }> {
    const { cpf, bornDate } = data;

    const patient = await this.getPatient(integration, { bornDate, cpf });
    await this.generateLoginToken(integration);
    return this.matrixRecoverPasswordService.validateRecoverPassword(data, patient);
  }

  async recoverAccessProtocol(
    integration: IntegrationDocument,
    data: RecoverAccessProtocol,
  ): Promise<RecoverAccessProtocolResponse> {
    const { cpf, bornDate } = data;

    const patient = await this.getPatient(integration, { bornDate, cpf });
    return await this.matrixRecoverPasswordService.recoverPassword(integration, data, patient);
  }

  public async listSchedulesToConfirm(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2,
  ): Promise<ConfirmationSchedule> {
    return await this.matrixConfirmationService.listSchedulesToConfirm(integration, data);
  }

  public async confirmationCancelSchedule(
    integration: IntegrationDocument,
    cancelSchedule: CancelScheduleV2,
  ): Promise<OkResponse> {
    return await this.matrixConfirmationService.cancelSchedule(integration, cancelSchedule);
  }

  public async confirmationConfirmSchedule(
    integration: IntegrationDocument,
    confirmSchedule: ConfirmScheduleV2,
  ): Promise<OkResponse> {
    return await this.matrixConfirmationService.confirmSchedule(integration, confirmSchedule);
  }

  async getConfirmationScheduleById(integration: IntegrationDocument, data: GetScheduleByIdData): Promise<Schedules> {
    return await this.matrixConfirmationService.getConfirmationScheduleById(integration, data);
  }

  public async getConfirmationScheduleGuidance(
    integration: IntegrationDocument,
    { scheduleCodes, scheduleIds }: ConfirmationScheduleGuidance,
  ): Promise<ConfirmationScheduleGuidanceResponse> {
    try {
      const schedules = await this.schedulesService.getGuidanceByScheduleCodes(integration, scheduleCodes, scheduleIds);
      for (const schedule of schedules) {
        const guidance = await this.matrixConfirmationService.getGuidance(integration, schedule);
        schedule.guidance = guidance?.replace?.(/\\n/g, '\n');
      }
      return schedules;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('MatrixService.getScheduleGuidance', error);
    }
  }
}
