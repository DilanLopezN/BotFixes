interface ListScheduleNotifications {
  startDate: string;
  endDate: string;
  erpParams?: any;
}

interface NotificationScheduleResponse {
  data: NotificationScheduleData[];
  metadata: NotificationScheduleMetadata;
}

interface NotificationScheduleMetadata {
  extractStartedAt: number;
  extractEndedAt: number;
  extractedCount: number;
}

interface NotificationScheduleData {
  contact: NotificationScheduleContact;
  schedule?: NotificationSchedule;
}

interface NotificationScheduleContact {
  phone: string[];
  email?: string[];
  name?: string;
  code?: string;
}

interface NotificationSchedule {
  scheduleCode?: string;
  scheduleId?: number;
  scheduleDate?: string;
  specialityName?: string;
  specialityCode?: string;
  procedureName?: string;
  procedureCode?: string;
  appointmentTypeName?: string;
  appointmentTypeCode?: string;
  insuranceName?: string;
  insuranceCode?: string;
  typeOfServiceCode?: string;
  typeOfServiceName?: string;
  insurancePlanName?: string;
  insurancePlanCode?: string;
  doctorName?: string;
  doctorCode?: string;
  insuranceCategoryName?: string;
  insuranceCategoryCode?: string;
  insuranceSubPlanName?: string;
  insuranceSubPlanCode?: string;
  organizationUnitName?: string;
  organizationUnitCode?: string;
  referenceTypeOfService?: string;
  referenceScheduleType?: string;
  organizationUnitAddress?: string;
  data?: any;
}

export {
  NotificationScheduleResponse,
  NotificationSchedule,
  NotificationScheduleContact,
  NotificationScheduleData,
  NotificationScheduleMetadata,
  ListScheduleNotifications,
};
