export interface FutureSchedulePatient {
  phone: string[];
  email: string[];
  name: string;
  code: string;
}

export interface FutureSchedule {
  patient: FutureSchedulePatient;
  scheduleCode: string;
  scheduleDate: string;
  appointmentTypeName: string;
  appointmentTypeCode: string;
  organizationUnitAddress: string | null;
  organizationUnitName: string;
  organizationUnitCode?: string;
  procedureName: string;
  procedureCode?: string;
  specialityName: string;
  specialityCode?: string;
  doctorCode: string;
  doctorName: string;
  insuranceCode: string;
  insuranceName: string;
  insurancePlanCode?: string;
  insurancePlanName: string;
  laterality: string;
}

export interface ListFutureSchedulesParams {
  startDate: string;
  endDate: string;
  insuranceCode?: string[];
  scheduleCode?: string[];
  doctorCode?: string[];
  status?: string;
  appointmentType?: string;
}
