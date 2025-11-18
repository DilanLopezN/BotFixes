interface BranchesResponse {
  cidade: string;
  telefone: string;
  numero: string;
  cnpj: string;
  cep: string;
  uf: string;
  horario_atendimento_filial: string;
  agendamento_externo: boolean;
  tipo_filial: string;
  endereco: string;
  nome_agendamento_externo: string;
  bairro: string;
  folha_rosto_atendido: false;
  nome: string;
  id_filial: number;
  horario_retirada_exames: string;
  inscricao_estadual: string;
  id_empresa: number;
  nome_fantasia: string;
}

interface UnitResponse {
  cidade: string;
  numero: string;
  id_unidade: number;
  description: string;
  cep: string;
  nome: string;
  uf: string;
  agendamento_externo: boolean;
  endereco: string;
  bairro: string;
  id_filial: number;
}

enum NetpacsSpecialityType {
  EXAME = 'EXAME',
  CONSULTA = 'CONSULTA',
  RETORNO = 'RETORNO',
}

interface ProceduresResponse {
  idProcedimento?: number;
  id_procedimento: number;
  tipo: NetpacsSpecialityType;
  codigo_integracao: string;
  min_preparatorio_exame: number;
  id_estoque: number;
  acompanhamento_medico: boolean;
  contato_paciente_agendamento_externo: boolean;
  nome: string;
  via_de_acesso: string;
  permitir_agendamento: boolean;
  permitirAgendamento?: boolean;
  matriz: boolean;
  filtro_medico_agendamento_externo: false;
  id_filial: number;
  idFilial?: number;
  price: string;
  tecnica: string;
  duracao: number;
  id_modalidade: number;
  idModalidade?: number;
  codigo_tuss: number;
  orientacao?: string;
}

interface ModalitiesResponse {
  chave: string;
  valor: string;
  entrega_laudo: number;
  entrega_resultado: number;
  modalidade_integracao: boolean;
  descricao: string;
  id_filial: number;
  alerta_sem_executor: null;
  agendamento_externo: boolean;
  codigo_servico_classificacao: string;
  id_modalidade: number;
}

interface InsurancesResponse {
  situacao_liberado: boolean;
  valor_minimo_cofins: number;
  id_forma_pagamento: number;
  convenio_particular: false;
  nome: string;
  id_filial: number;
  id_convenio: number;
  id_plano_conta: number;
  agendamento_externo: boolean;
  numero_lote: number;
  medico_solicitante_obrigatorio: boolean;
}

interface InsurancePlanResponse {
  convenio_particular: boolean;
  nome: string;
  id_conta: number;
  id_convenio: number;
  id_plano_conta: number;
  id_plano_convenio: number;
  cobrar_pagamento_retorno: boolean;
}

interface DoctorsResponse {
  id_profissional: number;
  estado_crm: string;
  residente: boolean;
  anestesista: boolean;
  executor: boolean;
  id_medico: number;
  conselho_profissional: string;
  crm: string;
}

interface ProfessionalsResponse {
  id_profissao: number;
  codigo_externo: string;
  data_desligamento: string;
  id_profissional: number;
  nome: string;
  sexo: string;
}

export {
  BranchesResponse,
  ProceduresResponse,
  ModalitiesResponse,
  InsurancesResponse,
  InsurancePlanResponse,
  DoctorsResponse,
  ProfessionalsResponse,
  NetpacsSpecialityType,
  UnitResponse,
};
