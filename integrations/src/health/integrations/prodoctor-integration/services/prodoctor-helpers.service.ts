import { Injectable, Logger } from '@nestjs/common';
import * as moment from 'moment';
import { Patient } from '../../../interfaces/patient.interface';
import { RawAppointment } from '../../../shared/appointment.service';
import { AppointmentStatus } from '../../../interfaces/appointment.interface';
import { EntityDocument } from '../../../entities/schema';
import { CorrelationFilter } from '../../../interfaces/correlation-filter.interface';
import { PacienteCRUDRequest, PacienteRequest, PacienteViewModel } from '../interfaces/patient.interface';
import {
  AgendamentoInserirRequest,
  AgendamentoConsultaViewModel,
  HorarioDisponivelViewModel,
} from '../interfaces/schedule.interface';
import { formatPhone, convertPhoneNumber } from '../../../../common/helpers/format-phone';
import { CodigoBaseRequest } from '../interfaces/base.interface';

/**
 * Estado do agendamento que indica cancelamento
 */
interface EstadoAgendaConsulta {
  faltou?: boolean;
  desmarcado?: boolean;
  cancelado?: boolean;
  atendido?: boolean;
  compareceu?: boolean;
  confirmado?: boolean;
  confirmadoMSG?: boolean;
}

@Injectable()
export class ProdoctorHelpersService {
  private readonly logger = new Logger(ProdoctorHelpersService.name);
  private readonly dateFormat = 'DD/MM/YYYY';
  private readonly dateTimeFormat = 'DD/MM/YYYY HH:mm';

  /**
   * Transforma paciente do ProDoctor para formato padrão
   */
  transformPatient(paciente: PacienteViewModel): Patient {
    const phone = this.extractPhone(paciente);
    const cellPhone = this.extractCellPhone(paciente);

    return {
      code: String(paciente.codigo),
      name: paciente.nome?.trim() || paciente.nomeCivil?.trim(),
      cpf: paciente.cpf?.replace(/\D/g, ''),
      email: paciente.correioEletronico,
      phone: phone,
      cellPhone: cellPhone,
      bornDate: this.parseDate(paciente.dataNascimento),
      sex: this.mapSex(paciente.sexo.codigo),
    };
  }

  /**
   * Extrai telefone fixo
   */
  private extractPhone(paciente: PacienteViewModel): string {
    const telefones = [paciente.telefone1, paciente.telefone2, paciente.telefone3, paciente.telefone4];

    for (const tel of telefones) {
      if (tel?.numero && tel?.tipo?.codigo !== 3) {
        return formatPhone(tel.ddd + tel.numero, true);
      }
    }

    return '';
  }

  /**
   * Extrai celular
   */
  private extractCellPhone(paciente: PacienteViewModel): string {
    const telefones = [paciente.telefone1, paciente.telefone2, paciente.telefone3, paciente.telefone4];

    for (const tel of telefones) {
      if (tel?.numero) {
        const fullNumber = (tel.ddd || '') + tel.numero;
        if (tel.numero.length >= 8 && tel.numero.startsWith('9')) {
          return formatPhone(fullNumber, true);
        }
      }
    }

    for (const tel of telefones) {
      if (tel?.numero) {
        return formatPhone((tel.ddd || '') + tel.numero, true);
      }
    }

    return '';
  }

  /**
   * Mapeia código de sexo para letra
   */
  mapSex(sexo: number): string {
    switch (sexo) {
      case 1:
        return 'M';
      case 2:
        return 'F';
      default:
        return 'I';
    }
  }

  /**
   * Mapeia letra de sexo para CodigoBaseRequest
   */
  mapSexToCode(sex: string): CodigoBaseRequest {
    switch (sex?.toUpperCase()) {
      case 'M':
        return { codigo: 1 };
      case 'F':
        return { codigo: 2 };
      default:
        return { codigo: 0 };
    }
  }

  /**
   * Converte data do formato ProDoctor (DD/MM/YYYY) para ISO (YYYY-MM-DD)
   */
  parseDate(date: string): string {
    if (!date) return '';

    const parsed = moment(date, this.dateFormat, true);
    if (parsed.isValid()) {
      return parsed.format('YYYY-MM-DD');
    }

    const parsedOther = moment(date);
    if (parsedOther.isValid()) {
      return parsedOther.format('YYYY-MM-DD');
    }

    return '';
  }

  /**
   * Converte data ISO para formato ProDoctor (DD/MM/YYYY)
   */
  formatDate(date: string | Date): string {
    if (!date) return '';

    const parsed = moment(date);
    if (parsed.isValid()) {
      return parsed.format(this.dateFormat);
    }

    return '';
  }

