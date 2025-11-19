import { Injectable } from '@nestjs/common';
import {
  FlowAction,
  FlowActionConfirmationRules,
  FlowActionElement,
  FlowActionType,
  FlowSteps,
  FlowTriggerType,
} from '../../../flow/interfaces/flow.interface';
import {
  CancelScheduleV2,
  ConfirmScheduleV2,
  ListSchedulesToConfirmV2,
  MatchFlowsConfirmation,
  ConfirmationScheduleGuidance,
  ConfirmationScheduleGuidanceResponse,
  ValidateScheduleConfirmation,
  ExtractType,
} from '../../../integrator/interfaces';
import { INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { FlowService } from '../../../flow/service/flow.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { removeHTMLTags } from '../../../../common/helpers/remove-html-tags';
import { NetpacsApiService } from './netpacs-api.service';
import {
  ConfirmationSchedule,
  ConfirmationScheduleDataV2,
  ConfirmationScheduleSchedule,
} from '../../../interfaces/confirmation-schedule.interface';
import { EntityType } from '../../../interfaces/entity.interface';
import {
  AttendanceResponse,
  AttendancesRequestParams,
  CancelAttendanceRequest,
  ConfirmationErpParams,
  UpdateAttendanceStatusRequest,
} from '../interfaces';
import * as moment from 'moment';
import { CorrelationFilterByKeys } from '../../../interfaces/correlation-filter.interface';
import { EntityDocument, ProcedureEntityDocument, SpecialityEntityDocument } from '../../../entities/schema';
import { NetpacsServiceHelpersService } from './netpacs-helpers.service';
import { EntitiesService } from '../../../entities/services/entities.service';
import { SchedulesService } from '../../../schedules/schedules.service';
import { ExtractedSchedule } from '../../../schedules/interfaces/extracted-schedule.interface';
import { groupBy } from 'lodash';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';
import { GetScheduleByIdData } from '../../../integrator/interfaces/get-schedule-by-id.interface';
import { Schedules } from '../../../schedules/entities/schedules.entity';

@Injectable()
export class NetpacsConfirmationService {
  constructor(
    private readonly netpacsApiService: NetpacsApiService,
    private readonly netpacsServiceHelpersService: NetpacsServiceHelpersService,
    private readonly entitiesService: EntitiesService,
    private readonly flowService: FlowService,
    private readonly schedulesService: SchedulesService,
  ) {}

  private async listSchedulesToConfirmData(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2,
  ): Promise<ExtractedSchedule[]> {
    const { startDate, endDate } = data;
    const erpParams: ConfirmationErpParams = data.erpParams as ConfirmationErpParams;

    // paginação é limitada a 100 nesta integração
    const requestFilters: AttendancesRequestParams = {
      dataInicial: moment(startDate).format('DD/MM/YYYY'),
      limit: 100,
      dataFinal: moment(endDate).format('DD/MM/YYYY'),
      page: 1,
    };

    const isNoShowRecover = erpParams?.EXTRACT_TYPE === ExtractType.recover_lost_schedule;

    if (erpParams?.listConfirmed) {
      requestFilters.listIdSituacao = [2, 3]; //Lista 'a confirmar' e 'confirmados'
    } else {
      requestFilters.idSituacao = 2; //Lista somente a confirmar
    }

    const schedules: AttendanceResponse[] = [];
    let response: AttendanceResponse[];
    let page = 1;

    do {
      if (!isNoShowRecover) {
        response = await this.netpacsApiService.getAttendances(integration, {
          ...requestFilters,
          page,
        });
      } else {
        response = await this.netpacsApiService.getLostAttendances(integration, {
          ...requestFilters,
          page,
        });
      }

      if (response?.length > 0) {
        response.forEach((schedule) => {
          const scheduleDate = this.netpacsServiceHelpersService.convertStartDate(schedule.data, schedule.horaInicial);

          // aplica filtro para manter o comportamento de filtros da rota
          if (
            moment(scheduleDate).valueOf() >= moment(startDate).valueOf() &&
            moment(scheduleDate).valueOf() <= moment(endDate).valueOf()
          ) {
            schedules.push(schedule);
          }
        });
      }
      page++;
    } while (response?.length >= requestFilters.limit);

    return await this.transformNetpacsSchedulesToExtractedSchedules(integration, schedules);
  }

  private async transformNetpacsSchedulesToExtractedSchedules(
    integration: IntegrationDocument,
    schedules: AttendanceResponse[],
  ): Promise<ExtractedSchedule[]> {
    const specialities = (await this.entitiesService.getAnyEntities(
      EntityType.speciality,
      integration._id,
    )) as SpecialityEntityDocument[];
    const specialitiesMap = specialities.reduce(
      (map, speciality) => {
        map[speciality.code] = speciality;
        return map;
      },
      {} as Record<string, SpecialityEntityDocument>,
    );

    return schedules?.map((netpacsSchedule) => ({
      doctorCode: String(netpacsSchedule.idMedicoExecutor),
      insuranceCode: String(netpacsSchedule.idConvenio),
      procedureCode: String(netpacsSchedule.idProcedimento),
      organizationUnitCode: String(netpacsSchedule.idUnidade),
      specialityCode: String(netpacsSchedule.idModalidade),
      appointmentTypeCode: specialitiesMap?.[netpacsSchedule.idModalidade]?.specialityType,
      scheduleCode: String(netpacsSchedule.idAtendimentoProcedimento),
      scheduleDate: this.netpacsServiceHelpersService.convertStartDate(
        netpacsSchedule.data,
        netpacsSchedule.horaInicial,
      ),
      patient: {
        email: netpacsSchedule.emailPaciente,
        code: String(netpacsSchedule.idPaciente),
        name: netpacsSchedule.nomePaciente,
        phones: [netpacsSchedule.telefoneCelularPaciente, netpacsSchedule.telefonePaciente].filter((phone) => phone),
        cpf: netpacsSchedule.cpf,
        bornDate: moment(netpacsSchedule.dataNascimento).format('YYYY-MM-DD'),
      },
    }));
  }

  async listSchedulesToConfirm(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2,
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

      const { organizationUnit, procedure, appointmentType, doctor, speciality } = scheduleCorrelation;
      const dateFormat = 'YYYY-MM-DDTHH:mm:ss';

      const scheduleObject: ConfirmationScheduleSchedule = {
        scheduleId: schedule.id,
        scheduleCode: String(schedule.scheduleCode),
        scheduleDate: moment(schedule.scheduleDate).format(dateFormat),
        organizationUnitAddress: (organizationUnit?.data as any)?.address,
        organizationUnitName: organizationUnit?.friendlyName,
        procedureName: procedure?.friendlyName || schedule.procedureName?.trim(),
        doctorName: doctor?.friendlyName || schedule.doctorName?.trim(),
        appointmentTypeName: appointmentType?.friendlyName || null,
        appointmentTypeCode: appointmentType?.code || null,
        specialityCode: speciality?.code || null,
        specialityName: speciality?.friendlyName || null,
        doctorCode: doctor?.code || schedule?.doctorCode,
        organizationUnitCode: organizationUnit?.code || schedule?.organizationUnitCode,
        procedureCode: procedure?.code || schedule?.procedureCode,
      };

      const { patientName, patientCode, patientPhone1, patientPhone2 } = schedule;
      const confirmationSchedule: ConfirmationScheduleDataV2 = {
        contact: {
          phone: [],
          email: [],
          name: patientName,
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

    if (debugPatientCode) {
      result.data = result.data?.filter((schedule) => debugPatientCode.includes(schedule.contact?.code));
    }

    if (debugScheduleCode) {
      result.data = result.data?.filter((schedule) => {
        if ('schedule' in schedule) {
          return debugScheduleCode.includes(schedule.schedule?.scheduleCode);
        }
        return false;
      });
    }

    if (debugLimit) {
      result.data = result.data?.slice(0, debugLimit);
    }

    return result;
  }

  private async getScheduleGuidanceWithGroupedProcedures(
    integration: IntegrationDocument,
    { scheduleIds }: ConfirmationScheduleGuidance,
  ) {
    const response: ConfirmationScheduleGuidanceResponse = [];

    for (const scheduleId of scheduleIds) {
      try {
        const [correlation, schedule] = await this.schedulesService.getEntitiesDataFromSchedule(
          castObjectIdToString(integration._id),
          null,
          scheduleId,
        );

        if (!schedule) {
          continue;
        }

        const { scheduleCode } = schedule;

        const netpacsSchedule = await this.netpacsApiService.getAttendance(integration, scheduleCode);
        if (!netpacsSchedule?.patId) {
          continue;
        }

        if (!schedule) {
          continue;
        }

        let procedureEntity: ProcedureEntityDocument;
        try {
          procedureEntity = (await this.entitiesService.getEntityByCode(
            schedule.procedureCode,
            EntityType.procedure,
            integration._id,
          )) as ProcedureEntityDocument;
        } catch (e) {}

        const scheduleGuidance = {
          scheduleCode: schedule.scheduleCode,
          guidance: schedule.guidance,
          appointmentTypeName: schedule.appointmentTypeName,
          doctorName: schedule.doctorName,
          insuranceCategoryName: schedule.insuranceCategoryName,
          insuranceName: schedule.insuranceName,
          organizationUnitAddress: schedule.organizationUnitAddress,
          patientName: schedule.patientName,
          procedureName: procedureEntity?.friendlyName || schedule.procedureName,
          specialityName: schedule.specialityName,
          typeOfServiceName: schedule.typeOfServiceName,
          organizationUnitName: schedule.organizationUnitName,
        };

        const flows = await this.flowService.matchFlowsAndGetActions({
          integrationId: integration._id,
          entitiesFilter: correlation,
          targetFlowTypes: [FlowSteps.confirmActive],
          trigger: FlowTriggerType.active_confirmation_confirm,
        });

        if (flows.length) {
          const confirmationRules: FlowAction<FlowActionConfirmationRules> = flows.find(
            (flow) => flow.type === FlowActionType.rulesConfirmation,
          ) as FlowAction<FlowActionConfirmationRules>;

          if (confirmationRules?.element?.guidance) {
            scheduleGuidance.guidance = confirmationRules.element.guidance;
          }
        }

        if (scheduleGuidance.guidance) {
          response.push(scheduleGuidance);
          continue;
        }

        const patientId = netpacsSchedule.patId;
        const schedules = await this.netpacsApiService.getAttendances(integration, {
          dataInicial: moment().format('DD/MM/YYYY'),
          limit: 100,
          dataFinal: moment().add('2', 'weeks').format('DD/MM/YYYY'),
          page: 1,
          listPatId: patientId,
        });

        const procedureCodes: { [scheduleCode: string]: number[] } = {};
        const groupedSchedules = groupBy(schedules, 'idAtendimento');

        Object.entries(groupedSchedules).forEach(([scheduleCode, schedules]) => {
          schedules.forEach((schedule) => {
            if (!procedureCodes[scheduleCode]) {
              procedureCodes[scheduleCode] = [];
            }

            if (!schedule.idAtendimentoProcedimentoPai) {
              procedureCodes[scheduleCode].unshift(schedule.idProcedimento);
            } else {
              procedureCodes[scheduleCode].push(schedule.idProcedimento);
            }
          });
        });

        for (const [_, codes] of Object.entries(procedureCodes)) {
          let orientation = '';

          for (const [index, procedureCode] of codes.entries()) {
            const procedure = await this.netpacsApiService.getProcedure(integration, procedureCode);

            if (procedure?.orientacao) {
              orientation += removeHTMLTags(procedure.orientacao);
            }

            if (orientation && index + 1 !== codes.length) {
              orientation += '\n';
            }
          }

          response.push({ ...scheduleGuidance, guidance: orientation });
        }
      } catch (error) {
        console.error(error);
      }
    }

    return response;
  }

  public async getScheduleGuidance(
    integration: IntegrationDocument,
    data: ConfirmationScheduleGuidance,
  ): Promise<ConfirmationScheduleGuidanceResponse> {
    const { scheduleIds } = data;
    // fixo para ortoimagem
    if (castObjectIdToString(integration._id) === '649c91dd96a5810008d868de') {
      return await this.getScheduleGuidanceWithGroupedProcedures(integration, data);
    }

    const response: ConfirmationScheduleGuidanceResponse = [];

    for (const scheduleId of scheduleIds) {
      try {
        const [correlation, schedule] = await this.schedulesService.getEntitiesDataFromSchedule(
          castObjectIdToString(integration._id),
          null,
          scheduleId,
        );

        if (!schedule) {
          continue;
        }

        let procedureEntity: ProcedureEntityDocument;
        try {
          procedureEntity = (await this.entitiesService.getEntityByCode(
            schedule.procedureCode,
            EntityType.procedure,
            integration._id,
          )) as ProcedureEntityDocument;
        } catch (e) {}

        const scheduleGuidance = {
          scheduleCode: schedule.scheduleCode,
          guidance: schedule.guidance,
          appointmentTypeName: schedule.appointmentTypeName,
          doctorName: schedule.doctorName,
          insuranceCategoryName: schedule.insuranceCategoryName,
          insuranceName: schedule.insuranceName,
          organizationUnitAddress: schedule.organizationUnitAddress,
          patientName: schedule.patientName,
          procedureName: procedureEntity?.friendlyName || schedule.procedureName,
          specialityName: schedule.specialityName,
          typeOfServiceName: schedule.typeOfServiceName,
          organizationUnitName: schedule.organizationUnitName,
        };

        const flows = await this.flowService.matchFlowsAndGetActions({
          integrationId: integration._id,
          entitiesFilter: correlation,
          targetFlowTypes: [FlowSteps.confirmActive],
          trigger: FlowTriggerType.active_confirmation_confirm,
        });

        if (flows.length) {
          const confirmationRules: FlowAction<FlowActionConfirmationRules> = flows.find(
            (flow) => flow.type === FlowActionType.rulesConfirmation,
          ) as FlowAction<FlowActionConfirmationRules>;

          if (confirmationRules?.element?.guidance) {
            scheduleGuidance.guidance = confirmationRules.element.guidance;
          }
        }

        if (scheduleGuidance.guidance) {
          response.push(scheduleGuidance);
          continue;
        }

        const procedure = await this.netpacsApiService.getProcedure(integration, Number(schedule.procedureCode));

        if (procedure.orientacao) {
          scheduleGuidance.guidance = removeHTMLTags(procedure.orientacao);
        }

        response.push(scheduleGuidance);
      } catch (error) {
        console.error(error);
      }
    }

    return response;
  }

  public async matchFlowsConfirmation(
    integration: IntegrationDocument,
    data: MatchFlowsConfirmation,
  ): Promise<FlowAction<FlowActionElement>[]> {
    try {
      return await this.schedulesService.matchFlowsConfirmation(castObjectIdToString(integration._id), data);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('NetpacsConfirmationService.matchFlowsConfirmation', error);
    }
  }

  public async cancelSchedule(
    integration: IntegrationDocument,
    { scheduleCode, scheduleId, erpParams }: CancelScheduleV2<ConfirmationErpParams>,
  ): Promise<OkResponse> {
    const schedule = await this.schedulesService.checkCanCancelScheduleAndReturn(
      castObjectIdToString(integration._id),
      scheduleCode,
      scheduleId,
    );

    try {
      const idMotivoSituacao = erpParams?.idMotivoSituacao || 1;
      const payload: CancelAttendanceRequest = {
        idMotivoSituacao,
      };
      await this.netpacsApiService.cancelAttendance(integration, schedule.scheduleCode, payload);
      await this.schedulesService.buildCancelSchedule(integration, schedule.scheduleCode, scheduleId);

      return { ok: true };
    } catch (error) {
      console.error(error);
      throw INTERNAL_ERROR_THROWER('NetpacsConfirmationService.cancelSchedule', error);
    }
  }

  public async confirmSchedule(
    integration: IntegrationDocument,
    { scheduleCode, scheduleId }: ConfirmScheduleV2,
  ): Promise<OkResponse> {
    const schedule = await this.schedulesService.checkCanConfirmScheduleAndReturn(
      castObjectIdToString(integration._id),
      scheduleCode,
      scheduleId,
    );

    const payload: UpdateAttendanceStatusRequest = { idSituacao: 3 };

    try {
      await this.netpacsApiService.updateAttendanceStatus(integration, schedule.scheduleCode, payload);
    } catch (error) {
      const isAlreadyConfirmed =
        error?.response?.error?.message?.includes('O Atendimento já se encontra na situação que deseja alterar.') ||
        error?.response?.error?.message?.includes(
          'encontra-se na situação de Cancelado. A situação não pode ser alterada.',
        ) ||
        error?.response?.error?.message?.includes(
          'A situação não pode ser alterada, pois existe uma regra de atendimento',
        );

      if (!isAlreadyConfirmed) {
        console.error(error);
        throw INTERNAL_ERROR_THROWER('NetpacsConfirmationService.confirmSchedule', error);
      }
    }

    await this.schedulesService.buildConfirmSchedule(integration, schedule.scheduleCode, scheduleId);
    return { ok: true };
  }

  async getSchedule(integration: IntegrationDocument, scheduleCode: string): Promise<ExtractedSchedule[]> {
    const netpacsAttendace = await this.netpacsApiService.getAttendance(integration, scheduleCode);
    return await this.transformNetpacsSchedulesToExtractedSchedules(integration, [netpacsAttendace]);
  }

  public async validateScheduleData(
    integration: IntegrationDocument,
    { scheduleCode, scheduleId }: ValidateScheduleConfirmation,
  ): Promise<OkResponse> {
    try {
      const result = await this.schedulesService.validateScheduleData(
        integration,
        scheduleCode,
        scheduleId,
        this.getSchedule.bind(this),
      );

      return { ok: result };
    } catch (error) {
      console.error(error);
      throw INTERNAL_ERROR_THROWER('NetpacsConfirmationService.validateScheduleData', error);
    }
  }

  async getConfirmationScheduleById(integration: IntegrationDocument, data: GetScheduleByIdData): Promise<Schedules> {
    try {
      return await this.schedulesService.getScheduleByCodeOrId(
        castObjectIdToString(integration._id),
        null,
        data.scheduleId,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('NetpacsConfirmationService.getConfirmationScheduleById', error);
    }
  }
}
