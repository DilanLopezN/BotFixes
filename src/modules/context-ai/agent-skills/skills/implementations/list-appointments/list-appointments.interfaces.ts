export interface Doctor {
    _id: string;
    code: string;
    name: string;
    friendlyName: string;
}

export interface Insurance {
    _id: string;
    code: string;
    name: string;
    friendlyName: string;
}

export interface Specialty {
    _id: string;
    code: string;
    name: string;
    friendlyName: string;
}

export interface OrganizationUnit {
    _id: string;
    code: string;
    name: string;
    friendlyName: string;
    data?: {
        address?: string;
    };
}

export interface AppointmentType {
    _id: string;
    code: string;
    name: string;
    friendlyName: string;
}

export interface PatientResponse {
    code: string;
    name: string;
    cpf: string;
    phone: string;
    cellPhone: string;
    email: string;
    bornDate: string;
    sex: string;
    motherName: string;
}

export interface Appointment {
    appointmentCode: string;
    appointmentDate: string;
    duration: string;
    status: number;
    organizationUnit: OrganizationUnit;
    speciality: Specialty;
    insurance: Insurance;
    doctor: Doctor;
    appointmentType: AppointmentType;
}

export interface AppointmentSkillData {
    cpf?: string;
    birthDate?: string;
    step?: 'requesting_cpf' | 'requesting_birth_date' | 'completed';
}

export interface ListAppointmentsCollectedData {
    cpf?: string;
    birthDate?: string;
    patientCode?: string;
    patientName?: string;
    appointments?: Appointment[];
    pendingAction?: {
        action: 'cancel' | 'confirm' | 'reschedule';
        indices: number[];
    };
}
