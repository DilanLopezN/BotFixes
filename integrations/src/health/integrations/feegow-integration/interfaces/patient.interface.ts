interface FeegowPatientByCodeResponse {
  nome: string;
  nascimento: string;
  sexo: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  profissao: string;
  foto: string;
  telefones: string[];
  celulares: string[];
  documentos: {
    rg: string;
    cpf: string;
  };
  email: string[];
  id: number;
}

interface FeegowPatientByCpfResponse {
  patient_id: number;
  nome: string;
}

interface FeegowCreatePatient {
  nome_completo: string;
  cpf: string;
  email?: string;
  data_nascimento: string;
  sexo: string;
  telefone?: string;
  celular?: string;
}

interface FeegowUpdatePatient {
  paciente_id: number;
  nome_completo?: string;
  cpf?: string;
  email?: string;
  data_nascimento?: string;
  genero?: string;
  telefone?: string;
  celular?: string;
}

interface FeegowCreatePatientResponse {
  paciente_id: number;
}

export {
  FeegowPatientByCodeResponse,
  FeegowPatientByCpfResponse,
  FeegowCreatePatientResponse,
  FeegowCreatePatient,
  FeegowUpdatePatient,
};
