interface ClinuxUpdatePatientParamsRequest {
  cd_paciente: number;
  cd_operacao: number;
  js_paciente: string; // base64 do paciente
}

interface ClinuxPatient {
  cd_funcionario: number;
  cd_paciente: number;
  cd_plano?: number;
  cd_titular?: null;
  ds_bairro?: null;
  ds_celular: string; // (XX) XXXXX-XXXX
  ds_celular_web?: string;
  ds_cep?: string;
  ds_cidade?: string;
  ds_cpf: string; // XXX.XXX.XXX-XX
  ds_email: string;
  ds_estado?: string;
  ds_logradouro?: string;
  ds_mae?: string;
  ds_matricula?: string;
  ds_numero?: string;
  ds_paciente: string;
  ds_sexo: 'M' | 'F' | 'I';
  ds_telefone?: string;
  dt_nascimento: string; // XX/XX/XXXX
  nr_altura?: string;
  nr_peso?: string;
  sn_ativo: boolean;
  sn_web: boolean;
}

interface ClinuxCreatePatientParamsRequest {
  cd_paciente: number;
  cd_operacao: number;
  js_paciente: string; // base64 do paciente
  cd_funcionario: number;
}

interface ClinuxUpdatePatientResponse {
  Sucesso: number;
}

interface ClinuxCreatePatientResponse {
  Sucesso: string;
}

interface ClinuxGetPatientResponse {
  cd_paciente: number;
  ds_paciente: string;
  ds_nome: string;
  nr_paciente: number;
  dt_nascimento: string;
  ds_cpf: string;
  ds_telefone?: string;
  ds_idade: string;
  ds_celular: string; // (XX) XXXXX-XXXX
  sn_ativo: boolean;
  sn_pne?: string;
  sn_vip: boolean;
  sn_vac: boolean;
  sn_obs1: boolean;
  sn_obs2: boolean;
  sn_vic: boolean;
  cd_plano?: number;
  ds_plano?: string;
}

interface ClinuxGetPatientParamsRequest {
  ds_cpf?: string;
  cd_paciente?: string;
}

export {
  ClinuxUpdatePatientParamsRequest,
  ClinuxUpdatePatientResponse,
  ClinuxPatient,
  ClinuxCreatePatientParamsRequest,
  ClinuxCreatePatientResponse,
  ClinuxGetPatientResponse,
  ClinuxGetPatientParamsRequest,
};
