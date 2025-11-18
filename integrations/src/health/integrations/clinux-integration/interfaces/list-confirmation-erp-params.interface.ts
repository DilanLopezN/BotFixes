export interface ClinuxListConfirmationErpParams {
  // Ignora agendamentos das salas listadas no array abaixo
  omitSalaCodeList?: number[];
  // pega apenas agendamentos das salas listadas no array abaixo
  filterSalaCodeList?: number[];
  // pega apenas agendamentos com o nome de modalidade listadas no array abaixo
  filterDsModalidadeList?: string[];
  // Força para todos os agendamentos serem appointmentTypeCode = 'E' pois
  // em alguns cliente clinux os vinculos de tipo de agendamentos estão errados e só tem exames, mas alguns vem como consulta
  useAllSchedulesAsExam?: boolean;
  // Popula o campo procedureName com o nome da modalidade do Clinux, pois existem exames que não tem procedimento mas
  // tem especialidade nesse caso se retornar como especialidade e como exame não vai enviar nem o nome da especialidade
  // nem o nome do procedimento pois para todos os outros sistemas quando é exame sempre existe procedimento e não especialidade
  useSpecialityAsProcedureName?: boolean;
  // Omite a informação de médico na extração de horarios para confirmação
  omitDoctorName?: boolean;
}
