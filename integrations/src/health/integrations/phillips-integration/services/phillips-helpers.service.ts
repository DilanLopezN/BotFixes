import { Injectable, Logger } from '@nestjs/common';
import * as moment from 'moment';
import { Patient } from '../../../interfaces/patient.interface';
import { PhillipsNaturalPerson, PhillipsCreatePatientPayload, PhillipsExamSchedule } from '../interfaces';
import { formatPhone, convertPhoneNumber } from '../../../../common/helpers/format-phone';
import { RawAppointment } from '../../../shared/appointment.service';
import { AppointmentStatus } from '../../../interfaces/appointment.interface';
import { PhillipsConsultationSchedule } from '../interfaces';
@Injectable()
export class PhillipsHelpersService {
  private readonly logger = new Logger(PhillipsHelpersService.name);

  /**
   * Mapeia a resposta de NaturalPerson da API Phillips para o formato Patient padrão
   */
  public mapNaturalPersonToPatient(data: PhillipsNaturalPerson): Patient | null {
    if (!data) return null;

    const phone = this.extractPhone(data);

    return {
      code: String(data.naturalPersonCode),
      name: data.name?.trim() || data.personName?.trim() || '',
      cpf: data.taxpayerId,
      bornDate: data.birthDate ? moment(data.birthDate).format('YYYY-MM-DD') : '',
      sex: this.mapGender(data.gender),
      email: '',
      phone: '',
      cellPhone: phone,
      socialName: data.socialName || undefined,
    };
  }

  /**
   * Mapeia dados do Patient interno para o payload de criação na API Phillips
   */
  public mapPatientToCreatePayload(patient: {
    name: string;
    cpf: string;
    bornDate?: string;
    sex?: string;
    email?: string;
    cellPhone?: string;
    phone?: string;
  }): PhillipsCreatePatientPayload {
    const nameParts = this.splitName(patient.name);

    return {
      name: patient.name,
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      birthDate: patient.bornDate ? moment(patient.bornDate).toISOString() : '',
      taxpayerId: patient.cpf,
      gender: this.mapSexToGender(patient.sex!),
      establishmentId: 1,
      personType: 'PATIENT',
      definitive: 'FALSE',
      ...(patient.cellPhone && {
        mobilePhone: formatPhone(convertPhoneNumber(patient.cellPhone), true),
        internationalCallingCodeMP: '55',
      }),
    };
  }

  /**
   * Mapeia gender da Phillips (MALE/FEMALE) para o padrão interno (M/F)
   */
  public mapGender(gender: string): string {
    if (!gender) return '';

    switch (gender.toUpperCase()) {
      case 'MALE':
        return 'M';
      case 'FEMALE':
        return 'F';
      default:
        return gender;
    }
  }

  /**
   * Mapeia sex interno (M/F) para o formato da Phillips (MALE/FEMALE)
   */
  public mapSexToGender(sex: string): string {
    if (!sex) return 'MALE';

    switch (sex.toUpperCase()) {
      case 'M':
        return 'MALE';
      case 'F':
        return 'FEMALE';
      default:
        return sex;
    }
  }

  /**
   * Extrai telefone celular do NaturalPerson
   */
  private extractPhone(data: PhillipsNaturalPerson): string {
    if (!data.mobilePhone) return '';

    const ddd = data.areaCodeMobilePhone || '';
    const countryCode = data.internationalCallingCodeMP || '';
    const phone = data.mobilePhone;

    if (ddd) {
      return `${ddd}${phone}`;
    }

    if (countryCode && phone) {
      return phone;
    }

    return phone;
  }

  /**
   * Separa nome completo em firstName e lastName
   */
  private splitName(fullName: string): { firstName: string; lastName: string } {
    if (!fullName) return { firstName: '', lastName: '' };

    const parts = fullName.trim().split(/\s+/);

    return {
      firstName: parts[0] || '',
      lastName: parts.length > 1 ? parts.slice(1).join(' ') : '',
    };
  }

  public createPatientExamAppointmentObject(schedule: PhillipsExamSchedule): RawAppointment {
    const statusMap: Record<string, AppointmentStatus> = {
      A: AppointmentStatus.scheduled,
      E: AppointmentStatus.confirmed,
      C: AppointmentStatus.canceled,
    };

    return {
      appointmentCode: String(schedule.sequence),
      appointmentDate: schedule.timeSlotDate,
      status: statusMap[schedule.scheduleStatus] ?? AppointmentStatus.scheduled,
      duration: String(schedule.durationMinutes ?? 0),
      doctorId: '',
      specialityId: '',
      organizationUnitId: String(schedule.establishmentCode ?? ''),
      insuranceId: schedule.insuranceCode ? String(schedule.insuranceCode) : '',
      procedureId: schedule.procedureCode ? String(schedule.procedureCode) : '',
      appointmentTypeId: '',
    };
  }

  public createPatientAppointmentObject(schedule: PhillipsConsultationSchedule): RawAppointment {
    const statusMap: Record<string, AppointmentStatus> = {
      REGULAR: AppointmentStatus.scheduled,
      CONFIRMED: AppointmentStatus.confirmed,
      CANCELLED: AppointmentStatus.canceled,
      CANCELED: AppointmentStatus.canceled,
    };

    return {
      appointmentCode: String(schedule.sequence),
      appointmentDate: schedule.consultationScheduleEmbeddedDate?.scheduleDate,
      status: statusMap[schedule.status] ?? AppointmentStatus.scheduled,
      duration: String(schedule.durationMinutes ?? 0),
      doctorId: schedule.scheduleCode?.physician?.naturalPersonCode,
      specialityId: String(schedule.scheduleCode?.specialty?.code ?? ''),
      organizationUnitId: String(schedule.scheduleCode?.establishmentCode?.id ?? ''),
      insuranceId: '',
      procedureId: '',
      appointmentTypeId: '',
    };
  }
}
