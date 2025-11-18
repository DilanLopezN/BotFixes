export interface ConfirmSchedule {
  appointmentCode: string;
  appointmentDate?: string;
  patientCode: string;
  specialityType?: string;
  data?: any;
}

export interface ConfirmScheduleV2 {
  scheduleCode?: string;
  scheduleId?: number;
  erpParams?: any;
}
