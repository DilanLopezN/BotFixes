import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { ClinuxApiService } from './clinux-api.service';
import { ClinuxHelpersService } from './clinux-helpers.service';
import { FlowService } from '../../../flow/service/flow.service';
import { EntitiesService } from '../../../entities/services/entities.service';
import { SchedulesService } from '../../../schedules/schedules.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import {
  CancelScheduleV2,
  ConfirmationScheduleGuidance,
  ConfirmationScheduleGuidanceResponse,
  ConfirmScheduleV2,
  ListSchedulesToConfirmV2,
  MatchFlowsConfirmation,
} from '../../../integrator/interfaces';
import {
  FlowAction,
  FlowActionConfirmationRules,
  FlowActionElement,
  FlowActionType,
  FlowSteps,
  FlowTriggerType,
} from '../../../flow/interfaces/flow.interface';
import { INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import {
  ConfirmationSchedule,
  ConfirmationScheduleDataV2,
  ConfirmationScheduleSchedule,
} from '../../../interfaces/confirmation-schedule.interface';
import { CorrelationFilterByKeys } from '../../../interfaces/correlation-filter.interface';
import { EntityType } from '../../../interfaces/entity.interface';
import { DoctorEntityDocument, EntityDocument, ProcedureEntityDocument } from '../../../entities/schema';
import * as moment from 'moment';
import { ExtractedSchedule } from '../../../schedules/interfaces/extracted-schedule.interface';
import { ClinuxListSchedulesParamsRequest, ClinuxSchedule } from '../interfaces/appointment.interface';
import { ClinuxGetPatientResponse } from '../interfaces/patient.interface';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import {
  ClinuxCancelScheduleParamsRequest,
  ClinuxConfirmScheduleParamsRequest,
} from '../interfaces/schedule.interface';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { SchedulingLinksService } from '../../../scheduling/services/scheduling-links.service';
import { ClinuxListConfirmationErpParams } from '../interfaces/list-confirmation-erp-params.interface';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';
import { ClinuxApiV2Service } from './clinux-api-v2.service';

@Injectable()
export class ClinuxConfirmationService {
  private logger = new Logger(ClinuxConfirmationService.name);

  constructor(
    private readonly apiService: ClinuxApiService,
    private readonly apiV2Service: ClinuxApiV2Service,
    private readonly helperService: ClinuxHelpersService,
    private readonly flowService: FlowService,
    private readonly entitiesService: EntitiesService,
    private readonly schedulesService: SchedulesService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
    private readonly schedulingLinksService: SchedulingLinksService,
  ) {}

  public async matchFlowsConfirmation(
    integration: IntegrationDocument,
    data: MatchFlowsConfirmation,
  ): Promise<FlowAction<FlowActionElement>[]> {
    try {
      return await this.schedulesService.matchFlowsConfirmation(castObjectIdToString(integration._id), data);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinuxConfirmationService.matchFlowsConfirmation', error);
    }
  }

  public async cancelSchedule(
    integration: IntegrationDocument,
    { scheduleCode, scheduleId }: CancelScheduleV2,
  ): Promise<OkResponse> {
    const schedule = await this.schedulesService.checkCanCancelScheduleAndReturn(
      castObjectIdToString(integration._id),
      scheduleCode,
      scheduleId,
    );

    try {
      const payload: ClinuxCancelScheduleParamsRequest = {
        cd_atendimento: Number(schedule.scheduleCode),
        cd_paciente: Number(schedule.patientCode),
      };
      const response = await this.apiService.cancelSchedule(integration, payload);

      if (response?.[0]?.cd_atendimento) {
        await this.schedulesService.buildCancelSchedule(integration, schedule.scheduleCode, scheduleId);
        return { ok: true };
      }

      return { ok: false };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinuxConfirmationService.cancelSchedule', error);
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

    try {
      const payload: ClinuxConfirmScheduleParamsRequest = {
        cd_atendimento: Number(schedule.scheduleCode),
        cd_paciente: Number(schedule.patientCode),
      };
      const response = await this.apiService.confirmSchedule(integration, payload);

      if (response?.[0].cd_atendimento) {
        await this.schedulesService.buildConfirmSchedule(integration, schedule.scheduleCode, scheduleId);
        return { ok: true };
      }

      return { ok: false };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinuxConfirmationService.confirmSchedule', error);
    }
  }

  private async listSchedulesToConfirmData(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2<ClinuxListConfirmationErpParams>,
  ): Promise<ExtractedSchedule[]> {
    const { startDate, endDate, erpParams } = data;

    let response: ClinuxSchedule[];
    if (data.erpParams.useApiV2) {
      const dateFormat = 'DD/MM/YYYY';
      const requestFilters: ClinuxListSchedulesParamsRequest = {
        dt_de: moment(startDate).format(dateFormat),
        dt_ate: moment(endDate).format(dateFormat),
      };
      response = await this.apiV2Service.listSchedules(integration, requestFilters);
    } else {
      const dateFormat = 'DD-MM-YYYY';
      const requestFilters: ClinuxListSchedulesParamsRequest = {
        dt_de: moment(startDate).format(dateFormat),
        dt_ate: moment(endDate).format(dateFormat),
      };
      response = await this.apiService.listSchedules(integration, requestFilters);
    }

    if (erpParams?.omitSalaCodeList?.length) {
      response = response.filter((clinuxSchedule) => {
        //Retorna todos que não estão na lista passada pelo erpParams
        return !erpParams?.omitSalaCodeList?.includes?.(clinuxSchedule.cd_sala);
      });
    }
    if (erpParams?.omitAvisoCodeList?.length) {
      response = response.filter((clinuxSchedule) => {
        //Retorna todos que não estão na lista passada pelo erpParams
        return !erpParams?.omitAvisoCodeList?.includes?.(clinuxSchedule.cd_aviso);
      });
    }
    if (erpParams?.filterSalaCodeList?.length) {
      response = response.filter((clinuxSchedule) => {
        //Retorna todos que estão na lista passada pelo erpParams
        return !!erpParams?.filterSalaCodeList?.includes?.(clinuxSchedule.cd_sala);
      });
    }
    if (erpParams?.filterDsModalidadeList?.length) {
      const filterList = erpParams.filterDsModalidadeList.map((item) => item?.toLowerCase?.());

      response = response.filter((clinuxSchedule) => {
        return filterList.includes(clinuxSchedule?.ds_modalidade?.toLowerCase?.());
      });
    }
    return await this.transformClinuxSchedulesToExtractedSchedules(integration, response ?? [], data);
  }

  private async transformClinuxSchedulesToExtractedSchedules(
    integration: IntegrationDocument,
    schedules: ClinuxSchedule[],
    data: ListSchedulesToConfirmV2<ClinuxListConfirmationErpParams>,
  ): Promise<ExtractedSchedule[]> {
    const procedures = (await this.entitiesService.getAnyEntities(
      EntityType.procedure,
      integration._id,
    )) as ProcedureEntityDocument[];

    const doctors = (await this.entitiesService.getAnyEntities(
      EntityType.doctor,
      integration._id,
    )) as DoctorEntityDocument[];

    const patientIds = new Set<string>();
    const extractedSchedules: ExtractedSchedule[] = [];

    for (const clinuxSchedule of schedules) {
      patientIds.add(String(clinuxSchedule.cd_paciente));

      await this.integrationCacheUtilsService.setPatientSchedulesToConfirmCache(
        integration,
        String(clinuxSchedule.cd_atendimento),
        String(clinuxSchedule.cd_paciente),
        clinuxSchedule,
      );

      const findedDoctor = doctors.find((doctor) => doctor.name === String(clinuxSchedule.ds_medico));
      const doctorCode = data?.erpParams?.omitDoctorName ? null : findedDoctor ? findedDoctor.code : null;

      const cdProcedimento = clinuxSchedule.cd_procedimento;
      // procedimentos separados por virgula ou ponto e virgula
      const proceduresCodes = this.helperService.getClinuxProceduresCodes(cdProcedimento);

      // codigo pode vir mais de um código de procedimento
      for (const procedureCode of proceduresCodes) {
        const procudureDataFound = procedures.find((procedure) => procedure.code === String(procedureCode));

        const hasScheduleInExtractedSchedules = extractedSchedules.some(
          (schedule) =>
            schedule.scheduleCode === String(clinuxSchedule.cd_atendimento) &&
            schedule.procedureCode === String(procedureCode),
        );

        if (!hasScheduleInExtractedSchedules) {
          const appointmentTypeCode = data?.erpParams?.useAllSchedulesAsExam
            ? 'E'
            : (procudureDataFound?.specialityType ?? null);

          const procedureName = data?.erpParams?.useSpecialityAsProcedureName ? clinuxSchedule.ds_modalidade : null;
          const extractedSchedule: ExtractedSchedule = {
            doctorCode,
            insuranceCode: null,
            procedureCode,
            procedureName,
            specialityName: clinuxSchedule.ds_modalidade,
            organizationUnitCode: String(clinuxSchedule?.cd_empresa),
            specialityCode: procudureDataFound?.specialityCode ?? null,
            appointmentTypeCode,
            scheduleCode: String(clinuxSchedule.cd_atendimento),
            scheduleDate: clinuxSchedule.dt_data,
            patient: {
              code: String(clinuxSchedule.cd_paciente),
              name: clinuxSchedule.ds_paciente,
              phones: null,
              cpf: null,
              bornDate: null,
            },
          };

          extractedSchedules.push(extractedSchedule);
        }
      }
    }

    const patientsMap: { [doctorCode: string]: ClinuxGetPatientResponse } = {};

    await Promise.all(
      Array.from(patientIds).map((patientId) =>
        this.apiService.getPatient(integration, { cd_paciente: patientId }).then((response) => {
          if (response[0]?.cd_paciente) {
            patientsMap[patientId] = response[0];
          }
        }),
      ),
    );

    return extractedSchedules
      .filter((extractedSchedule) => !!patientsMap[extractedSchedule?.patient?.code])
      .map((extractedSchedule) => {
        const patient = this.helperService.replaceClinuxPatientToPatient(patientsMap[extractedSchedule.patient.code]);

        return {
          ...extractedSchedule,
          patient: {
            email: patient.email,
            code: patient.code,
            name: patient.name,
            phones: [patient.cellPhone || patient.phone],
            cpf: patient.cpf,
            bornDate: patient.bornDate,
          },
        };
      });
  }

  async listSchedulesToConfirm(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2,
  ): Promise<ConfirmationSchedule> {
    try {
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

      if (!schedules.length) {
        return result;
      }

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
          scheduleCode: schedule.scheduleCode,
          scheduleDate: moment(schedule.scheduleDate).format(dateFormat),
          organizationUnitAddress: (organizationUnit?.data as any)?.address || schedule.organizationUnitAddress,
          organizationUnitName: organizationUnit?.friendlyName || schedule.organizationUnitName,
          procedureName: procedure?.friendlyName || schedule.procedureName?.trim(),
          specialityName: speciality?.friendlyName || schedule.specialityName?.trim(),
          doctorName: doctor?.friendlyName || schedule.doctorName?.trim(),
          appointmentTypeName: appointmentType?.friendlyName || schedule.appointmentTypeName,
          guidance: schedule.guidance,
          observation: schedule.observation,
          appointmentTypeCode: schedule.appointmentTypeCode,
          doctorCode: doctor?.code || schedule?.doctorCode,
          organizationUnitCode: organizationUnit?.code || schedule?.organizationUnitCode,
          procedureCode: procedure?.code || schedule?.procedureCode,
          specialityCode: speciality?.code || schedule.specialityCode,
        };

        const { patientName, patientCode, patientPhone1, patientPhone2 } = schedule;
        const confirmationSchedule: ConfirmationScheduleDataV2 = {
          contact: {
            phone: [],
            email: [],
            name: patientName?.trim(),
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
            filters: {
              patientBornDate: schedule.patientBornDate,
              patientCpf: schedule.patientCpf,
            },
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
    } catch (error) {
      this.logger.error(error);
      throw INTERNAL_ERROR_THROWER('ClinuxConfirmationService.listSchedulesToConfirm', error);
    }
  }

  public async getScheduleGuidance(
    integration: IntegrationDocument,
    data: ConfirmationScheduleGuidance,
  ): Promise<ConfirmationScheduleGuidanceResponse> {
    const { scheduleIds } = data;

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

        let clinuxSchedule = await this.integrationCacheUtilsService.getPatientSchedulesToConfirmCache(
          integration,
          schedule.scheduleCode,
          schedule.patientCode,
        );

        // se não tiver cache, pega na API
        if (!clinuxSchedule) {
          clinuxSchedule = (
            await this.apiService.listPatientSchedules(integration, { cd_paciente: Number(schedule.patientCode) })
          ).find((apiSchedule) => apiSchedule.cd_atendimento === Number(schedule.scheduleCode));

          // se não encontrado, não existe agendamento ou ja foi confirmado.
          if (!clinuxSchedule) {
            continue;
          }
        }

        const cdProcedimento = clinuxSchedule.cd_procedimento;
        // procedimentos separados por virgula ou ponto e virgula
        const proceduresCodes: string[] = this.helperService.getClinuxProceduresCodes(cdProcedimento);

        // codigo pode vir mais de um código de procedimento
        for (const procedureCode of proceduresCodes) {
          let procedureEntity: ProcedureEntityDocument;
          try {
            procedureEntity = (await this.entitiesService.getEntityByCode(
              procedureCode,
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
            guidanceLink: null,
          };

          const flows = await this.flowService.matchFlowsAndGetActions({
            integrationId: integration._id,
            entitiesFilter: correlation,
            targetFlowTypes: [FlowSteps.confirmActive],
            filters: {
              patientBornDate: schedule.patientBornDate,
              patientCpf: schedule.patientCpf,
            },
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

          const procedureGuidance = await this.apiService.getProcedureGuidance(integration, {
            cd_procedimento: Number(procedureCode),
          });

          if (procedureGuidance[0]?.bb_preparo) {
            try {
              scheduleGuidance.guidance = this.helperService.sanitizeGuidanceText(procedureGuidance[0].bb_preparo);
            } catch (error) {
              const integrationId = castObjectIdToString(integration._id);
              Sentry.captureEvent({
                message: `ERROR:CLINUX:${integrationId}:getScheduleGuidance:sanitizeGuidanceText`,
                extra: {
                  integrationId,
                  error,
                },
              });
            }
          }

          const { scheduleResumeLink } =
            await this.schedulingLinksService.createSchedulingLinkGroupedByPatientErpCodeAndScheduleCode(integration, {
              integrationId: castObjectIdToString(integration._id),
              patientErpCode: schedule.patientCode,
              patientCpf: schedule.patientCpf,
              scheduleCode: schedule.scheduleCode,
              link: `resume/${schedule.scheduleCode}`,
            });

          scheduleGuidance.guidanceLink = scheduleResumeLink?.shortLink || null;

          response.push(scheduleGuidance);
        }
      } catch (error) {
        console.error(error);
      }
    }

    return response;
  }
}
