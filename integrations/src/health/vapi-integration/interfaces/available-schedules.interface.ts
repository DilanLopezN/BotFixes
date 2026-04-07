export enum PeriodOfDay {
  morning = 'morning',
  afternoon = 'afternoon',
  indifferent = 'indifferent',
  night = 'night',
}

import { CorrelationFilter } from '../../interfaces/correlation-filter.interface';

export interface ListAvailableSchedulesInput {
  filter?: {
    doctorCode?: string;
    insuranceCode?: string;
    organizationUnitCode?: string;
    procedureCode?: string;
    specialityCode?: string;
    appointmentType?: string;
  };
  startDate?: string;
  endDate?: string;
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
