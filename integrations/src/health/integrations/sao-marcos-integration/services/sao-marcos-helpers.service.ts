import { Injectable } from '@nestjs/common';
import { normalize } from '../../../../common/helpers/normalize-text.helper';
import { RawAppointment } from '../../../shared/appointment.service';
import { CreatePatient } from '../../../integrator/interfaces/create-patient.interface';
import { UpdatePatient } from '../../../integrator/interfaces/update-patient.interface';
import { AppointmentStatus } from '../../../interfaces/appointment.interface';
import { Patient } from '../../../interfaces/patient.interface';
import {
  SaoMarcosCreatePatienResponse,
  SaoMarcosCreatePatient,
  SaoMarcosPatientSchedulesResponse,
  SaoMarcosUpdatePatient,
  SaoMarcosUpdatePatientResponse,
} from '../interfaces';

interface CompositeProcedureCodeData {
  code: string;
  specialityCode?: string;
  specialityType?: string;
}

@Injectable()
export class SaoMarcosHelpersService {
  public createPatientPayload({
    patient,
  }: CreatePatient | UpdatePatient): SaoMarcosCreatePatient | SaoMarcosUpdatePatient {
    const payload: SaoMarcosCreatePatient = {
      nome: normalize(patient.name, true),
      dataNascimento: patient.bornDate,
      cpf: patient.cpf,
      telefones: [],
      genero: patient.sex,
    };

    if (patient.cellPhone) {
      const cellPhone = patient.cellPhone.match(/\d+/g)?.join('');

      payload.telefones.push({
        ddd: cellPhone.slice(0, 2),
        numero: cellPhone.slice(2, cellPhone.length),
        tipo: 1,
      });
    }

    if (patient.phone) {
      const phone = patient.phone?.match(/\d+/g).join('');

      payload.telefones.push({
        ddd: phone.slice(0, 2),
        numero: phone.slice(2, phone.length),
        tipo: 0,
      });
    }

    if (patient.email) {
      payload.email = patient.email;
    }

    return payload;
  }

  public replaceSaoMarcosPatient = (
    result: SaoMarcosCreatePatienResponse | SaoMarcosUpdatePatientResponse,
  ): Patient => {
    if (!result?.codigo) {
      return undefined;
    }

    const patient: Patient = {
      code: result.codigo,
      email: result.email,
      sex: result.genero,
      name: result.nome,
      bornDate: result.dataNascimento,
      cpf: result.cpf,
      cellPhone: '',
      phone: '',
    };

    result.telefones?.forEach((phone) => {
      if (phone.numero && phone.ddd) {
        if (phone.tipo === 1) {
          patient.cellPhone = phone.ddd + phone.numero;
        } else if (phone.tipo === 0) {
          patient.phone = phone.ddd + phone.numero;
        }
      }
    });

    return patient;
  };

  public createPatientAppointmentObject(schedule: SaoMarcosPatientSchedulesResponse): RawAppointment {
    // não tem procedimento, são marcos informou que só especialidade fica vinculada ao agendamento
    return {
      appointmentCode: schedule.codigoAtendimento,
      appointmentDate: schedule.horario.dataHoraAgendamento,
      duration: '-1',
      doctorId: schedule.codigoMedico,
      // contem apenas uma unidade, ficou fixo mesmo
      organizationUnitId: '1',
      specialityId: schedule.codigoEspecialidade,
      insuranceId: schedule.codigoConvenio,
      status: AppointmentStatus.scheduled,
    };
  }

  public createCompositeProcedureCode(code: string, specialityCode: string, specialityType: string): string {
    const pCode = `${code}`;
    const sCode = specialityCode ? `${specialityCode}` : '';
    const sType = specialityType ? `${specialityType}` : '';

    return `c${pCode}:s${sCode}:st${sType}`;
  }

  public getCompositeProcedureCode(code: string): CompositeProcedureCodeData {
    const parts = code.split(':').map((occ) => occ?.substring(1) ?? '');

    return {
      code: parts?.[0],
      specialityCode: parts?.[1],
      specialityType: parts?.[2],
    };
  }
}
