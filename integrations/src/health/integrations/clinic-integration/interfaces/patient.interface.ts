interface ClinicPatientResponse {
  id: number;
  name: string;
  mobile: string;
  birthday: string;
  sex: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  email: string;
  nin: number; // cpf
  healthInsuranceCode: number;
  weight: number;
  height: number;
}

interface ClinicPatientParams {
  nin?: string;
  id?: string;
}

interface ClinicSinglePatientResponse {
  id: number;
  name: string;
  pseudonym: string;
  mobile: string;
  birthday: string;
  sex: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  homePhone: string;
  email: string;
  maritalStatus: number;
  professionCode: number;
  rg: string;
  nin: number;
  nationality: string;
  naturalness: string;
  fathersName: string;
  mothersName: string;
  responsibleAddress: string;
  responsiblePhone: string;
  healthInsuranceCode: number;
  doctorCode: number;
  humanRaceCode: number;
  fathersCPF: number;
  mothersCPF: number;
  complHomePhone: string;
  fathersCode: number;
  respProf: number;
  relativeBranch: string;
  lastReport: number;
  lastPrinted: number;
  treatment: boolean;
  inactivePatient: boolean;
  healthInsurancePlan: string;
  weight: number;
  height: number;
  attendedBy: ClinicSinglePatientDoctors[];
}

interface ClinicSinglePatientDoctors {
  doctorId: number;
  doctor: string;
  specialtyId: number;
  specialty: string;
  lastAttendedDate: string;
}

interface ClinicCreatePatient {
  name: string;
  mobile: string;
  birthday: string;
  sex: string;
  email: string;
  rg: string;
  nin: string;
  healthInsuranceCode: string;
  external_id: string;
}

interface ClinicCreatePatientResponse extends ClinicCreatePatient {
  id: number;
}

export {
  ClinicPatientResponse,
  ClinicCreatePatient,
  ClinicCreatePatientResponse,
  ClinicSinglePatientResponse,
  ClinicPatientParams,
};