  /**
   * Converte data/hora ISO para formato ProDoctor (DD/MM/YYYY HH:mm)
   */
  formatDateTime(date: string | Date): string {
    if (!date) return '';

    const parsed = moment(date);
    if (parsed.isValid()) {
      return parsed.format(this.dateTimeFormat);
    }

    return '';
  }

  /**
   * Extrai apenas a data de um datetime
   */
  extractDate(date: string | Date): string {
    if (!date) return '';
    const parsed = moment(date);
    return parsed.isValid() ? parsed.format(this.dateFormat) : '';
  }

  /**
   * Extrai apenas a hora de um datetime
   */
  extractTime(date: string | Date): string {
    if (!date) return '';
    const parsed = moment(date);
    return parsed.isValid() ? parsed.format('HH:mm') : '';
  }

  /**
   * Verifica se o status indica cancelamento
   */
  isCancelledStatus(estado: EstadoAgendaConsulta): boolean {
    return !!(estado?.faltou || estado?.desmarcado || estado?.cancelado);
  }

  /**
   * Transforma agendamento do ProDoctor para RawAppointment
   */
  transformScheduleToRawAppointment(agendamento: AgendamentoConsultaViewModel): RawAppointment {
    const appointmentDate = moment(agendamento.data, this.dateTimeFormat);

    return {
      appointmentCode: String(agendamento.codigo),
      appointmentDate: appointmentDate.toISOString(),
      status: this.mapAppointmentStatus(agendamento.estadoAgendaConsulta),
      doctorId: agendamento.usuario?.codigo?.toString(),
      doctorDefault: agendamento.usuario
        ? {
            name: agendamento.usuario.nome,
            friendlyName: agendamento.usuario.nome,
            code: String(agendamento.usuario.codigo),
          }
        : undefined,
      insuranceId: agendamento.convenio?.codigo?.toString(),
      insuranceDefault: agendamento.convenio
        ? {
            name: agendamento.convenio.nome,
            friendlyName: agendamento.convenio.nome,
            code: String(agendamento.convenio.codigo),
          }
        : undefined,
      organizationUnitId: agendamento.localProDoctor?.codigo?.toString(),
      organizationUnitDefault: agendamento.localProDoctor
        ? {
            name: agendamento.localProDoctor.nome,
            friendlyName: agendamento.localProDoctor.nome,
            code: String(agendamento.localProDoctor.codigo),
          }
        : undefined,
      procedureId: agendamento.procedimentoMedico?.codigo,
      procedureDefault: agendamento.procedimentoMedico
        ? {
            name: agendamento.procedimentoMedico.nome,
            friendlyName: agendamento.procedimentoMedico.nome,
            code: agendamento.procedimentoMedico.codigo,
          }
        : undefined,
      specialityId: agendamento.usuario?.especialidade?.codigo?.toString(),
      specialityDefault: agendamento.usuario?.especialidade
        ? {
            name: agendamento.usuario.especialidade.nome,
            friendlyName: agendamento.usuario.especialidade.nome,
            code: String(agendamento.usuario.especialidade.codigo),
          }
        : undefined,
      appointmentTypeId: this.mapAppointmentTypeCode(agendamento.tipoAgendamento),
      duration: String(agendamento.duracao || 0),
      data: {
        observation: agendamento.complemento,
        tipoAgendamento: agendamento.tipoAgendamento,
      },
    };
  }

  /**
   * Mapeia status do agendamento
   */
  private mapAppointmentStatus(estado: EstadoAgendaConsulta): AppointmentStatus {
    if (!estado) return AppointmentStatus.scheduled;

    if (estado.faltou || estado.desmarcado) {
      return AppointmentStatus.canceled;
    }
    if (estado.atendido) {
      return AppointmentStatus.finished;
    }
    if (estado.compareceu || estado.confirmado || estado.confirmadoMSG) {
      return AppointmentStatus.confirmed;
    }

    return AppointmentStatus.scheduled;
  }

  /**
   * Mapeia código do tipo de agendamento
   */
  private mapAppointmentTypeCode(tipo: any): string {
    if (!tipo) return 'consulta';

    if (tipo.consulta) return 'consulta';
    if (tipo.retorno) return 'retorno';
    if (tipo.exame) return 'exame';
    if (tipo.cirurgia) return 'cirurgia';
    if (tipo.teleconsulta) return 'teleconsulta';
    if (tipo.compromisso) return 'compromisso';

    return 'consulta';
  }

