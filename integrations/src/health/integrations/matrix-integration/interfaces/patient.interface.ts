interface MatrixPatientResponse {
  paciente_id: string;
  documento: string;
  tipoDocumento: string;
  nome: string;
  dataNascimento: string;
  sexo: string;
  email: string;
  telefoneDDD: string;
  telefone: string;
  celularDDD: string;
  celular: string;
  endereco: string;
  numero: string;
  bairro: string;
  UF: string;
  cep: string;
}

interface MatrixPatientResponseV2 extends MatrixPatientResponse {
  usuarioNet: string;
}

interface MatrixCreatePatientResponse extends MatrixPatientResponse {}

interface MatrixUpdatePatientResponse extends MatrixPatientResponse {}
interface MatrixUpdatePatient extends MatrixCreatePatient {
  paciente_id: string;
}

interface MatrixCreatePatient {
  documento: string;
  tipoDocumento: string;
  nome: string;
  dataNascimento: string;
  sexo: string;
  email?: string;
  telefoneDDD?: string;
  telefone?: string;
  celularDDD?: string;
  celular?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  UF?: string;
  cep?: string;
}

interface MatrixPatientSchedulesParams {
  paciente_id: string;
  status?: string;
}

interface MatrixListSchedules {
  data_marcacao_inicial: string;
  data_marcacao_final: string;
  status?: string;
}

interface MatrixPatientSchedulesResponse {
  agendamentos: {
    codigo_pre_pedido: string;
    sequencia_procedimento: string;
    data_marcacao: string;
    tipo_procedimento: string;
    setor_id: string;
    setor_nome: string;
    procedimento_id: string;
    procedimento_nome: string;
    responsavel_id: string;
    consulta_id: string;
    status: 'Marcado' | 'Confirmado' | 'Realizado' | 'Desmarcado';
    unidade_id: string;
    unidade_nome: string;
    unidade_endereco: string;
  }[];
}

interface MatriListSchedulesDatailedResponse {
  agendamentosDetalhados: {
    codigo_pre_pedido: string;
    sequencia_procedimento: string;
    data_marcacao: string;
    tipo_procedimento: string;
    setor_id: string;
    setor_nome: string;
    procedimento_id: string;
    procedimento_nome: string;
    responsavel_id: string;
    consulta_id: string;
    paciente_id: string;
    paciente_nome: string;
    paciente_telefone_celular: string;
    paciente_email: string;
    paciente_documento: string;
  }[];
}

interface MatrixPatientData {
  documento: string;
  tipoDocumento: string;
}

export {
  MatrixCreatePatient,
  MatrixCreatePatientResponse,
  MatrixPatientData,
  MatrixPatientResponse,
  MatrixPatientResponseV2,
  MatrixUpdatePatient,
  MatrixUpdatePatientResponse,
  MatrixPatientSchedulesParams,
  MatrixPatientSchedulesResponse,
  MatriListSchedulesDatailedResponse,
  MatrixListSchedules,
};
