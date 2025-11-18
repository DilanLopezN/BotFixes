interface ClinuxListSchedulesParamsRequest {
  dt_de: string;
  dt_ate: string;
}

interface ClinuxSchedule {
  cd_atendimento: number;
  cd_modalidade: string;
  ds_modalidade: string;
  cd_sala: number;
  ds_sala: string;
  cd_empresa: number;
  cd_procedimento: string;
  dt_data: string;
  dt_hora: string;
  cd_paciente: number;
  ds_paciente: string;
  dt_hora_chegada: string;
  ds_medico: string;
  ds_telefone: string;
  sn_autoriza_fone: boolean;
}

export { ClinuxListSchedulesParamsRequest, ClinuxSchedule };
