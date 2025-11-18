interface CreatePatientRequest {
  alturaPaciente?: string;
  cartaoSus?: string;
  codigoHospitalar?: string;
  complemento?: string;
  cpf: string;
  dataNascimentoPaciente: string;
  email: string;
  endereco?: string;
  idCepCidade?: string;
  idCepEstado?: string;
  idEstadoCivil?: string;
  idProfissao?: string;
  nacionalidade?: string;
  nomeMae?: string;
  nomePaciente: string;
  nomeResponsavel?: string;
  nomeSocial?: string;
  numero?: string;
  observacao?: string;
  password?: string;
  pesoPaciente?: string;
  remedio?: string;
  rg?: string;
  sexoPaciente: string;
  telefoneCelular?: string;
  telefonePaciente: string;
  telefoneTrabalho?: string;
}

interface UpdatePatientRequest extends CreatePatientRequest {}

interface GetPatientResponse {
  telefone: string;
  origem_cadastro: string;
  integracao: string;
  provisorio: boolean;
  quantidade_desmarcacoes: string;
  remedio: string;
  observacao_prontuario: string;
  password: string;
  complemento: string;
  id_profissao: string;
  data_nascimento: number;
  cpf: string;
  id_cep_cidade: string;
  id_paciente: number;
  pat_id: string;
  id_patient_pacs: string;
  pat_birthdate: string;
  id_cep_estado: string;
  peso: string;
  bairro: string;
  documento_estrangeiro: string;
  nome: string;
  id_estado_civil: string;
  data_primeira_desmarcacao: string;
  rg: string;
  altura: string;
  patient_social: string;
  id_canal_comunicacao: string;
  numero: string;
  id_externo_paciente: string;
  estado_civil: string;
  cep: string;
  peso_paciente: string;
  telefone_trabalho: string;
  cartao_sus: string;
  nome_social: string;
  email: string;
  nome_responsavel: string;
  endereco: string;
  altura_paciente: string;
  id_municipio: string;
  nome_mae: string;
  id_empresa: number;
  telefone_celular: string;
  nacionalidade: string;
  sexo: string;
}

interface CreatePacientResponse {
  message: string;
  idPaciente: string | null;
}

interface UpdatePacientResponse {
  message: string;
  idPaciente: string | null;
}

export { CreatePatientRequest, GetPatientResponse, CreatePacientResponse, UpdatePacientResponse, UpdatePatientRequest };
