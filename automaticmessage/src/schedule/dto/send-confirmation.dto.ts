export interface SendConfirmationDto {
  scheduleDate: string;
  scheduleCode: string;
  patientPhone: string;
  patientName: string;
  patientCode: string;
  organizationUnitAddress: string;
  organizationUnitName: string;
  organizationUnitCode: string;
  procedureName: string;
  procedureCode: string;
  doctorName: string;
  doctorCode: string;
  appointmentTypeName: string;
  appointmentTypeCode: string;
  patientEmail: string;
  apiKey: string;
}
