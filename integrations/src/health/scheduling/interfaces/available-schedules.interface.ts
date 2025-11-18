export enum PeriodOfDay {
  morning = 'morning',
  afternoon = 'afternoon',
  indifferent = 'indifferent',
  night = 'night',
}

export interface ListAvailableSchedulesInput {
  resultsLimit: number;
  fromDaySearch: number;
  untilDaySearch: number;
  periodOfDay: PeriodOfDay;
  specialityCode?: string;
  procedureCode?: string;
  organizationUnitCode?: string;
  insuranceCode?: string;
  insurancePlanCode?: string;
  planCategoryCode?: string;
  doctorCode?: string;
  appointmentTypeCode?: string;
  insuranceSubPlanCode?: string;
  occupationAreaCode?: string;
  organizationUnitLocationCode?: string;
  typeOfServiceCode?: string;
  patientErpCode?: string;
}

export interface ListAvailableSchedulesOutput {
  count: number;
  schedules: {
    scheduleCode: string;
    duration: string;
    scheduleDate: string;
    doctorCode?: string;
    doctorName?: string;
    procedureCode?: string;
    procedureName?: string;
    organizationUnitCode?: string;
    organizationUnitName?: string;
    organizationUnitAdress?: string;
    insuranceCode?: string;
    insuranceName?: string;
    specialityCode?: string;
    specialityName?: string;
    insurancePlanCode?: string;
    insurancePlanName?: string;
    insuranceSubPlanCode?: string;
    insuranceSubPlanName?: string;
    planCategoryCode?: string;
    planCategoryName?: string;
    appointmentTypeCode?: string;
    appointmentTypeName?: string;
    occupationAreaCode?: string;
    occupationAreaName?: string;
    organizationUnitLocationCode?: string;
    organizationUnitLocationName?: string;
    typeOfServiceCode?: string;
    typeOfServiceName?: string;
    guidance?: string;
    guidanceLink?: string;
    observation?: string;
    warning?: string;
    isFollowUp?: boolean;
    price?: string;
    data?: any;
  }[];
}
