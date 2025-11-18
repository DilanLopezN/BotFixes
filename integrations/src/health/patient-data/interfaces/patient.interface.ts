export interface IPatientData {
  id: string;
  integrationId: string;
  workspaceId: string;
  erpCode: string;
  erpLegacyCode?: string;
  name: string;
  phone: string;
  cpf: string;
  email: string;
  bornDate: number;
  createdAt: number;
}
