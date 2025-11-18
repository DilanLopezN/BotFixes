export interface UpdatePatient {
  patient: {
    name: string;
    cpf: string;
    email?: string;
    sex?: string;
    bornDate: string;
    identityNumber?: string;
    cellPhone?: string;
    phone?: string;
    height?: number;
    weight?: number;
  };
}
