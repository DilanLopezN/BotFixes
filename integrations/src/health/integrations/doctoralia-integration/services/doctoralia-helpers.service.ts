import { Injectable, Logger } from '@nestjs/common';
import { RawAppointment } from '../../../shared/appointment.service';
import { AppointmentStatus } from '../../../interfaces/appointment.interface';
import * as moment from 'moment';
import { DoctoraliaConfirmedAppointmentResponse } from '../interfaces/appointment.interface';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import * as crypto from 'crypto';
import { EntitiesService } from '../../../entities/services/entities.service';
import { EntityType } from '../../../interfaces/entity.interface';
import {
  InsurancePlanEntityDocument,
  ProcedureEntity,
  EntityDocument,
  ScheduleType,
  ProcedureEntityDocument,
} from '../../../entities/schema';
import { IIntegration, IntegrationRules } from '../../../integration/interfaces/integration.interface';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';
import { convertPhoneNumber, formatPhone, getNumberWith9 } from '../../../../common/helpers/format-phone';

@Injectable()
export class DoctoraliaHelpersService {
  private readonly logger = new Logger(DoctoraliaHelpersService.name);

  constructor(private readonly entitiesService: EntitiesService) {}

  private getDoctoraliaScheduleStatus(appointment: DoctoraliaConfirmedAppointmentResponse): AppointmentStatus {
    switch (appointment.status_code) {
      case '2':
        return AppointmentStatus.confirmed;

      default:
        return AppointmentStatus.scheduled;
    }
  }

  public async getDefaultDataFromSchedule(
    integration: IntegrationDocument,
    schedule: DoctoraliaConfirmedAppointmentResponse,
  ): Promise<{ [key in EntityType]?: string }> {
    try {
      const optionalData: { [key in EntityType]?: string } = {};

      if (schedule?.activityid) {
        const procedureEntity = (await this.entitiesService.getEntityByCode(
          String(schedule.activityid),
          EntityType.procedure,
          integration._id,
        )) as ProcedureEntityDocument;

        if (procedureEntity?._id) {
          optionalData.appointmentType = procedureEntity.specialityType;
        }

        return optionalData;
      }
    } catch (error) {}
  }

  public async createPatientAppointmentObject(
    reservation: DoctoraliaConfirmedAppointmentResponse,
    integration: IntegrationDocument,
  ): Promise<RawAppointment> {
    const schedule: RawAppointment = {
      appointmentCode: reservation.resid,
      appointmentDate: this.convertStartDate(reservation.start_datetime_timestamp, reservation.startTime),
      duration: reservation.reservation_duration,
      procedureId: reservation.activityid,
      doctorId: reservation.resourceid,
      organizationUnitId: reservation.areaid,
      specialityId: reservation.typologyid,
      insuranceId: reservation.insuranceid,
      status: this.getDoctoraliaScheduleStatus(reservation),
    };

    try {
      const defaultData: Partial<EntityDocument> = {
        canSchedule: false,
        canReschedule: false,
        canCancel: true,
        canConfirmActive: false,
        canConfirmPassive: true,
        canView: true,
      };

      if (reservation.activityid) {
        schedule.procedureDefault = {
          code: String(reservation.activityid),
          name: reservation.activityTitle,
          friendlyName: reservation.activityTitle,
          ...defaultData,
        };
      }

      if (reservation.areaid) {
        schedule.organizationUnitDefault = {
          code: reservation.areaid,
          name: reservation.areaTitle,
          friendlyName: reservation.areaTitle,
          ...defaultData,
        };
      }

      if (reservation.typology_lid) {
        const legacySpecialityCode = reservation.typology_lid;

        if (legacySpecialityCode?.indexOf('E') === 0) {
          schedule.appointmentTypeId = ScheduleType.Consultation;
        } else if (legacySpecialityCode?.indexOf('T') === 0) {
          schedule.appointmentTypeId = ScheduleType.Exam;
        }
      }

      if (reservation.typologyid) {
        const specialityCode = String(reservation.typologyid);

        schedule.specialityDefault = {
          code: specialityCode,
          name: reservation.typologyTitle,
          friendlyName: reservation.typologyTitle,
          ...defaultData,
        };

        schedule.procedureDefault = {
          ...(schedule.procedureDefault ?? {}),
          specialityCode: specialityCode,
        } as Partial<ProcedureEntity>;
      }

      if (reservation.insuranceid) {
        schedule.insuranceDefault = {
          code: reservation.insuranceid,
          name: reservation.insuranceTitle,
          friendlyName: reservation.insuranceTitle,
          ...defaultData,
        };
      }

      if (reservation.resourceid) {
        schedule.doctorDefault = {
          code: String(reservation.resourceid),
          name: reservation.resourceName,
          friendlyName: reservation.resourceName,
          ...defaultData,
        };
      }
    } catch (err) {
      this.logger.error('DoctoraliaHelpersService.createPatientApointmentObject', err);
    }

    // nesse cenário insuranceId é o legacyId da tuotempo, como não recebo este campo na rota
    // de listagem de agendamentos do paciente, consulto o convenio que é o plano do nosso lado
    // e pego o código do convenio que fica vinculado na entidade
    if (this.runSplitInsuranceIntoInsurancePlansRule(integration)) {
      const insurancePlanEntity = (await this.entitiesService.getEntityByCode(
        reservation.insuranceid,
        EntityType.insurancePlan,
        integration._id,
      )) as InsurancePlanEntityDocument;

      if (insurancePlanEntity) {
        schedule.insuranceId = insurancePlanEntity.insuranceCode;
        schedule.insurancePlanId = insurancePlanEntity.code;
        // se usa o split não consigo saber qual o código do convenio do nosso lado
        schedule.insuranceDefault = undefined;
      }
    }

    // No Hospital de olhos do paraná uma especialidade deixou de existir e desta forma acabou impedindo
    // o reagendamento das consultas pois a especialidade não existia mais, acabei fixando tudo para resolver
    // logo o problema do cliente que estava estressado.
    // Desta forma o paciente terá que selecionar novamente a especialidade e procedimento
    if (
      castObjectIdToString(integration._id) === '63a451945d631c00070cbcfb' &&
      (schedule.speciality?.code === 'sc15e7b422ebbcfc' || schedule.specialityDefault?.code === 'sc15e7b422ebbcfc')
    ) {
      delete schedule.specialityId;
      delete schedule.specialityDefault;
      delete schedule.procedureDefault;
      delete schedule.procedureId;
      schedule.appointmentTypeId = ScheduleType.Consultation;
    }

    if (!schedule.appointmentTypeId) {
      try {
        const defaultData = await this.getDefaultDataFromSchedule(integration, reservation);

        if (defaultData?.appointmentType) {
          schedule.appointmentTypeId = defaultData.appointmentType;
        }
      } catch (error) {}
    }

    return schedule;
  }

