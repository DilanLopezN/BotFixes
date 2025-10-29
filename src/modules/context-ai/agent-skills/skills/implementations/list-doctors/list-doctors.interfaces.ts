export interface Doctor {
    _id: string;
    code: string;
    name: string;
    friendlyName: string;
}

export interface DoctorResponse {
    id: string;
    name: string;
}

export interface ListDoctorsResult {
    doctors: DoctorResponse[];
    ragContext: string[];
}
