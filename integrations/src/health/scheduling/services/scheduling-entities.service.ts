import { Injectable } from '@nestjs/common';
import {
  AppointmentTypeEntityDocument,
  DoctorEntityDocument,
  InsuranceEntityDocument,
  InsurancePlanEntityDocument,
  InsuranceSubPlanEntityDocument,
  OccupationAreaEntityDocument,
  OrganizationUnitEntityDocument,
  OrganizationUnitLocationEntityDocument,
  PlanCategoryEntityDocument,
  ProcedureEntityDocument,
  SpecialityEntityDocument,
  TypeOfServiceEntityDocument,
} from '../../entities/schema';
import {
  AppointmentTypeOutput,
  DoctorOutput,
  InsuranceOutput,
  InsurancePlanOutput,
  InsuranceSubPlanOutput,
  OccupationAreaOutput,
  OrganizationUnitLocationOutput,
  OrganizationUnitOutput,
  PlanCategoryOutput,
  ProcedureOutput,
  SpecialityOutput,
  TypeOfServiceOutput,
} from '../interfaces/entities-output.interface';

@Injectable()
export class SchedulingEntitiesService {
  constructor() {}

  public formatAppointmentTypeOutput(entities: AppointmentTypeEntityDocument[]): AppointmentTypeOutput[] {
    const appointmentTypeOutput: AppointmentTypeOutput[] = [];

    entities.forEach((entity) => {
      appointmentTypeOutput.push({
        code: entity.code,
        name: entity.friendlyName,
        referenceScheduleType: entity.params.referenceScheduleType,
      });
    });

    return appointmentTypeOutput;
  }

  public formatDoctorOutput(entities: DoctorEntityDocument[]): DoctorOutput[] {
    const doctorOutput: DoctorOutput[] = [];

    entities.forEach((entity) => {
      doctorOutput.push({
        code: entity.code,
        name: entity.friendlyName,
      });
    });

    return doctorOutput;
  }

  public formatInsuranceOutput(entities: InsuranceEntityDocument[]): InsuranceOutput[] {
    const insuranceOutput: InsuranceOutput[] = [];

    entities.forEach((entity) => {
      insuranceOutput.push({
        code: entity.code,
        name: entity.friendlyName,
        isParticular: entity.params.isParticular,
        showProcedureValue: entity.params.showAppointmentValue,
      });
    });

    return insuranceOutput;
  }

  public formatInsurancePlanOutput(entities: InsurancePlanEntityDocument[]): InsurancePlanOutput[] {
    const insurancePlanOutput: InsurancePlanOutput[] = [];

    entities.forEach((entity) => {
      insurancePlanOutput.push({
        code: entity.code,
        name: entity.friendlyName,
        insuranceCode: entity.insuranceCode,
      });
    });

    return insurancePlanOutput;
  }

  public formatInsuranceSubplanOutput(entities: InsuranceSubPlanEntityDocument[]): InsuranceSubPlanOutput[] {
    const insuranceSubPlanOutput: InsuranceSubPlanOutput[] = [];

    entities.forEach((entity) => {
      insuranceSubPlanOutput.push({
        code: entity.code,
        name: entity.friendlyName,
        insuranceCode: entity.insuranceCode,
      });
    });

    return insuranceSubPlanOutput;
  }

  public formatOccupationAreaOutput(entities: OccupationAreaEntityDocument[]): OccupationAreaOutput[] {
    const occupationAreaOutput: OccupationAreaOutput[] = [];

    entities.forEach((entity) => {
      occupationAreaOutput.push({
        code: entity.code,
        name: entity.friendlyName,
      });
    });

    return occupationAreaOutput;
  }

  public formatOrganizationUnitOutput(entities: OrganizationUnitEntityDocument[]): OrganizationUnitOutput[] {
    const organizationUnitOutput: OrganizationUnitOutput[] = [];

    entities.forEach((entity) => {
      organizationUnitOutput.push({
        code: entity.code,
        name: entity.friendlyName,
      });
    });

    return organizationUnitOutput;
  }

  public formatOrganizationUnitLocationOutput(
    entities: OrganizationUnitLocationEntityDocument[],
  ): OrganizationUnitLocationOutput[] {
    const organizationUnitLocationOutput: OrganizationUnitLocationOutput[] = [];

    entities.forEach((entity) => {
      organizationUnitLocationOutput.push({
        code: entity.code,
        name: entity.friendlyName,
      });
    });

    return organizationUnitLocationOutput;
  }

  public formatPlanCategoryOutput(entities: PlanCategoryEntityDocument[]): PlanCategoryOutput[] {
    const planCategoryOutput: PlanCategoryOutput[] = [];

    entities.forEach((entity) => {
      planCategoryOutput.push({
        code: entity.code,
        name: entity.friendlyName,
      });
    });

    return planCategoryOutput;
  }

  public formatProcedureOutput(entities: ProcedureEntityDocument[]): ProcedureOutput[] {
    const procedureOutput: ProcedureOutput[] = [];

    entities.forEach((entity) => {
      procedureOutput.push({
        code: entity.code,
        name: entity.friendlyName,
        specialityType: entity.specialityType,
        specialityCode: entity.specialityCode,
      });
    });

    return procedureOutput;
  }

  public formatSpecialityOutput(entities: SpecialityEntityDocument[]): SpecialityOutput[] {
    const specialityOutput: SpecialityOutput[] = [];

    entities.forEach((entity) => {
      specialityOutput.push({
        code: entity.code,
        name: entity.friendlyName,
        specialityType: entity.specialityType,
      });
    });

    return specialityOutput;
  }

  public formatTypeOfServiceOutput(entities: TypeOfServiceEntityDocument[]): TypeOfServiceOutput[] {
    const typeOfServiceOutput: TypeOfServiceOutput[] = [];

    entities.forEach((entity) => {
      typeOfServiceOutput.push({
        code: entity.code,
        name: entity.friendlyName,
      });
    });

    return typeOfServiceOutput;
  }
}
