interface PatientPhone {
  tipoTelefone: 0 | 1 | 2;
  ddi?: string;
  ddd?: string;
  numero?: string;
}

interface PatientDocument {
  tipoDocumento: 0 | 1 | 2 | 3 | 4;
  numero: string;
}

interface CreatePatientRequest {
  codigosClientes: string[];
  paciente: {
    codigo?: string;
    nome: string;
    dataNascimento: string;
    genero: string;
    email: string;
    telefones: PatientPhone[];
    documentos: PatientDocument[];
    endereco: {
      endereco?: string;
      bairro?: string;
      cidade?: string;
      uf?: string;
    };
    altura: string;
    peso: string;
    nomeMae?: string;
    raca?: string;
    cor?: string;
  };
  codigoUnidade?: string;
}

interface UpdatePatientRequest extends Omit<CreatePatientRequest, 'codigoUnidade'> {}

interface CreatePatientResponse {
  codigo: string;
  nome: string;
  email: string;
  dataNascimento: string;
  genero: string;
  matricula: string;
  telefones: PatientPhone[];
  documentos: PatientDocument[];
  peso: number;
  altura: number;
  nomeMae: string;
  raca?: string;
  cor?: string;
}

interface UpdatePatientResponse extends CreatePatientResponse {}

interface GetPatientRequest {
  codigosClientes: string;
  codigoPaciente: string;
}

interface GetPatientResponse {
  codigo: string;
  nome: string;
  email: string;
  dataNascimento: string;
  genero: string;
  matricula?: string;
  telefones: PatientPhone[];
  documentos: PatientDocument[];
  peso: number;
  altura: number;
  nomeMae: string;
  raca?: string;
  cor?: string;
}

interface GetPatientByCpfRequest {
  codigosClientes: string[];
  cpf: string;
}

export {
  PatientDocument,
  PatientPhone,
  CreatePatientRequest,
  CreatePatientResponse,
  GetPatientByCpfRequest,
  GetPatientRequest,
  GetPatientResponse,
  UpdatePatientResponse,
  UpdatePatientRequest,
};
