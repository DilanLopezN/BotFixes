import { Injectable, Logger } from '@nestjs/common';
import { Patient } from '../../../interfaces/patient.interface';
import { ClinicCreatePatientResponse, ClinicPatientResponse, ClinicSchedule } from '../interfaces';
import * as moment from 'moment';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { RawAppointment } from '../../../shared/appointment.service';
import { AppointmentStatus } from '../../../interfaces/appointment.interface';
import { Entity, EntityDocument, ScheduleType, SpecialityEntityDocument } from '../../../entities/schema';
import { ClinicApiService } from './clinic-api.service';
import { EntitiesService } from 'health/entities/services/entities.service';
import { EntityType } from 'health/interfaces/entity.interface';

@Injectable()
export class ClinicHelpersService {
  private logger = new Logger(ClinicHelpersService.name);

  constructor(
    private readonly clinicApiService: ClinicApiService,
    private readonly entitiesService: EntitiesService,
  ) {}

  public replaceClinicPatientToPatient(clinicPatient: ClinicPatientResponse | ClinicCreatePatientResponse): Patient {
    const formattedDate = clinicPatient.birthday?.split('/').reverse().join('-');
    const patient: Patient = {
      bornDate: moment(formattedDate).format('YYYY-MM-DD'),
      name: clinicPatient.name,
      cpf: String(clinicPatient.nin),
      sex: clinicPatient.sex,
      code: String(clinicPatient.id),
      email: clinicPatient.email,
      cellPhone: clinicPatient.mobile,
    };

    return patient;
  }

  /**
   * @param date 30/11/2022
   * @param startAppointmentHour 13:00:00:000
   * @returns string
   */
  public convertStartDate(date: string, startAppointmentHour: string): string {
    const formatAppointmentDate = 'YYYY-MM-DDTHH:mm:ss';
    const [hours, minutes] = startAppointmentHour.split(':');
    const formattedDate = moment(date.split('/').reverse().join('-'));

    return moment(formattedDate)
      .set({ hours: parseInt(hours, 10), minutes: parseInt(minutes, 10) })
      .format(formatAppointmentDate);
  }

  public async createPatientAppointmentObject(
    integration: IntegrationDocument,
    appointment: ClinicSchedule,
  ): Promise<RawAppointment> {
    const appointmentDate = this.convertStartDate(appointment.date_schedule, appointment.hour_schedule);

    const schedule: RawAppointment = {
      appointmentCode: String(appointment.id),
      appointmentDate,
      status: AppointmentStatus.scheduled,
      duration: '0',
      doctorId: String(appointment.doctor_id),
      insuranceId: String(appointment.healthInsuranceID),
      organizationUnitId: String(1),
    };

    try {
      const defaultData: Partial<EntityDocument> = {
        canSchedule: true,
        canReschedule: true,
        canCancel: true,
        canConfirmActive: true,
        canConfirmPassive: true,
        canView: true,
      };

      if (appointment.doctor_id) {
        schedule.doctorDefault = {
          code: String(appointment.doctor_id),
          name: appointment.doctor,
          friendlyName: appointment.doctor,
          ...defaultData,
        };
      }

      if (appointment.healthInsuranceID) {
        schedule.insuranceDefault = {
          code: String(appointment.healthInsuranceID),
          name: appointment.healthInsurance,
          friendlyName: appointment.healthInsurance,
          ...defaultData,
        };
      }

      try {
        if (appointment.doctor_id) {
          const response = await this.clinicApiService.getDoctor(integration, {
            doctorCode: String(appointment.doctor_id),
          });

          if (response?.result?.specialty_id) {
            const filter = { 'data.cbo': String(response?.result?.specialty_id) };
            const speciality = (await this.entitiesService.getEntity(
              EntityType.speciality,
              filter as Partial<Entity>,
              integration._id,
            )) as SpecialityEntityDocument;

            if (speciality) {
              schedule.appointmentTypeId = speciality.specialityType || ScheduleType.Consultation;
              schedule.specialityId = String(speciality._id);
              schedule.specialityDefault = {
                code: String(speciality.code),
                name: String(speciality.name),
                friendlyName: String(speciality.friendlyName || speciality.name),
                ...defaultData,
              };
            }
          }
        }
      } catch (error) {}
    } catch (err) {
      this.logger.error('ClinicHelpersService.createPatientApointmentObject', err);
    }

    return schedule;
  }
}
