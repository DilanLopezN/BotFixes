import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { EntityDocument, ScheduleType } from '../../../entities/schema';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { AppointmentStatus } from '../../../interfaces/appointment.interface';
import { Patient } from '../../../interfaces/patient.interface';
import { RawAppointment } from '../../../shared/appointment.service';
import { ObjectInterface } from '../interfaces/default.interface';
import { AmigoPatientDefaultWithId, AmigoPatientScheduleResponse } from '../interfaces/base-register.interface';

@Injectable()
export class AmigoHelpersService {
  public replaceAmigoPatientToPatient(patient: AmigoPatientDefaultWithId): Patient {
    return {
      code: String(patient.id),
      cpf: patient.cpf,
      name: patient.name,
      bornDate: patient.born,
      cellPhone: patient.contact_cellphone,
      email: patient.email,
      sex: 'I',
    };
  }

  public filterBlankParams(obj: ObjectInterface): any {
    return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v != null));
  }

  public createPatientAppointmentObject(
    _: IntegrationDocument,
    appointments: AmigoPatientScheduleResponse['data'],
  ): RawAppointment[] {
    return appointments.map((appointment) => {
      const rawAppointment: RawAppointment = {
        appointmentCode: String(appointment.id),
        appointmentDate: appointment.start_date,
        status: AppointmentStatus[appointment.status] || '',
        duration: String(moment(appointment.end_date).diff(appointment.start_date, 'minutes')),
        doctorId: String(appointment.user?.id),
        organizationUnitId: String(appointment.place?.id),
        procedureId: String(appointment.event_id),
        specialityId: null,
        insuranceId: String(appointment.insurance_id),
        appointmentTypeId: ScheduleType.Consultation,
      };

      const defaultData: Partial<EntityDocument> = {
        canSchedule: true,
        canReschedule: true,
        canCancel: true,
        canConfirmActive: true,
        canConfirmPassive: true,
        canView: true,
      };

      if (appointment.user?.id) {
        rawAppointment.doctorDefault = {
          code: String(appointment.user.id),
          name: appointment.user.name,
          friendlyName: appointment.user.name,
          ...defaultData,
        };
      }

      if (appointment.place?.id) {
        rawAppointment.organizationUnitDefault = {
          code: String(appointment.place?.id),
          name: appointment.place.name,
          friendlyName: appointment.place.prefix,
          ...defaultData,
        };
      }

      if (appointment.agenda_event?.id) {
        rawAppointment.procedureDefault = {
          code: String(appointment.agenda_event.id),
          name: appointment.agenda_event.name,
          friendlyName: appointment.agenda_event.name,
          ...defaultData,
        };

        rawAppointment.specialityDefault = {
          code: String(-1),
          name: appointment.agenda_event.name,
          friendlyName: appointment.agenda_event.name,
          ...defaultData,
        };
      }

      return rawAppointment;
    });
  }
}
