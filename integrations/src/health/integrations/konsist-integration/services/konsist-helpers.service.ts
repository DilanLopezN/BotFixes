import { Injectable, Logger } from '@nestjs/common';
import * as moment from 'moment';
import { Patient } from '../../../interfaces/patient.interface';
import { RawAppointment } from '../../../shared/appointment.service';
import { AppointmentStatus } from '../../../interfaces/appointment.interface';
import { CorrelationFilter } from '../../../interfaces/correlation-filter.interface';
import { formatPhone } from '../../../../common/helpers/format-phone';
import {
  KonsistDadosPacienteResponse,
  KonsistAgendaHorarioRetorno,
  KonsistAgendamentoResponse,
  KonsistAgendamentoItem,
  KonsistIncluirPacienteRequest,
  KonsistContato,
} from '../interfaces';

@Injectable()
export class KonsistHelpersService {
  private readonly logger = new Logger(KonsistHelpersService.name);
  private readonly dateFormat = 'YYYY-MM-DD';
  private readonly dateTimeFormat = 'YYYY-MM-DDTHH:mm:ss';

  /**
   * Transforma paciente do Konsist para formato padrão
   * Interface KonsistDadosPacienteResponse: idpaciente, nomeregistro, nomesocial, nascimento, sexo
   */
  public replacePatient(paciente: KonsistIncluirPacienteRequest): Patient {
    if (!paciente) return null;

    return {
      code: String(paciente),
      name: paciente.nome,
      cpf: paciente.cpf,
      email: paciente.email,
      phone: '',
      cellPhone: paciente.email,
      bornDate: this.parseDate(paciente.datanascimento),
      sex: this.mapSex(paciente.sexo),
    };
  }

  replaceKonsistPatientToPatient(paciente: KonsistDadosPacienteResponse): Patient {
    return {
      code: String(paciente.idpaciente),
      name: paciente.nomeregistro || paciente.nomesocial,
      cpf: null,
      email: '',
      phone: '',
      cellPhone: '',
      bornDate: this.parseDate(paciente.nascimento),
      sex: this.mapSex(paciente.sexo),
    };
  }
  /**
   * Transforma paciente completo do Konsist (com contatos) para formato padrão
   * KonsistContato tem: descricao e conteudo (não ddd/numero)
   */
  public replacePatientWithContacts(paciente: KonsistAgendamentoResponse): Patient {
    if (!paciente) return null;

    let phone = '';
    let cellPhone = '';

    // Extrai telefones dos contatos
    // KonsistContato: { descricao?: string; conteudo?: string }
    if (paciente.contatos?.length) {
      for (const contato of paciente.contatos) {
        // descricao pode indicar tipo: "celular", "telefone", etc
        // conteudo é o número em si
        if (contato.conteudo) {
          const cleanNumber = contato.conteudo.replace(/\D/g, '');
          const isCellPhone =
            contato.descricao?.toLowerCase()?.includes('celular') ||
            contato.descricao?.toLowerCase()?.includes('cel') ||
            (cleanNumber.length >= 10 && cleanNumber.charAt(cleanNumber.length - 9) === '9');

          if (isCellPhone && !cellPhone) {
            cellPhone = formatPhone(cleanNumber, true);
          } else if (!phone) {
            phone = formatPhone(cleanNumber, true);
          }
        }
      }
    } else if (paciente.telefone) {
      phone = formatPhone(paciente.telefone, true);
    }

    return {
      code: String(paciente.id),
      name: paciente.nome?.trim(),
      cpf: paciente.cpf,
      email: paciente.email,
      phone,
      cellPhone,
      bornDate:
        paciente.datanascimento || paciente.nascimento
          ? moment(
              paciente.datanascimento || paciente.nascimento,
              ['YYYY-MM-DD', 'DD/MM/YYYY', 'DD/MM/YY'],
              true,
            ).format('YYYY-MM-DD')
          : '',
      sex: '',
    };
  }

  /**
   * Converte data do formato Konsist para ISO
   */
  private parseDate(dateString?: string): string | undefined {
    if (!dateString) return undefined;

    const parsed = moment(dateString, this.dateFormat, true);

    return parsed.isValid() ? parsed.toISOString() : undefined;
  }

  /**
   * Mapeia sexo do Konsist para padrão
   */
  private mapSex(sexo?: string): string {
    if (!sexo) return '';
    const upperSexo = sexo.toUpperCase();
    if (upperSexo === 'M' || upperSexo === 'MASCULINO') return 'M';
    if (upperSexo === 'F' || upperSexo === 'FEMININO') return 'F';
    return '';
  }

  /**
   * Mapeia status do Konsist para status padrão
   * Konsist: C=Confirmado, L=chegou, D=Desmarcado, F=Faltou, A=Atendido, M=Atendido Medico
   * AppointmentStatus: canceled=0, scheduled=1, confirmed=2, finished=3
   */
  public mapAppointmentStatus(status?: string | number): AppointmentStatus {
    if (!status) return AppointmentStatus.scheduled;

    const statusNum = typeof status === 'string' ? parseInt(status, 10) : status;
    const statusStr = typeof status === 'string' ? status.toUpperCase() : '';

    // Por número (vem do /status endpoint)
    switch (statusNum) {
      case 1: // Confirmado
        return AppointmentStatus.confirmed;
      case 2: // Desmarcado
        return AppointmentStatus.canceled;
      case 3: // Atendido
        return AppointmentStatus.finished;
      case 4: // Faltou
        return AppointmentStatus.canceled;
      case 5: // Chegou
        return AppointmentStatus.confirmed;
      case 6: // Liberado
        return AppointmentStatus.finished;
    }

    // Por letra (vem do agendamento_status)
    switch (statusStr) {
      case 'C': // Confirmado
        return AppointmentStatus.confirmed;
      case 'D': // Desmarcado
        return AppointmentStatus.canceled;
      case 'A': // Atendido
        return AppointmentStatus.finished;
      case 'F': // Faltou
        return AppointmentStatus.canceled;
      case 'L': // Chegou
        return AppointmentStatus.confirmed;
      case 'M': // Atendido Médico
        return AppointmentStatus.finished;
    }

    return AppointmentStatus.scheduled;
  }

