import { Injectable } from '@nestjs/common';
import { IIntegration } from '../../../integration/interfaces/integration.interface';
import { Patient as BotdesignerPatient, PatientSchedule, ScheduleStatus } from 'kissbot-health-core';
import { Patient } from '../../../interfaces/patient.interface';
import { onlyNumbers } from '../../../../common/helpers/format-cpf';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { RawAppointment } from '../../../shared/appointment.service';
import { AppointmentStatus } from '../../../interfaces/appointment.interface';
import { TypeOfService } from '../../../entities/schema';
import { Types } from 'mongoose';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';

interface CompositeProcedureCodeData {
  code: string;
  areaCode?: string;
  lateralityCode?: string;
  specialityCode?: string;
  specialityType?: string;
}

interface CompositeSpecialityCodeData {
  code: string;
  specialityType?: string;
}

interface CompositeSubPlanCodeData {
  code: string;
  insurancePlanCode?: string;
  insuranceCode?: string;
}

@Injectable()
export class BotdesignerHelpersService {
  private getCompositeProcedureIdentifiers(): string[] {
    return ['c', 's', 'st', 'a', 'l'];
  }

  private getCompositeSpecialityIdentifiers(): string[] {
    return ['c', 'st'];
  }

  private getCompositeSubPlanIdentifiers(): string[] {
    return ['c', 's', 'i'];
  }

  private getCompositePlanCategoryIdentifiers(): string[] {
    return ['c', 'i'];
  }

  private getCompositePlanIdentifiers(): string[] {
    return ['c', 'i'];
  }

  public createCompositeProcedureCode(
    _: IIntegration,
    code: string,
    specialityCode: string,
    specialityType: string,
    areaCode: string,
    lateralityCode: string,
  ): string {
    const [i0, i1, i2, i3, i4] = this.getCompositeProcedureIdentifiers();

    const pCode = `${code}`;
    const aCode = areaCode ? `${areaCode}` : '';
    const lCode = lateralityCode ? `${lateralityCode}` : '';
    const sCode = specialityCode ? `${specialityCode}` : '';
    const sType = specialityType ? `${specialityType}` : '';

    return `${i0}${pCode}:${i1}${sCode}:${i2}${sType}:${i3}${aCode}:${i4}${lCode}`;
  }

  public getCompositeProcedureCode(_: IIntegration, code = ''): CompositeProcedureCodeData {
    const identifiers = this.getCompositeProcedureIdentifiers();
    const parts = code?.split(':').map((occ, index) => {
      const identifier = identifiers[index];
      return occ.replace(identifier, '');
    });

    return {
      code: parts?.[0],
      specialityCode: parts?.[1],
      specialityType: parts?.[2],
      areaCode: parts?.[3],
      lateralityCode: parts?.[4],
    };
  }

  public createCompositeSpecialityCode(_: IIntegration, code: string, specialityType: string): string {
    const [i0, i1] = this.getCompositeSpecialityIdentifiers();

    const sCode = `${code}`;
    const sType = specialityType ? `${specialityType}` : '';

    return `${i0}${sCode}:${i1}${sType}`;
  }

  public getCompositeSpecialityCode(_: IIntegration, code = ''): CompositeSpecialityCodeData {
    const identifiers = this.getCompositeSpecialityIdentifiers();
    const parts = code?.split(':').map((occ, index) => {
      const identifier = identifiers[index];
      return occ.replace(identifier, '');
    });

    return {
      code: parts?.[0],
      specialityType: parts?.[1],
    };
  }

  public createCompositeSubPlanCode(
    _: IIntegration,
    code: string,
    insurancePlanCode: string,
    insuranceCode: string,
  ): string {
    const [i0, i1, i2] = this.getCompositeSubPlanIdentifiers();

    const subPlanCode = `${code}`;
    const planCode = insurancePlanCode ? `${insurancePlanCode}` : '';
    const insCode = insuranceCode ? `${insuranceCode}` : '';

    return `${i0}${subPlanCode}:${i1}${planCode}:${i2}${insCode}`;
  }

  public getCompositePlanCategoryCode(_: IIntegration, code = ''): CompositeSubPlanCodeData {
    const identifiers = this.getCompositePlanCategoryIdentifiers();
    const parts = code?.split(':').map((occ, index) => {
      const identifier = identifiers[index];
      return occ.replace(identifier, '');
    });

    return {
      code: parts?.[0],
      insuranceCode: parts?.[1],
    };
  }

  public createCompositePlanCategoryCode(_: IIntegration, code: string, insuranceCode: string): string {
    const [i0, i1] = this.getCompositePlanCategoryIdentifiers();

    const categoryCode = `${code}`;
    const insCode = insuranceCode ? `${insuranceCode}` : '';

    return `${i0}${categoryCode}:${i1}${insCode}`;
  }

