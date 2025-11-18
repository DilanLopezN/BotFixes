import { Injectable, Logger } from '@nestjs/common';
import { onlyNumbers } from '../../../../common/helpers/format-cpf';
import { EntityDocument, ProcedureEntity, ScheduleType, SpecialityEntity } from '../../../entities/schema';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { AppointmentStatus } from '../../../interfaces/appointment.interface';
import { Patient } from '../../../interfaces/patient.interface';
import { MatrixPatientV2 } from '../interfaces/recover-password.interface';
import { RawAppointment } from '../../../shared/appointment.service';
import {
  MatrixPatientResponse,
  MatrixPatientResponseV2,
  MatrixPatientSchedulesResponse,
} from '../interfaces/patient.interface';
import * as moment from 'moment';
import * as contextService from 'request-context';
import { CacheService } from '../../../../core/cache/cache.service';
import { CtxMetadata } from '../../../../common/interfaces/ctx-metadata';
import {
  MATRIX_TOKEN_EXPIRATION,
  PATIENT_PRE_SCHEDULE_CODE_EXPIRATION,
  MATRIX_AUTH_TOKEN_EXPIRATION,
} from '../defaults';
import { IIntegration } from '../../../integration/interfaces/integration.interface';
import { formatPhoneWithDDI } from '../../../../common/helpers/format-phone';
import { SchedulingLinksService } from '../../../scheduling/services/scheduling-links.service';
import { PatientSchedules } from 'health/integrator/interfaces';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';
import * as crypto from 'crypto';

interface PrepedidoSet {
  patientCpf: string;
  patientCode: string;
  codigoPrePedido: string;
}

interface PrepedidoGet {
  patientCpf: string;
  patientCode: string;
}

export interface CompositeProcedureCodeData {
  code: string;
  areaCode?: string;
  lateralityCode?: string;
  specialityCode?: string;
  specialityType?: string;
}

