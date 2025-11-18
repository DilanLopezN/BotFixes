import { Patient } from '../../../interfaces/patient.interface';

interface MatrixPatientV2 extends Patient {
  data: { erpId?: string; codUsuario?: string; usuarioNet?: string };
}

interface PatientRecoverPassword {
  cpf: string;
  bornDate: string;
  phone?: string;
  motherName?: string;
  zipCode?: string;
  insuranceNumber?: string;
}

interface ValidatePatientRecoverAccessProtocol {
  cpf: string;
  bornDate: string;
  phone?: string;
  email?: string;
  zipCode?: string;
  insuranceNumber?: string;
  motherName?: string;
  fieldsToValidate?: FieldToValidate[];
}

enum FieldToValidate {
  phone = 'phone',
  email = 'email',
  zipCode = 'zipCode',
  motherName = 'motherName',
  insuranceNumber = 'insuranceNumber',
}

interface RecoverPasswordResponse {
  senhaProvisoria: string;
}

interface RecoverPasswordRequest {
  cpf: string;
  usuarioNet: string;
  nome: string;
  dataNascimento: string;
}

export {
  PatientRecoverPassword,
  ValidatePatientRecoverAccessProtocol,
  FieldToValidate,
  RecoverPasswordResponse,
  RecoverPasswordRequest,
  MatrixPatientV2,
};