  /**
   * Converte status padrão do sistema para status do Konsist
   */
  public convertToKonsistStatus(status: AppointmentStatus): number {
    switch (status) {
      case AppointmentStatus.confirmed:
        return 1; // Confirmado
      case AppointmentStatus.canceled:
        return 2; // Desmarcado
      case AppointmentStatus.finished:
        return 3; // Atendido
      default:
        return 1; // Default: Confirmado
    }
  }

  /**
   * Transforma horário disponível do Konsist para RawAppointment
   */
  public transformAvailableSlot(slot: KonsistAgendaHorarioRetorno, filters: CorrelationFilter): RawAppointment {
    const dateTime = this.combineDateTime(slot.data, slot.hora);

    return {
      appointmentCode: String(slot.chave),
      appointmentDate: dateTime,
      duration: '-1',
      doctorId: String(slot.idmedico),
      organizationUnitId: filters?.organizationUnit?.code || '1',
      specialityId: filters?.speciality?.code || '-1',
      insuranceId: filters?.insurance?.code || '-1',
      procedureId: filters?.procedure?.code || '-1',
      status: AppointmentStatus.scheduled,
    };
  }

  /**
   * Transforma agendamento do Konsist para RawAppointment
   */
  public transformAppointment(
    agendamento: KonsistAgendamentoItem,
    _paciente: KonsistAgendamentoResponse,
  ): RawAppointment {
    const dateTime = this.combineDateTime(agendamento.agendamento_data, agendamento.agendamento_hora);

    return {
      appointmentCode: String(agendamento.agendamento_chave),
      appointmentDate: dateTime,
      duration: '-1',
      doctorId: '-1',
      organizationUnitId: '1',
      specialityId: '-1',
      insuranceId: '-1',
      procedureId: agendamento.agendamento_codigo_procedimento || '-1',
      status: this.mapAppointmentStatus(agendamento.agendamento_status),
      data: {
        medico: agendamento.agendamento_medico,
        especialidade: agendamento.agendamento_especialidade,
        procedimento: agendamento.agendamento_procedimento,
        preparo: agendamento.agendamento_preparo,
        unidade: agendamento.empresa_unidade,
        endereco: agendamento.empresa_endereco,
        telefone: agendamento.empresa_telefone,
      },
    };
  }

  /**
   * Combina data e hora em ISO string
   */
  private combineDateTime(date?: string, time?: string): string {
    if (!date) return '';

    const dateTime = time ? `${date} ${time}` : date;
    return moment(dateTime, 'YYYY-MM-DD HH:mm').toISOString();
  }

  /**
   * Formata data para o padrão do Konsist (YYYY-MM-DD)
   */
  public formatDateForKonsist(date: Date | string): string {
    if (typeof date === 'string') {
      const parsed = moment(date);
      if (!parsed.isValid()) {
        return moment(date, ['DD/MM/YYYY', 'DD-MM-YYYY'], true).format('YYYY-MM-DD');
      }
      return parsed.format('YYYY-MM-DD');
    }
    return moment(date).format('YYYY-MM-DD');
  }

  /**
   * Formata hora para o padrão do Konsist (HH:mm)
   */
  public formatTimeForKonsist(date: Date | string): string {
    return moment(date).format('HH:mm');
  }

  /**
   * Valida CPF (apenas formato, não dígitos verificadores)
   */
  public validateCPF(cpf: string): boolean {
    if (!cpf) return false;
    const cleanCPF = cpf.replace(/\D/g, '');
    return cleanCPF.length === 11;
  }

  /**
   * Formata telefone para o padrão do Konsist
   */
  public formatPhoneForKonsist(phone: string): { ddi?: string; ddd: string; numero: string } | null {
    if (!phone) return null;

    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length < 10) return null;

    // Com DDI (ex: 5511999999999)
    if (cleanPhone.length === 13) {
      return {
        ddi: cleanPhone.substring(0, 2),
        ddd: cleanPhone.substring(2, 4),
        numero: cleanPhone.substring(4),
      };
    }

    // Sem DDI (ex: 11999999999)
    if (cleanPhone.length >= 10) {
      return {
        ddd: cleanPhone.substring(0, 2),
        numero: cleanPhone.substring(2),
      };
    }

    return null;
  }

  /**
   * Extrai código composto do procedimento (code:specialityCode:specialityType)
   */
  public createCompositeProcedureCode(code: string, specialityCode: string, specialityType: string): string {
    return `${code}:${specialityCode}:${specialityType}`;
  }

  /**
   * Separa código composto do procedimento
   */
  public getCompositeProcedureCode(compositeCode: string): {
    code: string;
    specialityCode?: string;
    specialityType?: string;
  } {
    const parts = compositeCode.split(':');
    return {
      code: parts[0],
      specialityCode: parts[1],
      specialityType: parts[2],
    };
  }
}
