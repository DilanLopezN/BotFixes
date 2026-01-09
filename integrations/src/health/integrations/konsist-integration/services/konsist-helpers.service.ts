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
} from '../interfaces';

@Injectable()
export class KonsistHelpersService {
  private readonly logger = new Logger(KonsistHelpersService.name);
  private readonly dateFormat = 'DD/MM/YYYY';
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
      cpf: paciente.cpf, // CPF não está disponível no KonsistDadosPacienteResponse
      email: paciente.email, // Email não está disponível no KonsistDadosPacienteResponse
      phone: '',
      cellPhone: paciente.email,
      bornDate: this.parseDate(paciente.datanascimento),
      sex: this.mapSex(paciente.sexo),
    };
  }

  /**
   * Transforma paciente completo do Konsist (com contatos) para formato padrão
   */
  public replacePatientWithContacts(paciente: KonsistAgendamentoResponse): Patient {
    if (!paciente) return null;

    let phone = '';
    let cellPhone = '';

    // Extrai telefones dos contatos
    if (paciente.contatos?.length) {
      const contato = paciente.contatos[0];
      if (contato.ddd && contato.numero) {
        const fullNumber = `${contato.ddd}${contato.numero}`;
        // Celular começa com 9
        if (contato.numero?.startsWith('9')) {
          cellPhone = formatPhone(fullNumber, true);
        } else {
          phone = formatPhone(fullNumber, true);
        }
      }
    } else if (paciente.telefone) {
      phone = formatPhone(paciente.telefone, true);
    }

    return {
      code: String(paciente.idpaciente),
      name: paciente.paciente?.trim(),
      cpf: '',
      email: '',
      phone,
      cellPhone,
      bornDate: '',
      sex: '',
    };
  }

  /**
   * Converte data do formato Konsist para ISO
   */
  private parseDate(dateString?: string): string | undefined {
    if (!dateString) return undefined;

    // Tenta formato DD/MM/YYYY
    let parsed = moment(dateString, this.dateFormat, true);
    if (parsed.isValid()) {
      return parsed.toISOString();
    }

    // Tenta formato ISO
    parsed = moment(dateString);
    if (parsed.isValid()) {
      return parsed.toISOString();
    }

    return undefined;
  }

  /**
   * Mapeia sexo para string padrão
   */
  private mapSex(sexo?: string): string {
    if (!sexo) return '';
    const sexoUpper = sexo.toUpperCase();
    if (sexoUpper === 'M' || sexoUpper === 'MASCULINO') return 'M';
    if (sexoUpper === 'F' || sexoUpper === 'FEMININO') return 'F';
    return '';
  }

  /**
   * Converte status do Konsist para status padrão do sistema
   * Status Konsist: 1=Confirmado (C), 2=Desmarcado (D), 3=Atendido (A), 4=Faltou (F), 5=Chegou (L), 6=Liberado
   * AppointmentStatus: canceled=0, scheduled=1, confirmed=2, finished=3
   */
  public convertStatus(status: number | string): AppointmentStatus {
    const statusNum = typeof status === 'string' ? parseInt(status, 10) : status;
    const statusStr = typeof status === 'string' ? status.toUpperCase() : '';

    // Por número
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
   * Cria objeto de agendamento a partir do horário disponível
   * Interface KonsistAgendaHorarioRetorno: chave, idmedico, data, hora
   */
  public createAppointmentFromAvailableSlot(
    slot: KonsistAgendaHorarioRetorno,
    filter: CorrelationFilter,
  ): RawAppointment {
    return {
      appointmentCode: String(slot.chave || `${slot.data}-${slot.hora}`),
      appointmentDate: this.combineDateTime(slot.data, slot.hora),
      duration: '30', // Duração padrão, não vem na interface
      status: AppointmentStatus.scheduled,
      doctorId: String(slot.idmedico),
      doctorDefault: filter.doctor
        ? {
            name: filter.doctor.name,
            friendlyName: filter.doctor.friendlyName || filter.doctor.name,
            code: filter.doctor.code,
          }
        : undefined,
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
      appointmentTypeId: filter.appointmentType?.code || 'C',
      data: {
        chave: slot.chave,
        idmedico: slot.idmedico,
      },
    };
  }

  /**
   * Converte item de agendamento do Konsist para formato interno
   * Interface KonsistAgendamentoItem: agendamento_chave, agendamento_medico, agendamento_data, agendamento_hora, etc.
   */
  public convertAppointmentItemToInternal(
    item: KonsistAgendamentoItem,
    patientData?: KonsistAgendamentoResponse,
  ): RawAppointment {
    return {
      appointmentCode: String(item.agendamento_chave),
      appointmentDate: this.combineDateTime(item.agendamento_data, item.agendamento_hora),
      duration: '30',
      status: this.convertStatus(item.agendamento_status),
      appointmentTypeId: 'C',
      data: {
        medico: item.agendamento_medico,
        especialidade: item.agendamento_especialidade,
        procedimento: item.agendamento_procedimento,
        codigoProcedimento: item.agendamento_codigo_procedimento,
        preparo: item.agendamento_preparo,
        categoria: item.agendamento_categoria,
        empresaUnidade: item.empresa_unidade,
        empresaEndereco: item.empresa_endereco,
        empresaTelefone: item.empresa_telefone,
        paciente: patientData?.paciente,
        idpaciente: patientData?.idpaciente,
      },
    };
  }

  /**
   * Combina data e hora em formato ISO
   */
  public combineDateTime(date: string, time: string): string {
    if (!date) return '';

    // Se a data já contém hora, retorna diretamente
    if (date.includes('T') || date.includes(' ')) {
      return moment(date).toISOString();
    }

    // Combina data + hora
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
