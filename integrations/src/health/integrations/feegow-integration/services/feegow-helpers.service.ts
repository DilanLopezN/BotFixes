import { Injectable } from '@nestjs/common';
import { RawAppointment } from '../../../shared/appointment.service';
import { AppointmentStatus } from '../../../interfaces/appointment.interface';
import { FeegowPatientByCodeResponse, FeegowScheduleResponse } from '../interfaces';
import * as moment from 'moment';
import { Patient } from '../../../interfaces/patient.interface';
import { EntitiesService } from '../../../entities/services/entities.service';
import { EntityType } from '../../../interfaces/entity.interface';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import {
  ProcedureEntityDocument,
  OccupationAreaEntityDocument,
  AppointmentTypeEntityDocument,
  ScheduleType,
} from '../../../entities/schema';
import { castObjectId } from '../../../../common/helpers/cast-objectid';

@Injectable()
export class FeegowHelpersService {
  constructor(private readonly entitiesService: EntitiesService) {}

  public formatScheduleDate(schedule: FeegowScheduleResponse): string {
    const dateFormat = 'YYYY-MM-DDTHH:mm:ss';
    const scheduleHour = moment(schedule.horario, 'HH:mm:ss');
    const scheduleDate = moment(schedule.data.split('-').reverse().join('-'))
      .set({ hours: scheduleHour.hours(), minutes: scheduleHour.minutes(), seconds: scheduleHour.seconds() })
      .format(dateFormat);

    return scheduleDate;
  }

  public async createPatientAppointmentObject(
    integration: IntegrationDocument,
    schedule: FeegowScheduleResponse,
  ): Promise<RawAppointment> {
    const rawSchedule: RawAppointment = {
      appointmentCode: String(schedule.agendamento_id),
      appointmentDate: this.formatScheduleDate(schedule),
      duration: '-1',
      procedureId: String(schedule.procedimento_id),
      doctorId: String(schedule.profissional_id),
      organizationUnitId: String(schedule.unidade_id),
      // particular é -1 default
      insuranceId: String(schedule.convenio_id ?? '-1'),
      status: AppointmentStatus.scheduled,
      specialityId: String(schedule.especialidade_id),
    };

    const defaultData = await this.getDefaultDataFromSchedule(integration, schedule);

    if (defaultData?.appointmentType) {
      rawSchedule.appointmentTypeId = defaultData.appointmentType;
    }

    if (defaultData?.speciality) {
      rawSchedule.specialityId = defaultData.speciality;
    }

    if (defaultData?.occupationArea) {
      rawSchedule.occupationAreaId = defaultData.occupationArea;
    }

    return rawSchedule;
  }

  public async getDefaultDataFromSchedule(
    integration: IntegrationDocument,
    schedule: FeegowScheduleResponse,
  ): Promise<{ [key in EntityType]?: string }> {
    try {
      const optionalData: { [key in EntityType]?: string } = {};

      if (schedule.procedimento_id) {
        // procedimento tem o id do tipo de agendamento no specialityType
        const procedureEntity = (await this.entitiesService.getEntityByCode(
          String(schedule.procedimento_id),
          EntityType.procedure,
          integration._id,
        )) as ProcedureEntityDocument;

        if (procedureEntity) {
          optionalData.appointmentType = procedureEntity.specialityType;
          optionalData.speciality = procedureEntity.specialityCode;

          // Se o cliente utiliza area de atuação remove a especialidade
          const occupationAreaEntity = (await this.entitiesService.getCollection(EntityType.occupationArea).findOne({
            integrationId: castObjectId(integration._id),
            canView: true,
            $or: [
              {
                'references.refId': { $in: [String(procedureEntity._id)] },
                'references.type': EntityType.procedure,
              },
            ],
          })) as OccupationAreaEntityDocument;

          if (occupationAreaEntity) {
            optionalData.occupationArea = occupationAreaEntity.code;

            const apointmentType = (await this.entitiesService.getEntityByCode(
              String(procedureEntity.specialityType),
              EntityType.appointmentType,
              integration._id,
            )) as AppointmentTypeEntityDocument;

            if (apointmentType.params.referenceScheduleType === ScheduleType.Exam) {
              delete optionalData.speciality;
            }
          }
        }

        return optionalData;
      }
    } catch (error) {}
  }

  public replacePatient(result: FeegowPatientByCodeResponse, patientCode: string): Patient {
    const { documentos } = result;

    const getGender = (): string => {
      if (result.sexo === 'Masculino') {
        return 'M';
      }

      if (result.sexo === 'Feminino') {
        return 'F';
      }

      return 'U';
    };

    const phone = result.telefones?.[0] ?? result.telefones?.[1];
    const cellPhone = result.telefones?.[1] ?? result.telefones?.[0];

    return {
      phone: phone?.replace(/[^\d]/g, '') ?? '',
      cellPhone: cellPhone?.replace(/[^\d]/g, '') ?? '',
      email: result.email?.[0] ?? result.email?.[1] ?? '',
      name: result.nome.trim(),
      sex: getGender(),
      code: patientCode,
      cpf: documentos.cpf,
      bornDate: result.nascimento?.split('-').reverse().join('-') ?? '',
      identityNumber: documentos.rg,
    };
  }
}