@Injectable()
export class MatrixHelpersService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly schedulingLinksService: SchedulingLinksService,
  ) {}
  private readonly logger = new Logger(MatrixHelpersService.name);

  private getCompositeProcedureIdentifiers(): string[] {
    return ['c', 's', 'a', 'l'];
  }

  public createCompositeProcedureCode(
    _: IIntegration,
    code: string,
    specialityCode: string,
    areaCode: string,
    lateralityCode: string,
  ): string {
    const [i0, i1, i2, i3] = this.getCompositeProcedureIdentifiers();

    const pCode = `${code}`;
    const aCode = areaCode ? `${areaCode}` : '';
    const lCode = lateralityCode ? `${lateralityCode}` : '';
    const sCode = specialityCode ? `${specialityCode}` : '';

    return `${i0}${pCode}:${i1}${sCode}:${i2}${aCode}:${i3}${lCode}`;
  }

  public getCompositeProcedureCode(_: IIntegration, code = ''): CompositeProcedureCodeData {
    const identifiers = this.getCompositeProcedureIdentifiers();
    const parts = code.split(':').map((occ, index) => {
      const identifier = identifiers[index];
      return occ.replace(identifier, '');
    });

    return {
      code: parts?.[0],
      specialityCode: parts?.[1],
      areaCode: parts?.[2],
      lateralityCode: parts?.[3],
    };
  }

  public replaceMatrixPatientToPatient(matrixPatient: MatrixPatientResponse, isV2?: boolean): MatrixPatientV2 {
    const patient: Patient = {
      bornDate: moment(matrixPatient.dataNascimento, 'DD/MM/YYYY').toISOString(),
      name: matrixPatient.nome,
      cpf: onlyNumbers(matrixPatient.documento),
      sex: matrixPatient.sexo,
      code: String(matrixPatient.paciente_id),
      email: matrixPatient.email,
    };

    if (matrixPatient?.telefone) {
      const phoneSplit = matrixPatient?.telefone.split('-');
      const dddPhone = phoneSplit[phoneSplit.length - 2];
      const phoneNumb = phoneSplit[phoneSplit.length - 1];

      patient.phone = formatPhoneWithDDI('55', dddPhone, phoneNumb);
    }

    if (matrixPatient?.celular) {
      const cellphoneSplit = matrixPatient?.celular.split('-');
      const dddCellPhone = cellphoneSplit[cellphoneSplit.length - 2];
      const cellPhoneNumb = cellphoneSplit[cellphoneSplit.length - 1];

      patient.cellPhone = formatPhoneWithDDI('55', dddCellPhone, cellPhoneNumb);
    }

    if (isV2) {
      return {
        ...patient,
        data: {
          usuarioNet: (matrixPatient as MatrixPatientResponseV2).usuarioNet,
        },
      };
    }

    return patient as unknown as MatrixPatientV2;
  }

  public convertDate(date: string): string {
    if (!date) {
      return '';
    }
    const datePattern = 'YYYY-MM-DDTHH:mm:ss';

    // Detecta se é formato americano com AM/PM
    // retornado na rota lista-marcacoes-detalhada
    // Exemplo: 12/31/2023 01:30 PM
    const usFormat = /^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2})(?::(\d{2}))? ?(AM|PM)$/i;
    const match = date.match(usFormat);
    if (match) {
      const [_, month, day, year, hour, minute, second = '00', ampm] = match;

      let h = parseInt(hour, 10);
      if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
      if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;

      const formattedDate = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      return moment
        .utc(formattedDate, 'DD/MM/YYYY')
        .set('hour', h)
        .set('minute', Number(minute))
        .set('second', Number(second))
        .format(datePattern);
    }

    const [partDate, partTime] = date.split(' ');

    const startTime = partTime.split(':');
    const dateParts = partDate.split('/');

    if (dateParts[2].length <= 2) {
      dateParts[2] = `20${dateParts[2]}`;
    }

    const formattedDate = dateParts.reverse().join('-');

    return moment
      .utc(formattedDate)
      .set('hour', Number(startTime[0]))
      .set('minute', Number(startTime[1]))
      .format(datePattern);
  }

  private getMatrixScheduleStatus(
    appointment: MatrixPatientSchedulesResponse['agendamentos'][number],
  ): AppointmentStatus {
    switch (appointment.status) {
      case 'Confirmado':
        return AppointmentStatus.confirmed;

      case 'Marcado':
        return AppointmentStatus.scheduled;

      case 'Desmarcado':
        return AppointmentStatus.canceled;

      case 'Realizado':
        return AppointmentStatus.finished;

      default:
        return AppointmentStatus.scheduled;
    }
  }

  public async createPatientAppointmentObject(
    integration: IntegrationDocument,
    appointment: MatrixPatientSchedulesResponse['agendamentos'][number],
    patient?: PatientSchedules,
  ): Promise<RawAppointment> {
    const schedule: RawAppointment = {
      appointmentCode: String(appointment.consulta_id),
      appointmentDate: this.convertDate(appointment.data_marcacao),
      status: this.getMatrixScheduleStatus(appointment),
      duration: '0',
      doctorId: String(appointment.responsavel_id),
      insuranceId: null,
      procedureId: String(appointment.procedimento_id),
      specialityId: String(appointment.setor_id),
      canCancel: true,
      canConfirm: true,
      data: { consulta_id: appointment.consulta_id, codigo_pre_pedido: appointment.codigo_pre_pedido },
    };

    if (appointment.unidade_id) {
      schedule.organizationUnitId = String(appointment.unidade_id);
    }

    if (appointment.unidade_endereco) {
      schedule.organizationUnitAdress = String(appointment.unidade_endereco);
    }

    if (appointment.tipo_procedimento) {
      schedule.appointmentTypeId =
        appointment.tipo_procedimento === 'EXAME' ? ScheduleType.Exam : ScheduleType.Consultation;
    }

    try {
      const defaultData: Partial<EntityDocument> = {
        canSchedule: false,
        canReschedule: false,
        canCancel: true,
        canConfirmActive: false,
        canConfirmPassive: false,
        canView: true,
      };

      if (appointment.procedimento_id) {
        schedule.procedureDefault = {
          code: String(appointment.procedimento_id),
          name: String(appointment.procedimento_nome),
          friendlyName: String(appointment.procedimento_nome),
          specialityType: schedule.appointmentTypeId,
          ...defaultData,
        } as Partial<ProcedureEntity>;
      }

      if (appointment.setor_id) {
        const specialityCode = String(appointment.setor_id);
        const specialityType = String(schedule.appointmentTypeId) || '-1';

        schedule.specialityDefault = {
          code: specialityCode,
          specialityType,
          ...defaultData,
        } as Partial<SpecialityEntity>;

        schedule.procedureDefault = {
          ...(schedule.procedureDefault ?? {}),
          specialityCode: specialityCode,
        } as Partial<ProcedureEntity>;
      }

      if (patient.returnGuidance) {
        const { scheduleResumeLink } =
          await this.schedulingLinksService.createSchedulingLinkGroupedByPatientErpCodeAndScheduleCode(integration, {
            integrationId: castObjectIdToString(integration._id),
            patientErpCode: patient.patientCode,
            patientCpf: patient.patientCpf,
            scheduleCode: appointment.consulta_id,
            link: 'resume',
          });

        schedule.guidanceLink = scheduleResumeLink?.shortLink || null;
      }
    } catch (err) {
      this.logger.error('MatrixHelpersService.createPatientApointmentObject', err);
    }

    return schedule;
  }

  private getPreScheduleCodeKey(integration: IntegrationDocument, data: PrepedidoSet | PrepedidoGet) {
    const metadata: CtxMetadata = contextService.get('req:default-headers');

    const redisKey: string = `${integration._id}:${metadata.conversationId}:${data.patientCode || data.patientCpf}`;
    return redisKey;
  }

  public async setCachePreScheduleCode(integration: IntegrationDocument, data: PrepedidoSet) {
    const client = this.cacheService.getClient();
    const redisKey = this.getPreScheduleCodeKey(integration, data);

    await client.set(
      redisKey,
      JSON.stringify({
        codigoPrePedido: data.codigoPrePedido,
      }),
      'EX',
      PATIENT_PRE_SCHEDULE_CODE_EXPIRATION,
    );
  }

  public async getCachePreScheduleCode(integration: IntegrationDocument, data: PrepedidoGet): Promise<string> {
    const client = this.cacheService.getClient();
    const redisKey = this.getPreScheduleCodeKey(integration, data);
    const result = await client.get(redisKey);

    if (!result) {
      return null;
    }

    try {
      const data = JSON.parse(result);
      return data?.codigoPrePedido || null;
    } catch (error) {}

    return null;
  }

  private getMatrixTokenKey(integration: IntegrationDocument) {
    const redisKey: string = `matrix-token:${integration._id}`;
    return redisKey;
  }

  public async setCacheMatrixToken(integration: IntegrationDocument, token: string) {
    const client = this.cacheService.getClient();
    const redisKey = this.getMatrixTokenKey(integration);

    await client.set(
      redisKey,
      JSON.stringify({
        token: token,
      }),
      'EX',
      MATRIX_TOKEN_EXPIRATION,
    );
  }

  public async removeCacheMatrixToken(integration: IntegrationDocument) {
    const client = this.cacheService.getClient();
    const redisKey = this.getMatrixTokenKey(integration);

    await client.del(redisKey);
  }

  public async getCacheMatrixToken(integration: IntegrationDocument): Promise<string> {
    const client = this.cacheService.getClient();
    const redisKey = this.getMatrixTokenKey(integration);
    const result = await client.get(redisKey);

    if (!result) {
      return null;
    }

    try {
      const data = JSON.parse(result);
      return data?.token || null;
    } catch (error) {}

    return null;
  }

  public async getLoginToken(integration: IntegrationDocument): Promise<string> {
    try {
      const key = `matrix-login-token:${integration._id}`;
      const result = await this.cacheService.get(key);
      return result;
    } catch (error) {
      this.logger.error(`MatrixHelpersService.${this.getLoginToken.name}`, error);
    }
  }

  public async setLoginToken(integration: IntegrationDocument, token: string): Promise<void> {
    try {
      const key = `matrix-login-token:${integration._id}`;
      await this.cacheService.set(token, key, MATRIX_AUTH_TOKEN_EXPIRATION);
    } catch (error) {
      this.logger.error(`MatrixHelpersService.${this.setLoginToken.name}`, error);
    }
  }

  public async removeAvailableSchedulesIntelligentCache(integration: IntegrationDocument): Promise<void> {
    try {
      const cacheKeyPattern = `${integration._id}:TEMP_LIST_SCH:*`;
      return await this.cacheService.removeKeysByPattern(cacheKeyPattern);
    } catch (error) {
      this.logger.error('MatrixHelpersService.removeAvailableSchedulesIntelligentCache', error);
    }
  }

  public async getAvailableSchedulesIntelligentCache(integration: IntegrationDocument, dataKey: any): Promise<any> {
    try {
      const hash = crypto.createHash('sha256').update(JSON.stringify(dataKey)).digest('hex');
      const cacheKeyPattern = `${integration._id}:TEMP_LIST_SCH:${hash}`;
      const data = await this.cacheService.get(cacheKeyPattern);
      return JSON.parse(data) as unknown;
    } catch (error) {
      this.logger.error('MatrixHelpersService.getAvailableSchedulesIntelligentCache', error);
    }
  }

  public async setAvailableSchedulesIntelligentCache(
    integration: IntegrationDocument,
    dataKey: any,
    data: any,
  ): Promise<void | void[]> {
    try {
      const hash = crypto.createHash('sha256').update(JSON.stringify(dataKey)).digest('hex');
      const cacheKeyPattern = `${integration._id}:TEMP_LIST_SCH:${hash}`;
      await this.cacheService.set(JSON.stringify(data), cacheKeyPattern, 120);
    } catch (error) {
      this.logger.error('MatrixHelpersService.setAvailableSchedulesIntelligentCache', error);
    }
  }
}
