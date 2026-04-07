export interface ClinicListConfirmationErpParams {
  // Filtra agendamentos pelos status listados no array abaixo
  statusCodeList?: string[];
  // Filtra agendamentos pelos tipos de agendamento listados no array abaixo (appointmentTypeCode)
  appointmentTypeCodeList?: string[];
}