  /**
   * Transforma horário disponível para RawAppointment
   */
  transformAvailableScheduleToRawAppointment(
    horario: HorarioDisponivelViewModel,
    doctor: EntityDocument,
    filter: CorrelationFilter,
  ): RawAppointment {
    const appointmentDate = moment(horario.dataHora, this.dateTimeFormat);

    return {
      appointmentCode: null,
      appointmentDate: appointmentDate.toISOString(),
      status: AppointmentStatus.scheduled,
      doctorId: doctor.code,
      doctorDefault: {
        name: doctor.name,
        friendlyName: doctor.friendlyName || doctor.name,
        code: doctor.code,
      },
      insuranceId: filter.insurance?.code,
      insuranceDefault: filter.insurance
        ? {
            name: filter.insurance.name,
            friendlyName: filter.insurance.friendlyName || filter.insurance.name,
            code: filter.insurance.code,
          }
        : undefined,
      organizationUnitId: filter.organizationUnit?.code,
      organizationUnitDefault: filter.organizationUnit
        ? {
            name: filter.organizationUnit.name,
            friendlyName: filter.organizationUnit.friendlyName || filter.organizationUnit.name,
            code: filter.organizationUnit.code,
          }
        : undefined,
      procedureId: filter.procedure?.code,
      procedureDefault: filter.procedure
        ? {
            name: filter.procedure.name,
            friendlyName: filter.procedure.friendlyName || filter.procedure.name,
            code: filter.procedure.code,
          }
        : undefined,
      specialityId: filter.speciality?.code,
      specialityDefault: filter.speciality
        ? {
            name: filter.speciality.name,
            friendlyName: filter.speciality.friendlyName || filter.speciality.name,
            code: filter.speciality.code,
          }
        : undefined,
      appointmentTypeId: filter.appointmentType?.code || 'consulta',
      duration: String(horario.duracao || 0),
    };
  }

  /**
   * Constrói request para criar paciente
   */
  buildCreatePatientRequest(patient: Partial<Patient>): PacienteCRUDRequest {
    const paciente: PacienteRequest = {
      nome: patient.name,
      cpf: patient.cpf?.replace(/\D/g, ''),
      dataNascimento: patient.bornDate ? this.formatDate(patient.bornDate) : undefined,
      correioEletronico: patient.email,
      sexo: this.mapSexToCode(patient.sex),
    };

    if (patient.cellPhone || patient.phone) {
      const phoneNumber = convertPhoneNumber(patient.cellPhone || patient.phone);
      if (phoneNumber) {
        paciente.telefone1 = {
          ddd: phoneNumber.substring(0, 2),
          numero: phoneNumber.substring(2),
          tipo: { codigo: 3 },
        };
      }
    }

    return { paciente };
  }

  /**
   * Constrói request para atualizar paciente
   */
  buildUpdatePatientRequest(patientCode: string, patient: Partial<Patient>): PacienteCRUDRequest {
    const request = this.buildCreatePatientRequest(patient);
    request.paciente.codigo = Number(patientCode);
    return request;
  }

  /**
   * Constrói request para criar agendamento
   */
  buildCreateScheduleRequest(
    patientCode: string,
    scheduleDate: string,
    filter: CorrelationFilter,
    duration?: number,
  ): AgendamentoInserirRequest {
    const parsedDate = moment(scheduleDate);

    const request: AgendamentoInserirRequest = {
      paciente: { codigo: Number(patientCode) },
      usuario: { codigo: Number(filter.doctor?.code) },
      data: parsedDate.format(this.dateFormat),
      hora: parsedDate.format('HH:mm'),
      tipoAgendamento: this.buildTipoAgendamento(filter.appointmentType?.code),
      duracao: duration || 30,
    };

    if (filter.insurance?.code) {
      request.convenio = { codigo: Number(filter.insurance.code) };
    }

    if (filter.organizationUnit?.code) {
      request.localProDoctor = { codigo: Number(filter.organizationUnit.code) };
    }

    if (filter.procedure?.code) {
      request.procedimentoMedico = {
        tabela: { codigo: 1 },
        codigo: filter.procedure.code,
      };
    }

    return request;
  }

  /**
   * Constrói objeto de tipo de agendamento
   */
  buildTipoAgendamento(appointmentTypeCode?: string): any {
    const tipo: any = {
      consulta: false,
      retorno: false,
      exame: false,
      cirurgia: false,
      teleconsulta: false,
      compromisso: false,
    };

    switch (appointmentTypeCode?.toLowerCase()) {
      case 'retorno':
        tipo.retorno = true;
        break;
      case 'exame':
        tipo.exame = true;
        break;
      case 'cirurgia':
        tipo.cirurgia = true;
        break;
      case 'teleconsulta':
        tipo.teleconsulta = true;
        break;
      case 'compromisso':
        tipo.compromisso = true;
        break;
      case 'consulta':
      default:
        tipo.consulta = true;
        break;
    }

    return tipo;
  }

  /**
   * Remove parâmetros vazios de um objeto
   */
  filterBlankParams(obj: Record<string, any>): Record<string, any> {
    return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v != null && v !== '' && v !== undefined));
  }
}
