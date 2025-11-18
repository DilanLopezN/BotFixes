interface DoctoraliaGetPatientResponse {
  memberid: string;
  email: string;
  fname: string;
  lname: string;
  lname_2: string;
  phone: string;
  institution: string;
  is_admin: string;
  birthday: string;
  gender: string;
  idtype: string;
  idnumber: string;
  birthday_formatted: string;
  social_name?: string;
  legacyid?: string;
}

interface DoctoraliaCreatePatientRequest {
  birthday: string;
  gender: string;
  idnumber: string;
  idtype: number;
  fname: string;
  lname: string;
  email: string;
  phone: string;
  social_name?: string;
  password?: string;
}

interface DoctoraliaCreatePatientResponse extends DoctoraliaCreatePatientRequest {
  memberid: string;
  birthday_formatted?: string;
}

interface DoctoraliaUpdatePatientRequest {
  birthday?: string;
  gender?: string;
  idnumber?: string;
  idtype?: number;
  fname?: string;
  lname?: string;
  email?: string;
  phone?: string;
}

export {
  DoctoraliaGetPatientResponse,
  DoctoraliaCreatePatientResponse,
  DoctoraliaCreatePatientRequest,
  DoctoraliaUpdatePatientRequest,
};
