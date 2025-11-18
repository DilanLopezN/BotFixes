import { Appointment } from './appointment.interface';

interface Patient {
  name: string;
  socialName?: string;
  cpf: string;
  email?: string;
  sex?: string;
  bornDate: string;
  identityNumber?: string;
  cellPhone?: string;
  phone?: string;
  code?: string;
  motherName?: string;
  height?: number;
  weight?: number;
  skinColor?: string;
  data?: {
    // paciente na tuotempo tem um id que não é o mesmo de dentro do sistema do hospital.
    // retorna em um outro campo, que é armazenado aqui
    erpId?: string;
    codUsuario?: string;
  };
}

interface PatientAppointments extends Patient {
  appointments: Appointment[];
}

export { Patient, PatientAppointments };
