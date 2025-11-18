import { Injectable, Logger } from '@nestjs/common';
import * as moment from 'moment';
import { INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import * as rtfParser from 'rtf-parser';
import {
  ConfirmationScheduleGuidance,
  ConfirmationScheduleGuidanceResponse,
  ConfirmScheduleV2,
  ListSchedulesToConfirmV2,
  MatchFlowsConfirmation,
} from '../../../integrator/interfaces';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { SchedulesService } from '../../../schedules/schedules.service';
import {
  KayserConfirmOrCancelScheduleParamsRequest,
  KayserConfirmOrCancelScheduleResponse,
  KayserListSchedulesParamsRequest,
  KayserSchedule,
} from '../interfaces/confirmation.interface';
import { ConfirmOrCancelApi, KayserApiService } from './kayser-api.service';
import {
  ConfirmationSchedule,
  ConfirmationScheduleDataV2,
  ConfirmationScheduleSchedule,
} from '../../../interfaces/confirmation-schedule.interface';
import { FlowAction, FlowActionElement } from '../../../flow/interfaces/flow.interface';
import { FlowService } from '../../../flow/service/flow.service';
import { ExtractedSchedule } from '../../../schedules/interfaces/extracted-schedule.interface';
import { convertPhoneNumber, formatPhone } from '../../../../common/helpers/format-phone';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';

export enum ConfirmOrCancelConfirmation {
  confirm = 'confirm',
  cancel = 'cancel',
}

export enum AppointmentTypeName {
  C = 'Consulta',
  E = 'Exame',
}

const dateFormat = 'YYYY-MM-DDTHH:mm:ss';

@Injectable()
export class KayserConfirmationService {
  private logger = new Logger(KayserConfirmationService.name);

  constructor(
    private readonly schedulesService: SchedulesService,
    private readonly apiService: KayserApiService,
    private readonly flowService: FlowService,
  ) {}

  private async formatGuidance(text): Promise<string> {
    try {
      const textFixed = text
        .slice(0, -1)
        .replace(/\\u([0-9A-Fa-f]{1,4})\?/g, (match, p1) => {
          return String.fromCharCode(parseInt(p1, 10));
        })
        .replace(/\\'(..)/g, (match, p1) => {
          return String.fromCharCode(parseInt(p1, 16));
        });

      return new Promise((resolve, reject) => {
        let plainText = '';

        rtfParser.string(textFixed, (err, doc) => {
          if (err) {
            return reject(err);
          }

          doc.content.forEach((paragrath) => {
            paragrath?.content?.forEach((span) => {
              plainText += span.value.trim();
            });
            plainText += '\n';
          });

          resolve(plainText);
        });
      });
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  private async listSchedulesToConfirmData(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2,
  ): Promise<ExtractedSchedule[]> {
    const { startDate, endDate } = data;

    const requestFilters: KayserListSchedulesParamsRequest = {
      codigoPaciente: 0,
      dataInicioBusca: moment(startDate).format(dateFormat),
      dataFimBusca: moment(endDate).format(dateFormat),
    };

    const response = await this.apiService.listSchedules(integration, requestFilters);

    if (!response) {
      return [];
    }

    const guidanceMap = {};

    await Promise.all(
      response.map(async (kayserSchedule: KayserSchedule): Promise<void> => {
        guidanceMap[kayserSchedule.codigoHorario] = await this.formatGuidance(kayserSchedule.preparo);
      }),
    );

    return response?.map((kayserSchedule: KayserSchedule): ExtractedSchedule => {
      const schedule: ExtractedSchedule = {
        appointmentTypeCode: kayserSchedule.tipo_agendamento,
        appointmentTypeName: AppointmentTypeName[kayserSchedule.tipo_agendamento],
        doctorCode: kayserSchedule.medico.codigo,
        doctorName: kayserSchedule.medico.nome,
        organizationUnitCode: kayserSchedule.unidade.codigo,
        organizationUnitName: kayserSchedule.unidade.nome,
        procedureCode: kayserSchedule.procedimento.codigo,
        procedureName: kayserSchedule.procedimento.nome,
        scheduleDate: moment(kayserSchedule.dataHorario).format(dateFormat),
        scheduleCode: kayserSchedule.codigoHorario,
        insuranceCode: kayserSchedule.plano.codigo,
        insuranceName: kayserSchedule.convenio.nome,
        specialityCode: null,
        specialityName: null,
        organizationUnitAddress: kayserSchedule.unidade.endereco,
        guidance: guidanceMap[kayserSchedule.codigoHorario],
        patient: {
          name: kayserSchedule.paciente.nome,
          emails: [kayserSchedule.paciente.email],
          cpf: '-1',
          bornDate: '-1',
          code: kayserSchedule.paciente.codigoPaciente,
          phones: [],
        },
      };

      if (kayserSchedule.paciente?.celular) {
        schedule.patient.phones.push(formatPhone(convertPhoneNumber(kayserSchedule.paciente.celular)));
      }

      if (kayserSchedule.paciente?.telefone) {
        schedule.patient.phones.push(formatPhone(convertPhoneNumber(kayserSchedule.paciente.telefone)));
      }

      return schedule;
    });
  }

  async listSchedulesToConfirm(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2,
  ): Promise<ConfirmationSchedule> {
    try {
      const { erpParams } = data;

      const debugLimit = erpParams?.debugLimit;
      const debugPhone = erpParams?.debugPhoneNumber;
      const debugPatientCode = erpParams?.debugPatientCode;
      const debugScheduleCode = erpParams?.debugScheduleCode;

      const { extractStartedAt, extractEndedAt, schedules } = await this.schedulesService.buildExtraction(
        integration,
        data,
        this.listSchedulesToConfirmData.bind(this),
      );

      const result: ConfirmationSchedule = {
        data: [],
        ommitedData: [],
        metadata: {
          extractedCount: schedules.length || 0,
          extractStartedAt: extractStartedAt,
          extractEndedAt: extractEndedAt,
        },
      };

      if (!schedules.length) {
        return result;
      }

      for await (const schedule of schedules) {
        const scheduleObject: ConfirmationScheduleSchedule = {
          scheduleId: schedule.id,
          scheduleCode: schedule.scheduleCode,
          scheduleDate: moment(schedule.scheduleDate).format(dateFormat),
          organizationUnitAddress: schedule.organizationUnitAddress,
          organizationUnitName: schedule.organizationUnitName,
          procedureName: schedule.procedureName,
          specialityName: null,
          doctorName: schedule.doctorName,
          doctorObservation: null,
          appointmentTypeName: AppointmentTypeName[schedule.appointmentTypeCode],
          appointmentTypeCode: schedule.appointmentTypeCode,
          doctorCode: schedule.doctorCode,
          organizationUnitCode: schedule.organizationUnitCode,
          procedureCode: schedule.procedureCode,
          specialityCode: null,
          guidance: schedule.guidance,
        };

        const { patientName, patientCode, patientPhone1, patientPhone2 } = schedule;
        const confirmationSchedule: ConfirmationScheduleDataV2 = {
          contact: {
            phone: [],
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

        result.data.push(confirmationSchedule);
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
      throw INTERNAL_ERROR_THROWER(`KayserConfirmationService${this.listSchedulesToConfirm.name}`, error);
    }
  }

  public async confirmOrCancelSchedule(
    type: ConfirmOrCancelConfirmation,
    integration: IntegrationDocument,
    { scheduleCode, scheduleId }: ConfirmScheduleV2,
  ): Promise<OkResponse> {
    try {
      const schedule = await this.schedulesService.checkCanConfirmScheduleAndReturn(
        castObjectIdToString(integration._id),
        scheduleCode,
        scheduleId,
      );

      const payload: KayserConfirmOrCancelScheduleParamsRequest = {
        codigoHorario: schedule.scheduleCode,
        codigoPaciente: schedule.patientCode,
      };

      let responseData: KayserConfirmOrCancelScheduleResponse;
      if (type == ConfirmOrCancelConfirmation.confirm) {
        responseData = await this.apiService.confirmOrCancelSchedule(ConfirmOrCancelApi[type], integration, payload);
      } else if (type == ConfirmOrCancelConfirmation.cancel) {
        responseData = await this.apiService.confirmOrCancelSchedule(ConfirmOrCancelApi[type], integration, payload);
      } else {
        throw new Error('Invalid type error, is confirm or cancel only');
      }
      const { ok, erro, codigoErro } = responseData;

      if (ok) {
        await this.schedulesService.buildConfirmSchedule(integration, schedule.scheduleCode, scheduleId);
        return { ok };
      }
      this.logger.error('KayserConfirmationService.confirmOrCancelSchedule XXX' + JSON.stringify({ payload, type }));
      this.logger.error('KayserConfirmationService.confirmOrCancelSchedule 222' + JSON.stringify(responseData));

      throw new Error(`${codigoErro} - ${erro}`);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER(`KayserConfirmationService.${this.confirmOrCancelSchedule.name}`, error);
    }
  }

  public async matchFlowsConfirmation(
    integration: IntegrationDocument,
    data: MatchFlowsConfirmation,
  ): Promise<FlowAction<FlowActionElement>[]> {
    try {
      return await this.schedulesService.matchFlowsConfirmation(castObjectIdToString(integration._id), data);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER(`KayserConfirmationService.${this.matchFlowsConfirmation.name}`, error);
    }
  }

  public async getConfirmationScheduleGuidance(
    integration: IntegrationDocument,
    { scheduleIds, scheduleCodes }: ConfirmationScheduleGuidance,
  ): Promise<ConfirmationScheduleGuidanceResponse> {
    try {
      return await this.schedulesService.getGuidanceByScheduleCodes(integration, scheduleCodes, scheduleIds);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER(`KayserConfirmationService.${this.getConfirmationScheduleGuidance.name}`, error);
    }
  }
}
