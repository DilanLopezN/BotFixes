interface DefaultPatient {
  name?: string;
  cpf?: string;
  phone?: string;
  bornDate?: string;
  code?: string;
}

interface GetRequestAcceptanceResponse {
  patient?: DefaultPatient[];
  requestAcceptance: boolean;
}

export type { DefaultPatient, GetRequestAcceptanceResponse };
