import { Injectable, Logger } from '@nestjs/common';
import * as moment from 'moment';
import { RawAppointment } from '../../../shared/appointment.service';
import { AttendanceResponse } from '../interfaces';
import {
  EntityDocument,
  ProcedureEntity,
  ProcedureEntityDocument,
  SpecialityEntity,
  InsuranceEntity,
} from '../../../entities/schema';
import { AppointmentStatus } from '../../../interfaces/appointment.interface';
import { EntitiesService } from '../../../entities/services/entities.service';
import { EntityType } from '../../../interfaces/entity.interface';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';

@Injectable()
export class NetpacsServiceHelpersService {
  private logger = new Logger(NetpacsServiceHelpersService.name);

  constructor(private readonly entitiesService: EntitiesService) {}

  public convertStartDate(appointmentTimestamp: number, startAppointmentHour: number): string {
    const formatAppointmentDate = 'YYYY-MM-DDTHH:mm:ss';
    const [hours, minutes] = moment(startAppointmentHour).format('HH:mm').split(':');

    return moment(appointmentTimestamp)
      .set({ hours: parseInt(hours, 10), minutes: parseInt(minutes, 10) })
      .format(formatAppointmentDate);
  }

  public async createPatientApointmentObject(
    integration: IntegrationDocument,
    appointment: AttendanceResponse,
  ): Promise<RawAppointment> {
    const schedule: RawAppointment = {
      appointmentCode: String(appointment.idAtendimentoProcedimento),
      appointmentDate: this.convertStartDate(appointment.data, appointment.horaInicial),
      duration: null,
      procedureId: String(appointment.idProcedimento),
      doctorId: String(appointment.idMedicoExecutor),
      organizationUnitId: String(appointment.idUnidade),
      specialityId: String(appointment.idModalidade),
      insuranceId: String(appointment.idConvenio),
      status: AppointmentStatus.scheduled,
    };

    try {
      const defaultData: Partial<EntityDocument> = {
        canSchedule: false,
        canReschedule: false,
        canCancel: true,
        canConfirmActive: false,
        canConfirmPassive: true,
        canView: true,
      };

      let specialityType: string = null;

      if (appointment.idProcedimento) {
        const procedureEntity = (await this.entitiesService.getEntityByCode(
          String(appointment.idProcedimento),
          EntityType.procedure,
          integration._id,
        )) as ProcedureEntityDocument;

        if (procedureEntity?.specialityType) {
          specialityType = procedureEntity.specialityType;
        }

        schedule.procedureDefault = {
          code: String(appointment.idProcedimento),
          name: appointment.nomeProcedimento,
          friendlyName: appointment.nomeProcedimento,
          specialityType,
          ...defaultData,
        } as Partial<ProcedureEntity>;
      }

      if (appointment.idModalidade) {
        const specialityCode = String(appointment.idModalidade);

        schedule.specialityDefault = {
          code: specialityCode,
          specialityType,
          name: appointment.descricaoModalidade,
          friendlyName: appointment.descricaoModalidade,
          ...defaultData,
        } as Partial<SpecialityEntity>;
      }

      if (appointment.idMedicoExecutor) {
        schedule.doctorDefault = {
          code: String(appointment.idMedicoExecutor),
          name: appointment.nomeMedicoExecutor,
          friendlyName: appointment.nomeMedicoExecutor,
          ...defaultData,
        };
      }

      if (appointment.idConvenio) {
        const insuranceCode = String(appointment.idConvenio);

        schedule.insuranceDefault = {
          code: insuranceCode,
          name: appointment.nomeConvenio,
          friendlyName: appointment.nomeConvenio,
          ...defaultData,
        } as Partial<InsuranceEntity>;
      }
    } catch (err) {
      this.logger.error('NetpacsServiceHelpersService.createPatientApointmentObject', err);
    }

    return schedule;
  }

  /**
   * Mensagens de erro esperadas da API NETPACS que indicam situações
   * que devem ser tratadas como sucesso (agendamento já está no estado desejado)
   */
  private readonly EXPECTED_ATTENDANCE_ERROR_MESSAGES = [
    'O Atendimento já se encontra na situação que deseja alterar.',
    'encontra-se na situação de Cancelado. A situação não pode ser alterada.',
    'A situação não pode ser alterada, pois existe uma regra de atendimento',
  ];

  /**
   * Extrai a mensagem de erro de diferentes estruturas possíveis de resposta da API
   */
  public extractErrorMessage(error: any): string | undefined {
    // Tenta todos os caminhos possíveis onde a mensagem pode estar
    return (
      error?.response?.data?.error?.message || // Formato: { data: { error: { message: "..." } } }
      error?.response?.data?.message || // Formato: { data: { message: "..." } }
      error?.response?.error?.message || // Formato: { error: { message: "..." } }
      error?.message || // Formato: { message: "..." }
      undefined
    );
  }

  /**
   * Verifica se um erro é um erro esperado que deve ser tratado como sucesso
   */
  public isExpectedAttendanceError(error: any | string | undefined): boolean {
    // Se receber uma string, verifica diretamente
    if (typeof error === 'string') {
      return this.EXPECTED_ATTENDANCE_ERROR_MESSAGES.some((msg) => error.includes(msg));
    }

    // Se receber um objeto de erro, extrai a mensagem
    const errorMessage = this.extractErrorMessage(error);

    if (!errorMessage) {
      return false;
    }

    return this.EXPECTED_ATTENDANCE_ERROR_MESSAGES.some((msg) => errorMessage.includes(msg));
  }
}
