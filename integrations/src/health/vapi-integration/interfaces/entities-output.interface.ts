export interface DefaultEntitiesOutput {
  code: string;
  name: string;
}

export interface DoctorOutput extends DefaultEntitiesOutput {}

export interface InsuranceOutput extends DefaultEntitiesOutput {
  // isParticular: boolean;
  // showProcedureValue: boolean;
}

export interface OrganizationUnitOutput extends DefaultEntitiesOutput {}
