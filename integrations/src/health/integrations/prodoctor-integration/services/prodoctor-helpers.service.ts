import { Injectable, Logger } from '@nestjs/common';
import * as moment from 'moment';
import { formatPhone, formatPhoneWithDDI, convertPhoneNumber } from '../../../../common/helpers/format-phone';
import { Patient } from '../../../interfaces/patient.interface';
import { onlyNumbers } from 'common/helpers/format-cpf';
import { AppointmentStatus } from 'health/interfaces/appointment.interface';

/**
 * Service para helpers e conversões da integração ProDoctor
 */
@Injectable()
export class ProdoctorHelpersService {
  private readonly logger = new Logger(ProdoctorHelpersService.name);

  /**
   * Converte data do formato ProDoctor (DD/MM/YYYY HH:mm) para ISO
   * @param date Data no formato DD/MM/YYYY HH:mm ou DD/MM/YYYY
   * @returns Data em formato ISO
   */
  public convertDate(date: string): string {
    if (!date) {
      return '';
    }

    try {
      // Formato com hora: "10/11/2025 14:30"
      if (date.includes(' ')) {
        return moment(date, 'DD/MM/YYYY HH:mm').toISOString();
      }

      // Formato sem hora: "10/11/2025"
      return moment(date, 'DD/MM/YYYY').toISOString();
    } catch (error) {
      this.logger.error(`Erro ao converter data: ${date}`, error);
      return '';
    }
  }

  /**
   * Converte data ISO para formato ProDoctor (DD/MM/YYYY)
   * @param date Data em formato ISO
   * @returns Data no formato DD/MM/YYYY
   */
  public convertDateToProDoctor(date: string | Date): string {
    if (!date) {
      return '';
    }

    try {
      return moment(date).format('DD/MM/YYYY');
    } catch (error) {
      this.logger.error(`Erro ao converter data para ProDoctor: ${date}`, error);
      return '';
    }
  }

  /**
   * Converte data/hora ISO para formato ProDoctor (DD/MM/YYYY HH:mm)
   * @param date Data em formato ISO
   * @returns Data no formato DD/MM/YYYY HH:mm
   */
  public convertDateTimeToProDoctor(date: string | Date): string {
    if (!date) {
      return '';
    }

    try {
      return moment(date).format('DD/MM/YYYY HH:mm');
    } catch (error) {
      this.logger.error(`Erro ao converter data/hora para ProDoctor: ${date}`, error);
      return '';
    }
  }

  /**
   * Formata telefone para o padrão brasileiro com DDI
   * @param telefone Telefone do ProDoctor (ex: "(11) 99999-9999")
   * @returns Telefone formatado com DDI (ex: "5511999999999")
   */
  public formatPhoneFromProDoctor(telefone: string): string {
    if (!telefone) {
      return '';
    }

    try {
      // Remove tudo que não é número
      const numbersOnly = onlyNumbers(telefone);

      // Se já tem DDI (13 dígitos), retorna
      if (numbersOnly.length === 13) {
        return numbersOnly;
      }

      // Se tem 11 dígitos (DDD + número), adiciona DDI
      if (numbersOnly.length === 11) {
        return `55${numbersOnly}`;
      }

      // Se tem 10 dígitos, adiciona DDI (pode ser fixo)
      if (numbersOnly.length === 10) {
        return `55${numbersOnly}`;
      }

      return numbersOnly;
    } catch (error) {
      this.logger.error(`Erro ao formatar telefone: ${telefone}`, error);
      return '';
    }
  }

  /**
   * Formata telefone do formato interno para ProDoctor
   * @param phone Telefone no formato interno (5511999999999)
   * @returns Telefone no formato ProDoctor (11) 99999-9999
   */
  public formatPhoneToProDoctor(phone: string): string {
    if (!phone) {
      return '';
    }

    try {
      const numbersOnly = onlyNumbers(phone);

      // Remove DDI se tiver
      let phoneWithoutDDI = numbersOnly;
      if (numbersOnly.startsWith('55') && numbersOnly.length >= 12) {
        phoneWithoutDDI = numbersOnly.substring(2);
      }

      // Formata: (11) 99999-9999 ou (11) 9999-9999
      if (phoneWithoutDDI.length === 11) {
        return `(${phoneWithoutDDI.substring(0, 2)}) ${phoneWithoutDDI.substring(2, 7)}-${phoneWithoutDDI.substring(7)}`;
      } else if (phoneWithoutDDI.length === 10) {
        return `(${phoneWithoutDDI.substring(0, 2)}) ${phoneWithoutDDI.substring(2, 6)}-${phoneWithoutDDI.substring(6)}`;
      }

      return phoneWithoutDDI;
    } catch (error) {
      this.logger.error(`Erro ao formatar telefone para ProDoctor: ${phone}`, error);
      return phone;
    }
  }

