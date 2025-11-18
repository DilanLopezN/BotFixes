export enum MatrixConfirmationStatus {
  cancelado = 'cancelado',
  confirmado = 'confirmado',
  agendado = 'agendado',
}
export interface MatrixConfirmationErpParams {
  filterOnlyWithVideoGuidanceLink?: boolean;
  specialityCodesFilter?: string[];
  procedureCodesFilter?: string[];
  doctorCodesFilter?: string[];
  filterStatus?: MatrixConfirmationStatus[];
  sameDayProcedureFilter?: string[];
  hideDoctorInfo?: boolean;
}
