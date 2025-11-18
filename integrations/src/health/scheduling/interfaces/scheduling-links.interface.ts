export interface ISchedulingLinks {
  id: number;
  integrationId: string;
  shortId: string;
  patientErpCode: string;
  patientCpf?: string;
  scheduleCode?: string;
  link: string;
  createdAt: Date;
}
