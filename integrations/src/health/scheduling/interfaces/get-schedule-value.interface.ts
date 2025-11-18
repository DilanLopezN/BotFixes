export interface GetScheduleValueInput {
  insuranceCode: string;
  insurancePlanCode?: string;
  insuranceSubPlanCode?: string;
  planCategoryCode?: string;
  procedureCode: string;
  specialityCode: string;
  specialityType: string;
  doctorCode?: string;
  appontmentTypeCode?: string;
  organizationUnitCode?: string;
  scheduleCode?: string;
  data?: any;
}

export interface GetScheduleValueOutput {
  currency: string;
  value: string;
}