  public getCompositeSubPlanCode(_: IIntegration, code = ''): CompositeSubPlanCodeData {
    const identifiers = this.getCompositeSubPlanIdentifiers();
    const parts = code?.split(':').map((occ, index) => {
      const identifier = identifiers[index];
      return occ.replace(identifier, '');
    });

    return {
      code: parts?.[0],
      insurancePlanCode: parts?.[1],
      insuranceCode: parts?.[2],
    };
  }

  public createCompositePlanCode(_: IIntegration, code: string, insuranceCode: string): string {
    const [i0, i1] = this.getCompositePlanIdentifiers();

    const planCode = `${code}`;
    const insCode = insuranceCode ? `${insuranceCode}` : '';

    return `${i0}${planCode}:${i1}${insCode}`;
  }

  public getCompositePlanCode(_: IIntegration, code = ''): CompositeSubPlanCodeData {
    const identifiers = this.getCompositePlanIdentifiers();
    const parts = code?.split(':').map((occ, index) => {
      const identifier = identifiers[index];
      return occ.replace(identifier, '');
    });

    return {
      code: parts?.[0],
      insuranceCode: parts?.[1],
    };
  }

  public replaceBotdesignerPatientToPatient(botdesignerPatient: BotdesignerPatient): Patient {
    const patient: Patient = {
      bornDate: botdesignerPatient.bornDate,
      name: botdesignerPatient.name,
      cpf: onlyNumbers(botdesignerPatient.cpf),
      sex: botdesignerPatient.sex,
      code: String(botdesignerPatient.code),
      cellPhone: botdesignerPatient.cellPhone,
      email: botdesignerPatient.email,
      phone: botdesignerPatient.phone,
    };

    return patient;
  }

  private getIsFollowUp(typeOfServiceCode: string): boolean {
    return typeOfServiceCode === 'R';
  }

  private getBotdesignerScheduleStatus(appointment: PatientSchedule): AppointmentStatus {
    switch (appointment.scheduleStatus) {
      case ScheduleStatus.confirmed:
        return AppointmentStatus.confirmed;

      case ScheduleStatus.scheduled:
        return AppointmentStatus.scheduled;

      case ScheduleStatus.canceled:
        return AppointmentStatus.canceled;

      case ScheduleStatus.finished:
        return AppointmentStatus.finished;

      default:
        return AppointmentStatus.scheduled;
    }
  }

  public async createPatientAppointmentObject(
    integration: IntegrationDocument,
    appointment: PatientSchedule,
  ): Promise<RawAppointment> {
    const procedureCode = this.createCompositeProcedureCode(
      integration,
      appointment.procedureCode,
      appointment.specialityCode,
      appointment.appointmentTypeCode,
      null,
      appointment.handedness || this.getHandedness(integration._id),
    );

    const specialityCode = this.createCompositeSpecialityCode(
      integration,
      appointment.specialityCode,
      appointment.appointmentTypeCode,
    );

    const schedule: RawAppointment = {
      appointmentCode: String(appointment.scheduleCode),
      appointmentDate: appointment.scheduleDate,
      status: this.getBotdesignerScheduleStatus(appointment),
      duration: '0',
      appointmentTypeId: appointment.appointmentTypeCode,
      doctorId: appointment.doctorCode,
      insuranceId: appointment.insuranceCode,
      insurancePlanId: appointment.insurancePlanCode,
      insuranceSubPlanId: appointment.insurancePlanCode,
      planCategoryId: appointment.insuranceCategoryCode,
      procedureId: procedureCode,
      organizationUnitId: appointment.organizationUnitCode,
      specialityId: specialityCode,
      typeOfServiceId: appointment.typeOfServiceCode,
      guidance: appointment.guidance,
      observation: appointment.observation,
      isFollowUp: this.getIsFollowUp(appointment.typeOfServiceCode),
      organizationUnitAdress: appointment.organizationUnitAddress,
      organizationUnitLocationId: appointment.organizationUnitLocationCode,
      occupationAreaId: appointment.occupationAreaCode,
      data: {
        appointmentTypeCode: appointment.appointmentTypeCode,
      },
    };

    return schedule;
  }

  public typeOfServiceToBotdesignerTypeOfService(type: TypeOfService): string {
    return {
      [TypeOfService.followUp]: 'R',
    }[type];
  }

  public getHandedness(integrationId: Types.ObjectId): string {
    // Temporário para unimed tubarão, dona helena, bluimagem lateralidade
    return ['64dbc11168d29200082474fe', '64d28fbc4942f5000830ada4', '663984c8713cc3dac0200394'].includes(
      castObjectIdToString(integrationId),
    )
      ? 'N'
      : null;
  }
}
