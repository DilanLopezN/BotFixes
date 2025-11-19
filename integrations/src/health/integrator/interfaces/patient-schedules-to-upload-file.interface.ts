interface PatientSchedulesToUploadFile {
  startDate?: number;
  endDate?: number;
  patientCode: string;
  patientCpf: string;
  patientPhone?: string;
  patientBornDate?: string;
  erpUsername: string;
}

export { PatientSchedulesToUploadFile };
