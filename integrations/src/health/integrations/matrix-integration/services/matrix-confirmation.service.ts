import { Injectable, Logger } from '@nestjs/common';
import * as moment from 'moment';
import { INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { EntityDocument, SpecialityEntityDocument } from '../../../entities/schema';
import { EntitiesService } from '../../../entities/services/entities.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { CancelScheduleV2, ConfirmScheduleV2 } from '../../../integrator/interfaces';
import {
  ExtractType,
  ListSchedulesToConfirmV2,
} from '../../../integrator/interfaces/list-schedules-to-confirm.interface';
import {
  ConfirmationSchedule,
  ConfirmationScheduleDataV2,
  ConfirmationScheduleSchedule,
} from '../../../interfaces/confirmation-schedule.interface';
import { CorrelationFilterByKeys } from '../../../interfaces/correlation-filter.interface';
import { EntityType } from '../../../interfaces/entity.interface';
import { ExtractedSchedule } from '../../../schedules/interfaces/extracted-schedule.interface';
import { SchedulesService } from '../../../schedules/schedules.service';
import { GetScheduleByIdData } from '../../../integrator/interfaces/get-schedule-by-id.interface';
import { Schedules } from '../../../schedules/entities/schedules.entity';
import { MatrixApiService } from './matrix-api.service';
import { MatrixHelpersService } from './matrix-helpers.service';
import { MatriListSchedulesDatailedResponse, MatrixListSchedules } from '../interfaces/patient.interface';
import {
  MatrixConfirmationErpParams,
  MatrixConfirmationStatus,
} from '../interfaces/matrix-confirmation-erp-params.interface';
import { MatrixListSchedulesCachedService } from './matrix-list-schedules-cached.service';
import * as Sentry from '@sentry/node';
import { MatrixGuidanceTecnolab } from './matrix-guidances';
import { SchedulingLinksService } from '../../../scheduling/services/scheduling-links.service';

@Injectable()
export class MatrixConfirmationService {
  private logger = new Logger(MatrixConfirmationService.name);

  constructor(
    private readonly matrixApiService: MatrixApiService,
    private readonly matrixHelpersService: MatrixHelpersService,
    private readonly entitiesService: EntitiesService,
    private readonly schedulesService: SchedulesService,
    private readonly schedulingLinksService: SchedulingLinksService,
    private readonly matrixListSchedulesCachedService: MatrixListSchedulesCachedService,
  ) {}

  // links de vídeo orientação hardcoded - vao evoluir para outra área posteriormente
  private specialitiesGuidance: { [code: string]: string } = {
    '5': 'link para cardiologia', // TESTE
    //'15': MatrixGuidanceTecnolab.specialitiesGuidance['15'], //'https://botdesigner-workspace-production.s3.sa-east-1.amazonaws.com/tecnolab-preparos/Ressonancia+Magn%C3%A9tica+%28ok%29.mp4', // RM. RESSONANCIA MAGNETICA
  };

  private proceduresGuidance: { [code: string]: string } = {
    MAMODI: 'link para mamografia', // TESTE
    COLONOS: MatrixGuidanceTecnolab.proceduresGuidance.COLONOS, //'https://botdesigner-workspace-production.s3.sa-east-1.amazonaws.com/tecnolab-preparos/Colonoscopia.mp4', // COLONOSCOPIA
    EDA: MatrixGuidanceTecnolab.proceduresGuidance.EDA, //'https://botdesigner-workspace-production.s3.sa-east-1.amazonaws.com/tecnolab-preparos/Endoscopia.mp4', // ENDOSCOPIA
    COLONOS_EDA: MatrixGuidanceTecnolab.proceduresGuidance.COLONOS_EDA, //'https://botdesigner-workspace-production.s3.sa-east-1.amazonaws.com/tecnolab-preparos/Endoscopia.mp4', //TODO COLONOSCOPIA com ENDOSCOPIA
    PETSCAN: MatrixGuidanceTecnolab.proceduresGuidance.PETSCAN,
  };

  private async listSchedulesToConfirmData(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2<MatrixConfirmationErpParams>,
  ): Promise<ExtractedSchedule[]> {
    const { startDate, endDate, erpParams } = data;
    const dateFormat = 'YYYY-MM-DDTHH:mm:ss';

    let statusSchedule = erpParams?.filterStatus;
    if (!statusSchedule?.length) {
      const isNoShowRecover = erpParams?.EXTRACT_TYPE === ExtractType.recover_lost_schedule;
      statusSchedule = isNoShowRecover
        ? [MatrixConfirmationStatus.cancelado]
        : [MatrixConfirmationStatus.confirmado, MatrixConfirmationStatus.agendado];
    }

    let allSchedules: MatriListSchedulesDatailedResponse['agendamentosDetalhados'] = [];

    for (const status of statusSchedule) {
      try {
        const payload: MatrixListSchedules = {
          data_marcacao_inicial: moment(startDate).format(dateFormat),
          data_marcacao_final: moment(endDate).format(dateFormat),
          status,
        };

        const schedules = await this.matrixListSchedulesCachedService.listSchedules(integration, payload);

        if (schedules.length !== 0) {
          allSchedules.push(...schedules);
        }
      } catch (error) {
        this.logger.error(error);
        throw INTERNAL_ERROR_THROWER(
          'MatrixConfirmationService.listSchedulesToConfirm.listSchedulesToConfirmData',
          error,
        );
      }
    }

    if (erpParams?.filterOnlyWithVideoGuidanceLink) {
      allSchedules = allSchedules.filter((schedule) => {
        return this.proceduresGuidance[schedule.procedimento_id] || this.specialitiesGuidance[schedule.setor_id];
      });
    }

    if (erpParams?.specialityCodesFilter?.length) {
      allSchedules = allSchedules.filter((schedule) => erpParams?.specialityCodesFilter.includes(schedule.setor_id));
    }

    if (erpParams?.procedureCodesFilter?.length) {
      allSchedules = allSchedules.filter((schedule) =>
        erpParams?.procedureCodesFilter.includes(schedule.procedimento_id),
      );
    }

    if (erpParams?.doctorCodesFilter?.length) {
      allSchedules = allSchedules.filter((schedule) => erpParams?.doctorCodesFilter.includes(schedule.responsavel_id));
    }

    if (erpParams?.sameDayProcedureFilter?.length) {
      const patientDaySchedulesMap: { [patientId_date: string]: any[] } = {};

      for (const schedule of allSchedules) {
        const scheduleDate = moment(schedule.data_marcacao).format('YYYY-MM-DD');
        const patientId = schedule.paciente_id;
        const key = `${patientId}_${scheduleDate}`;

        if (!patientDaySchedulesMap[key]) {
          patientDaySchedulesMap[key] = [];
        }
        patientDaySchedulesMap[key].push(schedule);
      }

      const filteredSchedules = [];

      for (const schedule of allSchedules) {
        const scheduleDate = moment(schedule.data_marcacao).format('YYYY-MM-DD');
        const patientId = schedule.paciente_id;
        const key = `${patientId}_${scheduleDate}`;
        const sameDaySchedules = patientDaySchedulesMap[key] || [];

        const hasFilteredProcedure = sameDaySchedules.some((sameDaySchedule) =>
          erpParams.sameDayProcedureFilter.includes(sameDaySchedule.procedimento_id),
        );

        if (hasFilteredProcedure) {
          filteredSchedules.push(schedule);
        }
      }

      allSchedules = filteredSchedules;
    }

    return await this.transformMatrixSchedulesToExtractedSchedules(integration, allSchedules, data);
  }

  private async transformMatrixSchedulesToExtractedSchedules(
    integration: IntegrationDocument,
    schedules: MatriListSchedulesDatailedResponse['agendamentosDetalhados'],
    data: ListSchedulesToConfirmV2,
  ): Promise<ExtractedSchedule[]> {
    try {
      const batchSize = 150;

      // utilizado batching em lotes para evitar sobrecarga de memória
      // processamento em lotes permite o garbage collector do Node.js libere memória entre os ciclos
      // o retorno da API Matrix costuma ser muito grande
      const allBatches: Array<Promise<ExtractedSchedule[]>> = [];

      for (let i = 0; i < schedules.length; i += batchSize) {
        const batch = schedules.slice(i, i + batchSize);

        // Processa cada item do lote em paralelo
        const batchResults = Promise.all(
          batch.map(async (matrixSchedule) => {
            const { consulta_id, paciente_id, codigo_pre_pedido } = matrixSchedule;

            const extractedSchedule: ExtractedSchedule = {
              procedureCode: this.matrixHelpersService.createCompositeProcedureCode(
                integration,
                String(matrixSchedule.procedimento_id),
                String(matrixSchedule.setor_id),
                null,
                null,
              ),
              procedureName: matrixSchedule?.procedimento_nome,
              doctorCode: matrixSchedule?.responsavel_id,
              doctorName: null,
              insuranceCode: null,
              insuranceName: null,
              insurancePlanCode: null,
              insurancePlanName: null,
              specialityCode: matrixSchedule?.setor_id,
              specialityName: matrixSchedule?.setor_nome,
              organizationUnitCode: null,
              appointmentTypeCode: matrixSchedule?.tipo_procedimento || '1',
              scheduleCode: `${consulta_id}|${codigo_pre_pedido}|${matrixSchedule.procedimento_id}`,
              scheduleDate: this.matrixHelpersService.convertDate(matrixSchedule?.data_marcacao),
              patient: {
                emails: [matrixSchedule?.paciente_email],
                code: paciente_id,
                name: matrixSchedule?.paciente_nome?.trim(),
                phones: [matrixSchedule?.paciente_telefone_celular?.trim()],
                cpf: matrixSchedule?.paciente_documento?.trim(),
                bornDate: '1970-01-01', // Botei essa data pois esse campo é usado no unique do
                // schedule e não tem data de nascimento do paciente para essa integração
              },
            };
            return extractedSchedule;
          }),
        );
        allBatches.push(batchResults);
      }

      const extractedSchedules: ExtractedSchedule[] = (await Promise.all(allBatches)).flat();

      return extractedSchedules;
    } catch (e) {
      Sentry.captureEvent({
        message: 'TECNOLAB:transformMatrixSchedulesToExtractedSchedules',
        extra: {
          integrationId: castObjectIdToString(integration._id),
          message: e,
        },
      });
    }
  }

  async listSchedulesToConfirm(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2<MatrixConfirmationErpParams>,
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

        const { organizationUnit, procedure, appointmentType, doctor, speciality, insurance, insurancePlan } =
          scheduleCorrelation;
        const dateFormat = 'YYYY-MM-DDTHH:mm:ss';

        const scheduleObject: ConfirmationScheduleSchedule = {
          scheduleId: schedule.id,
          scheduleCode: String(schedule.scheduleCode),
          scheduleDate: moment(schedule.scheduleDate).format(dateFormat),
          organizationUnitCode: organizationUnit?.code || schedule?.organizationUnitCode,
          organizationUnitName: organizationUnit?.friendlyName,
          organizationUnitAddress: (organizationUnit?.data as any)?.address,
          procedureCode: procedure?.code || schedule?.procedureCode,
          procedureName: procedure?.friendlyName || procedure?.name || schedule.procedureName?.trim(),
          doctorCode: data.erpParams?.hideDoctorInfo ? null : doctor?.code || schedule?.doctorCode,
          doctorName: data.erpParams?.hideDoctorInfo
            ? null
            : doctor?.friendlyName || doctor?.name || schedule.doctorName?.trim(),
          appointmentTypeCode:
            appointmentType?.code ||
            schedule.appointmentTypeCode ||
            (speciality as SpecialityEntityDocument)?.specialityType,
          appointmentTypeName: appointmentType?.friendlyName,
          specialityCode: speciality?.code || schedule?.specialityCode,
          specialityName: speciality?.friendlyName || schedule.specialityName,
          insuranceCode: insurance?.code || schedule?.insuranceCode,
          insuranceName: insurance?.friendlyName || schedule?.insuranceName,
          insurancePlanCode: insurancePlan?.code || schedule?.insurancePlanCode,
          insurancePlanName: insurancePlan?.friendlyName || schedule?.insurancePlanName,
        };

        const { patientName, patientCode, patientPhone1, patientPhone2 } = schedule;
        const confirmationSchedule: ConfirmationScheduleDataV2 = {
          contact: {
            phone: [],
            email: null,
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
              confirmationSchedule.contact.phone.push(String(phone).replace(/\D/g, '').trim());
            });
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
      throw INTERNAL_ERROR_THROWER('MatrixConfirmationService.listSchedulesToConfirm', error);
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
      let codigo_pre_pedido = schedule.scheduleCode.split('|')[1];
      const consulta_id = schedule.scheduleCode.split('|')[0];

      if (!codigo_pre_pedido) {
        codigo_pre_pedido = await this.getCodigoPrePedido(integration, schedule);
      }

      await this.matrixApiService.cancelSchedule(integration, {
        consulta_id,
        codigo_pre_pedido,
      });

      await this.schedulesService.buildConfirmSchedule(integration, schedule.scheduleCode, scheduleId);
      return { ok: true };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('MatrixConfirmationService.cancelSchedule', error);
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
      let codigo_pre_pedido = schedule.scheduleCode.split('|')[1];
      const consulta_id = schedule.scheduleCode.split('|')[0];

      if (!codigo_pre_pedido) {
        codigo_pre_pedido = await this.getCodigoPrePedido(integration, schedule);
      }

      await this.matrixApiService.confirmSchedule(integration, {
        consulta_id,
        codigo_pre_pedido,
      });

      await this.schedulesService.buildConfirmSchedule(integration, schedule.scheduleCode, scheduleId);
      return { ok: true };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('MatrixConfirmationService.confirmSchedule', error);
    }
  }

  private async getCodigoPrePedido(integration: IntegrationDocument, schedule: Schedules) {
    const consulta_id = schedule?.scheduleCode?.split?.('|')[0];
    const matrixPatientScheduleList =
      (await this.matrixApiService.listPatientSchedules(integration, {
        paciente_id: schedule.patientCode,
      })) || [];
    const matrixPatientSchedule = matrixPatientScheduleList.find(
      (patientSchedule) => patientSchedule.consulta_id === consulta_id,
    );
    return matrixPatientSchedule?.codigo_pre_pedido;
  }

  async getConfirmationScheduleById(integration: IntegrationDocument, data: GetScheduleByIdData): Promise<Schedules> {
    try {
      return await this.schedulesService.getScheduleByCodeOrId(
        castObjectIdToString(integration._id),
        null,
        data.scheduleId,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('MatrixConfirmationService.getConfirmationScheduleById', error);
    }
  }

  async getGuidance(
    integration: IntegrationDocument,
    schedule: Pick<Schedules, 'procedureCode' | 'specialityCode' | 'scheduleCode'>,
  ): Promise<string> {
    let guidance;
    try {
      const stringIntegrationId = castObjectIdToString(integration._id);
      const completeSchedule = await this.schedulesService.getScheduleByCodeOrId(
        stringIntegrationId,
        schedule.scheduleCode,
      );

      if (!completeSchedule) return;
      const scheduleCode = completeSchedule.scheduleCode.split('|')[0];
      const data = {
        integrationId: stringIntegrationId,
        patientErpCode: completeSchedule.patientCode,
        patientCpf: completeSchedule.patientCpf,
        scheduleCode: scheduleCode,
        link: `resume/${scheduleCode}`,
      };

      const result = await this.schedulingLinksService.createSchedulingLinkGroupedByPatientErpCodeAndScheduleCode(
        integration,
        data,
      );
      if (result?.scheduleResumeLink?.shortLink) {
        guidance = `
Abra o link abaixo para ver as orientações e preparos do seu agendamento
${result.scheduleResumeLink.shortLink}
`;
      }
    } catch (e) {
      Sentry.captureEvent({
        message: 'TECNOLAB:getGuidance',
        extra: {
          integrationId: castObjectIdToString(integration._id),
          message: e,
        },
      });
    }
    return guidance;
  }
}
