export interface CreatePatient {
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
    motherName?: string;
    skinColor?: string;
  };
  organizationUnit: {
    code: string;
  };
}
