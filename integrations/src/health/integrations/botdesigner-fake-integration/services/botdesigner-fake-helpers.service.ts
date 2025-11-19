import { Injectable } from '@nestjs/common';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { Patient } from '../../../interfaces/patient.interface';
import { RawAppointment } from '../../../shared/appointment.service';
import { AppointmentStatus } from '../../../interfaces/appointment.interface';
import { FakePatientData, ScheduledAppointment } from '../interface/entities';

@Injectable()
export class BotdesignerFakeHelpersService {
  replaceBotdesignerPatientToPatient(botdesignerPatient: FakePatientData): Patient {
    return {
      code: botdesignerPatient.code,
      name: botdesignerPatient.name,
      cpf: botdesignerPatient.cpf,
      phone: botdesignerPatient.phone,
      cellPhone: botdesignerPatient.cellPhone || botdesignerPatient.phone,
      email: botdesignerPatient.email,
      bornDate: botdesignerPatient.bornDate,
      sex: botdesignerPatient.sex,
      motherName: botdesignerPatient.motherName,
      height: botdesignerPatient.height,
      weight: botdesignerPatient.weight,
      skinColor: botdesignerPatient.skinColor,
    };
  }

  async createPatientAppointmentObject(
    integration: IntegrationDocument,
    schedule: ScheduledAppointment,
  ): Promise<RawAppointment> {
    return {
      appointmentTypeId: schedule.appointmentTypeCode,
      insuranceId: schedule.insuranceCode,
      appointmentCode: schedule.scheduleCode,
      duration: schedule.duration?.toString() || '30',
      appointmentDate: schedule.scheduleDate,
      status: this.mapScheduleStatus(schedule.status),
      doctorId: schedule.doctorCode,
      organizationUnitId: schedule.organizationUnitCode,
      specialityId: schedule.specialityCode,
      typeOfServiceId: schedule.typeOfServiceCode,
      occupationAreaId: schedule.occupationAreaCode,
      organizationUnitAdress: schedule.data?.endereco,
    };
  }

  private mapScheduleStatus(status: string): AppointmentStatus {
    switch (status) {
      case 'confirmed':
        return AppointmentStatus.confirmed;
      case 'cancelled':
        return AppointmentStatus.canceled;
      case 'scheduled':
      default:
        return AppointmentStatus.scheduled;
    }
  }
}
