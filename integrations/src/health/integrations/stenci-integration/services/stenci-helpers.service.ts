import { Injectable, Logger } from '@nestjs/common';
import { Patient } from '../../../interfaces/patient.interface';
import { StenciAppointmentResponse, StenciPatientResponse } from '../interfaces';
import * as moment from 'moment';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { RawAppointment } from '../../../shared/appointment.service';
import { AppointmentStatus } from '../../../interfaces/appointment.interface';
import { Entity, EntityDocument, ScheduleType, SpecialityEntityDocument } from '../../../entities/schema';
import { StenciApiService } from './stenci-api.service';
import { EntitiesService } from '../../../entities/services/entities.service';
import { EntityType } from '../../../interfaces/entity.interface';

@Injectable()
export class StenciHelpersService {
  private logger = new Logger(StenciHelpersService.name);

  constructor(
    private readonly stenciApiService: StenciApiService,
    private readonly entitiesService: EntitiesService,
  ) {}

  /**
   * Converte um paciente do Stenci para o formato interno
   */
  public replaceStenciPatientToPatient(stenciPatient: StenciPatientResponse): Patient {
    const patient: Patient = {
      bornDate: stenciPatient.birthDate,
      name: stenciPatient.name,
      cpf: stenciPatient.identity?.value,
      sex: stenciPatient.gender === 'male' ? 'M' : 'F',
      code: String(stenciPatient.id),
      email: stenciPatient.email,
      cellPhone: stenciPatient.cellphone,
    };

    return patient;
  }

  /**
   * Converte status do Stenci para status interno
   */
  public convertStenciStatus(stenciStatus: string): AppointmentStatus {
    const statusMap: Record<string, AppointmentStatus> = {
      scheduled: AppointmentStatus.scheduled,
      confirmed: AppointmentStatus.confirmed,
      finished: AppointmentStatus.finished,
      patient_canceled: AppointmentStatus.canceled,
      professional_canceled: AppointmentStatus.canceled,
      missed: AppointmentStatus.canceled,
      waiting: AppointmentStatus.scheduled,
      available: AppointmentStatus.scheduled,
      in_attendance: AppointmentStatus.scheduled,
    };

    return statusMap[stenciStatus] || AppointmentStatus.scheduled;
  }

  /**
   * Converte data e hora do Stenci para formato ISO
   */
  public convertStartDate(date: string, hour: string): string {
    // Ignora timezone: usa moment para formatar sem conversão de fuso
    return moment.parseZone(`${date} ${hour}`, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DD[T]HH:mm:ss');
  }

  /**
   * Cria objeto de agendamento a partir de dados do Stenci
   */
  // public async createPatientAppointmentObject(
  //   integration: IntegrationDocument,
  //   appointment: StenciAppointmentResponse,
  // ): Promise<RawAppointment> {
  //   const appointmentDate = appointment.startDate;

  //   const schedule: RawAppointment = {
  //     appointmentCode: String(appointment.id),
  //     appointmentDate,
  //     status: this.convertStenciStatus(appointment.status),
  //     duration: '0',
  //     doctorId: String(appointment.professional?.id),
  //     insuranceId: String(appointment.insurance?.plan?.id),
  //     organizationUnitId: String(appointment.schedule?.id),
  //   };

  //   try {
  //     const defaultData: Partial<EntityDocument> = {
  //       canSchedule: true,
  //       canReschedule: true,
  //       canCancel: true,
  //       canConfirmActive: true,
  //       canConfirmPassive: true,
  //       canView: true,
  //     };

  //     if (appointment.professional?.id) {
  //       schedule.doctorDefault = {
  //         code: String(appointment.professional.id),
  //         name: appointment.professional.name,
  //         friendlyName: appointment.professional.name,
  //         ...defaultData,
  //       };
  //     }

  //     if (appointment.insurance?.plan?.id) {
  //       schedule.insuranceDefault = {
  //         code: String(appointment.insurance.plan.id),
  //         name: appointment.insurance.plan.name,
  //         friendlyName: appointment.insurance.fullName || appointment.insurance.plan.name,
  //         ...defaultData,
  //       };
  //     }

  //     // Tenta buscar informações da especialidade se houver serviços
  //     try {
  //       if (appointment.services?.[0]) {
  //         const service = appointment.services[0];

  //         if (service.specialty) {
  //           const filter = { code: String(service.specialty) };
  //           const speciality = (await this.entitiesService.getEntity(
  //             EntityType.speciality,
  //             filter as Partial<Entity>,
  //             integration._id,
  //           )) as SpecialityEntityDocument;

  //           if (speciality) {
  //             schedule.appointmentTypeId = speciality.specialityType || ScheduleType.Consultation;
  //             schedule.specialityId = String(speciality._id);
  //             schedule.specialityDefault = {
  //               code: String(speciality.code),
  //               name: String(speciality.name),
  //               friendlyName: String(speciality.friendlyName || speciality.name),
  //               ...defaultData,
  //             };
  //           }
  //         }

  //         // Adiciona o procedimento
  //         schedule.procedureDefault = {
  //           code: String(service.id),
  //           name: service.name,
  //           friendlyName: service.name,
  //           ...defaultData,
  //         };
  //       }
  //     } catch (error) {
  //       this.logger.error('Error fetching speciality for appointment', error);
  //     }
  //   } catch (err) {
  //     this.logger.error('StenciHelpersService.createPatientAppointmentObject', err);
  //   }

  //   return schedule;
  // }

  /**
   * Formata data no padrão do Stenci (YYYY-MM-DD)
   */
  public formatDateForStenci(date: Date | string): string {
    if (typeof date === 'string') {
      // Ignora timezone mantendo a hora/data conforme informada
      const parsed = moment.parseZone(date);
      if (!parsed.isValid()) {
        return moment.parseZone(date, ['DDMMYYYY', 'DD-MM-YYYY', 'DD/MM/YYYY'], true).format('YYYY-MM-DD');
      }
      return parsed.format('YYYY-MM-DD');
    } else {
      // Mantém componentes de tempo sem aplicar conversão de fuso
      return moment.parseZone(date).format('YYYY-MM-DD');
    }
  }

  /**
   * Formata hora no padrão do Stenci (HH:mm)
   */
  public formatTimeForStenci(date: Date | string): string {
    if (typeof date === 'string') {
      return moment.parseZone(date).format('HH:mm');
    }
    return moment.parseZone(date).format('HH:mm');
  }

  /**
   * Valida se um CPF está no formato correto
   */
  public validateCPF(cpf: string): boolean {
    if (!cpf) return false;

    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/[^\d]/g, '');

    // Verifica se tem 11 dígitos
    return cleanCPF.length === 11;
  }

  /**
   * Formata telefone para o padrão do Stenci
   */
  public formatPhoneForStenci(phone: string): string {
    if (!phone) return '';

    // Remove caracteres não numéricos
    return phone.replace(/[^\d]/g, '');
  }
}
