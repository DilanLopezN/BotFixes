export interface HealthIntegrationRules {
  listOnlyDoctorsWithAvailableSchedules?: boolean;
  listConsultationTypesAsProcedure?: boolean;
  requiredTypeOfServiceOnCreateAppointment?: boolean;
  useProcedureWithoutSpecialityRelation?: boolean;
  useProcedureAsInterAppointmentValidation?: boolean;
  useProcedureWithCompositeCode?: boolean;
  sendGuidanceOnCreateSchedule?: boolean;
  splitInsuranceIntoInsurancePlans?: boolean;
  updatePatientEmailBeforeCreateSchedule?: boolean;
  updatePatientSexBeforeCreateSchedule?: boolean;
  updatePatientPhoneBeforeCreateSchedule?: boolean;
  usesCorrelation?: boolean;
  showFutureSearchInAvailableScheduleList?: boolean;
  timeBeforeTheAppointmentThatConfirmationCanBeMade?: number;
  timeCacheFirstAppointmentAvailableForFutureSearches?: number;
  limitUntilDaySearchAppointments?: number;
  limitUntilDaySearchAppointmentsWithDoctor?: number;
  showListingFutureTimesFrom?: number;
  runFirstScheduleRule?: boolean;
  runInterAppointment?: boolean;
  timeFirstAvailableSchedule?: number;
}