  /**
   * Formata CPF adicionando pontos e traço
   * @param cpf CPF sem formatação
   * @returns CPF formatado (XXX.XXX.XXX-XX)
   */
  public formatCPF(cpf: string): string {
    if (!cpf) {
      return '';
    }

    const numbersOnly = onlyNumbers(cpf);

    if (numbersOnly.length !== 11) {
      return cpf;
    }

    return `${numbersOnly.substring(0, 3)}.${numbersOnly.substring(3, 6)}.${numbersOnly.substring(6, 9)}-${numbersOnly.substring(9)}`;
  }

  /**
   * Converte sexo do ProDoctor para o formato interno
   * @param sexo 'M' ou 'F' do ProDoctor
   * @returns 'Masculino' ou 'Feminino'
   */
  public convertSexFromProDoctor(sexo: string): string {
    if (!sexo) {
      return '';
    }

    switch (sexo.toUpperCase()) {
      case 'M':
      case 'MASCULINO':
        return 'Masculino';
      case 'F':
      case 'FEMININO':
        return 'Feminino';
      default:
        return sexo;
    }
  }

  /**
   * Converte sexo do formato interno para ProDoctor
   * @param sex 'Masculino' ou 'Feminino'
   * @returns 'M' ou 'F'
   */
  public convertSexToProDoctor(sex: string): string {
    if (!sex) {
      return '';
    }

    switch (sex.toLowerCase()) {
      case 'masculino':
      case 'm':
        return 'M';
      case 'feminino':
      case 'f':
        return 'F';
      default:
        return sex;
    }
  }

  /**
   * Converte status de agendamento do ProDoctor para o formato interno
   * @param status Status do ProDoctor
   * @returns Status no formato interno
   */
  public convertScheduleStatus(status: string): AppointmentStatus {
    if (!status) {
      return AppointmentStatus.scheduled;
    }

    switch (status.toLowerCase()) {
      case 'confirmado':
        return AppointmentStatus.confirmed;
      case 'agendado':
      case 'marcado':
        return AppointmentStatus.scheduled;
      case 'cancelado':
      case 'desmarcado':
        return AppointmentStatus.canceled;
      case 'realizado':
      case 'atendido':
        return AppointmentStatus.finished;

      default:
        return AppointmentStatus.scheduled;
    }
  }

  /**
   * Valida se um CPF tem o formato correto (11 dígitos)
   * @param cpf CPF a ser validado
   * @returns true se válido
   */
  public validateCPF(cpf: string): boolean {
    if (!cpf) {
      return false;
    }

    const numbersOnly = onlyNumbers(cpf);
    return numbersOnly.length === 11;
  }

  /**
   * Valida se uma data está no formato correto do ProDoctor
   * @param date Data no formato DD/MM/YYYY
   * @returns true se válido
   */
  public validateProDoctorDate(date: string): boolean {
    if (!date) {
      return false;
    }

    return moment(date, 'DD/MM/YYYY', true).isValid();
  }

  /**
   * Extrai código do convênio de um objeto composto
   * Útil para casos onde o código vem dentro de objeto { codigo: X }
   */
  public extractCode(obj: any): number | string | null {
    if (!obj) {
      return null;
    }

    if (typeof obj === 'number' || typeof obj === 'string') {
      return obj;
    }

    if (obj.codigo !== undefined) {
      return obj.codigo;
    }

    if (obj.code !== undefined) {
      return obj.code;
    }

    return null;
  }

  /**
   * Cria um período de busca para a API ProDoctor
   * @param fromDay Dias a partir de hoje
   * @param untilDay Dias até
   * @returns Objeto com dataInicio e dataFim
   */
  public createPeriod(fromDay: number, untilDay: number): { dataInicio: string; dataFim: string } {
    const dataInicio = moment().add(fromDay, 'days').format('DD/MM/YYYY');
    const dataFim = moment().add(untilDay, 'days').format('DD/MM/YYYY');

    return {
      dataInicio,
      dataFim,
    };
  }

  /**
   * Normaliza nome removendo acentos e caracteres especiais
   * @param name Nome a ser normalizado
   * @returns Nome normalizado
   */
  public normalizeName(name: string): string {
    if (!name) {
      return '';
    }

    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();
  }

  /**
   * Verifica se dois nomes são similares (ignora acentos e case)
   * @param name1 Primeiro nome
   * @param name2 Segundo nome
   * @returns true se similares
   */
  public areNamesSimilar(name1: string, name2: string): boolean {
    if (!name1 || !name2) {
      return false;
    }

    const normalized1 = this.normalizeName(name1);
    const normalized2 = this.normalizeName(name2);

    return normalized1 === normalized2;
  }
}
