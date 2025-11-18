import { Injectable } from '@nestjs/common';
import { Patient } from '../../../interfaces/patient.interface';
import { RawAppointment } from '../../../shared/appointment.service';
import { AppointmentStatus } from '../../../interfaces/appointment.interface';
import { TdsaGetPatient, TdsaPatientAppointment } from '../interfaces';
import * as moment from 'moment';

@Injectable()
export class TdsaHelpersService {
  public getPatientSexToTdsa = (patient: Patient) => {
    if (patient.sex === 'F') {
      return 'Feminino';
    }

    if (patient.sex === 'M') {
      return 'Masculino';
    }

    return 'NaoInformado';
  };

  public getStatusFromTdsaSchedule(schedule: TdsaPatientAppointment): AppointmentStatus {
    switch (schedule.Status) {
      case 3:
        return AppointmentStatus.scheduled;

      case 2:
        return AppointmentStatus.confirmed;

      default:
        return AppointmentStatus.scheduled;
    }
  }

  public createPatientAppointmentObject(schedule: TdsaPatientAppointment): RawAppointment {
    return {
      appointmentCode: String(schedule.IdAgendamento),
      appointmentDate: schedule.Data,
      status: this.getStatusFromTdsaSchedule(schedule),
      duration: '0',
      doctorId: String(schedule.IdProfissional),
      insuranceId: String(schedule.IdConvenio),
      procedureId: String(schedule.IdProcedimento),
      insurancePlanId: String(schedule.IdPlano),
      organizationUnitId: String(schedule.IdUnidade),
      specialityId: String(schedule.IdEspecialidade),
    };
  }

  public replacePatient(result: TdsaGetPatient): Patient {
    const getSex = () => {
      if (result.Sexo === 2) {
        return 'F';
      }
      if (result.Sexo === 1) {
        return 'M';
      }

      return 'U';
    };

    const bornDate = moment(result.DataNascimento);

    return {
      phone: result.Telefone ?? result.Celular ?? '',
      email: result.Email ?? '',
      name: result.Nome?.trim() ?? '',
      socialName: result?.NomeSocial?.trim() ?? '',
      sex: getSex(),
      code: String(result.Id),
      cpf: result.CPF?.replace(/[^0-9]+/g, '') ?? '',
      bornDate: bornDate.isValid() ? bornDate.format('YYYY-MM-DD') : '',
      cellPhone: result.Celular ?? result.Telefone ?? '',
      identityNumber: result.RG ?? '',
    };
  }
}