  public convertStartDate(appointmentTimestamp: number, startAppointmentHour: string): string {
    const formatAppointmentDate = 'YYYY-MM-DDTHH:mm:ss';

    const startTime = startAppointmentHour.split(':');
    return moment(appointmentTimestamp * 1000)
      .set('hour', Number(startTime[0]))
      .set('minute', Number(startTime[1]))
      .format(formatAppointmentDate);
  }

  public getInsuranceCode(insuranceCode: string, insurancePlanCode: string, integration: IntegrationDocument): string {
    if (!this.runSplitInsuranceIntoInsurancePlansRule(integration)) {
      return insuranceCode;
    }

    return insurancePlanCode;
  }

  public createCustomInsuranceId(insuranceCode: string): string {
    return crypto.createHash('md5').update(insuranceCode).digest('hex').slice(0, 16);
  }

  public runSplitInsuranceIntoInsurancePlansRule(integration: IIntegration): boolean {
    return integration.rules?.splitInsuranceIntoInsurancePlans || integration.rules?.splitInsuranceIntoInsurancePlansV2;
  }

  public ruleIsActive(integration: IIntegration, rule: IntegrationRules): boolean {
    return integration.rules?.[rule];
  }

  public normalizePhone(phoneNumb: string, withDDI: boolean): string {
    let convertPhone = convertPhoneNumber(phoneNumb);

    // remove 0 do DDD se tiver
    if (convertPhone.startsWith('550')) {
      // com DDI
      convertPhone = convertPhone.replace('550', '55');
    } else if (convertPhone.startsWith('0')) {
      // sem DDI
      convertPhone = convertPhone.replace('0', '');
    }
    // verifica se é fixo - dos ultimos digitos, pega o primeiro.
    const isFixo = ['2', '3', '4', '5', '6'].includes(convertPhone.slice(-8)[0]);

    // adiciona 9 se necessário apenas para celulares
    const finalNumber = isFixo ? convertPhone : getNumberWith9(convertPhone);
    const formatedPhone = formatPhone(finalNumber, withDDI);

    return formatedPhone;
  }

  public getUseDistinctDoctors(integration: IntegrationDocument): boolean {
    return castObjectIdToString(integration._id) === '65fb96c1f924870504a42749';
  }
}
