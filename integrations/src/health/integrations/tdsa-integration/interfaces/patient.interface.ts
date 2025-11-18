interface TdsaGetPatient {
  Id: number;
  Nome: string;
  NomeSocial: string;
  DataNascimento: string;
  CPF: string;
  RG: string;
  Email: string;
  Sexo: number;
  Profissao?: string;
  Celular: string;
  Telefone: string;
  TelefonesComp: string;
  Uf: string;
  Cidade: string;
  Bairro: string;
  Logradouro: string;
  Numero: string;
  Cep: string;
  Complemento: string;
  Responsavel: string;
}

interface TdsaCreatePatient {
  Nome: string;
  DataNascimento: string;
  CPF: string;
  RG?: string;
  Email?: string;
  Sexo: 'NaoInformado' | 'Masculino' | 'Feminino';
  Profissao?: string;
  Celular?: string;
  Telefone?: string;
  TelefonesComp?: {
    TelefoneComp: string;
  }[];
  Uf?: string;
  Cidade?: string;
  Bairro?: string;
  Logradouro?: string;
  Numero?: string;
  Cep?: string;
  Complemento?: string;
}

interface TdsaUpdatePatient extends TdsaCreatePatient {
  Id: string;
}

interface TdsaCreatedPatient extends TdsaCreatePatient {}

interface TdsaPatientAppointment {
  IdUnidade: number;
  IdConvenio: number;
  IdEspecialidade: number;
  IdPlano: number;
  IdProfissional: number;
  IdProfissionalHorario: number;
  IdProcedimento: number;
  IdPaciente: number;
  IdAgendamento: number;
  Data: string;
  IdentificadorEmpresa: string;
  NomeUnidade: string;
  NomeConvenio: string;
  NomeEspecialidade: string;
  NomePlano: string;
  NomeProfissional: string;
  NomeProcedimento: string;
  Status: number;
}

export { TdsaPatientAppointment, TdsaCreatedPatient, TdsaUpdatePatient, TdsaGetPatient, TdsaCreatePatient };
