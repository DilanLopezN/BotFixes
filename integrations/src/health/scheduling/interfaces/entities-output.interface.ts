export interface DefaultEntitiesOutput {
  code: string;
  name: string;
}

export interface AppointmentTypeOutput extends DefaultEntitiesOutput {
  referenceScheduleType: string;
}

export interface DoctorOutput extends DefaultEntitiesOutput {}

export interface InsuranceOutput extends DefaultEntitiesOutput {
  isParticular: boolean;
  showProcedureValue: boolean;
}

export interface InsurancePlanOutput extends DefaultEntitiesOutput {
  insuranceCode: string;
}

export interface InsuranceSubPlanOutput extends DefaultEntitiesOutput {
  insuranceCode: string;
}

export interface OccupationAreaOutput extends DefaultEntitiesOutput {}

export interface OrganizationUnitOutput extends DefaultEntitiesOutput {}

export interface OrganizationUnitLocationOutput extends DefaultEntitiesOutput {}

export interface PlanCategoryOutput extends DefaultEntitiesOutput {}

export interface ProcedureOutput extends DefaultEntitiesOutput {
  specialityType: string;
  specialityCode: string;
}

export interface SpecialityOutput extends DefaultEntitiesOutput {
  specialityType: string;
}

export interface TypeOfServiceOutput extends DefaultEntitiesOutput {}
