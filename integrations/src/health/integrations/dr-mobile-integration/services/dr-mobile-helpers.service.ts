import { Injectable, Logger } from '@nestjs/common';
import { Patient } from '../../../interfaces/patient.interface';
import { onlyNumbers } from '../../../../common/helpers/format-cpf';
import { DrMobilePatient, DrMobilePatientSchedule } from '../interfaces/patient.interface';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { RawAppointment } from '../../../shared/appointment.service';
import { AppointmentStatus } from '../../../interfaces/appointment.interface';
import { EntityDocument, ScheduleType } from '../../../entities/schema';
import * as moment from 'moment';

interface CompositeProcedureCodeData {
  code: string;
  specialityCode?: string;
  specialityType?: string;
}

@Injectable()
export class DrMobileHelpersService {
  private logger = new Logger(DrMobileHelpersService.name);

  public replaceDrMobilePatientToPatient(drMobilePatient: DrMobilePatient): Patient {
    const patient: Patient = {
      bornDate: drMobilePatient.dtNascimento,
      name: drMobilePatient.nmPaciente,
      cpf: onlyNumbers(drMobilePatient.nrCpf),
      sex: drMobilePatient.tpSexo,
      code: String(drMobilePatient.cdPaciente),
    };

    return patient;
  }

  public async createPatientAppointmentObject(
    _: IntegrationDocument,
    appointment: DrMobilePatientSchedule,
  ): Promise<RawAppointment> {
    const schedule: RawAppointment = {
      appointmentCode: String(appointment.cd_it_agenda_central),
      appointmentDate: appointment.hr_agenda,
      status: AppointmentStatus.scheduled,
      duration: '0',
      doctorId: appointment.prestador?.cdPrestador,
      organizationUnitId: appointment.prestador?.multiEmpresa?.cdMultiEmpresa,
      procedureId: null,
      specialityId: appointment.codigo_servico,
      insuranceId: appointment.convenio?.codigo_convenio,
      appointmentTypeId: null,
    };

    if (appointment.item_agendamento?.tipo_item) {
      schedule.appointmentTypeId =
        appointment.item_agendamento?.tipo_item === 'A' ? ScheduleType.Consultation : ScheduleType.Exam;
    }

    if (appointment.item_agendamento?.codigo_item && appointment.codigo_servico && schedule.appointmentTypeId) {
      schedule.procedureId = this.createCompositeProcedureCode(
        appointment.item_agendamento?.codigo_item,
        appointment.codigo_servico,
        schedule.appointmentTypeId,
      );
    }

    try {
      const defaultData: Partial<EntityDocument> = {
        canSchedule: true,
        canReschedule: true,
        canCancel: true,
        canConfirmActive: true,
        canConfirmPassive: true,
        canView: true,
      };

      if (appointment.prestador?.nmPrestador) {
        schedule.doctorDefault = {
          code: String(-1),
          name: appointment.prestador.nmPrestador,
          friendlyName: appointment.prestador.nmPrestador,
          ...defaultData,
        };
      }

      if (appointment.prestador?.multiEmpresa?.dsMultiEmpresa) {
        schedule.organizationUnitDefault = {
          code: String(-1),
          name: appointment.prestador.multiEmpresa.dsMultiEmpresa,
          friendlyName: appointment.prestador.multiEmpresa.dsMultiEmpresa,
          ...defaultData,
        };
      }

      if (appointment.item_agendamento?.descricao_item) {
        schedule.procedureDefault = {
          code: String(-1),
          name: appointment.item_agendamento.descricao_item,
          friendlyName: appointment.item_agendamento.descricao_item,
          ...defaultData,
        };
      }

      if (appointment.desc_servico) {
        schedule.specialityDefault = {
          code: String(-1),
          name: appointment.desc_servico,
          friendlyName: appointment.desc_servico,
          ...defaultData,
        };
      }
    } catch (err) {
      this.logger.error('DrMobileHelpersService.createPatientApointmentObject', err);
    }

    return schedule;
  }

  public convertDate(date: string): string {
    const formatDate = 'YYYY-MM-DDTHH:mm:ss';

    const [partDate, partTime] = date.split(' ');

    const startTime = partTime.split(':');
    const dateParts = partDate.split('/');

    if (dateParts[2].length <= 2) {
      dateParts[2] = `20${dateParts[2]}`;
    }

    const formattedDate = dateParts.reverse().join('-');

    return moment
      .utc(formattedDate)
      .set('hour', Number(startTime[0]))
      .set('minute', Number(startTime[1]))
      .format(formatDate);
  }

  private getCompositeProcedureIdentifiers(): string[] {
    return ['c', 's', 'st'];
  }

  public createCompositeProcedureCode(code: string, specialityCode: string, specialityType: string): string {
    const [i0, i1, i2] = this.getCompositeProcedureIdentifiers();

    const pCode = `${code}`;
    const sCode = specialityCode ? `${specialityCode}` : '';
    const sType = specialityType ? `${specialityType}` : '';

    return `${i0}${pCode}:${i1}${sCode}:${i2}${sType}`;
  }

  public getCompositeProcedureCode(code: string): CompositeProcedureCodeData {
    const identifiers = this.getCompositeProcedureIdentifiers();
    const parts = code.split(':').map((occ, index) => {
      const identifier = identifiers[index];
      return occ.replace(identifier, '');
    });

    return {
      code: parts?.[0],
      specialityCode: parts?.[1],
      specialityType: parts?.[2],
    };
  }
}
