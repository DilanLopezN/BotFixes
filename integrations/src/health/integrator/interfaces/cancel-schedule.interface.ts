interface Procedure {
  specialityCode?: string;
  code?: string;
  specialityType?: string;
}

export interface CancelSchedule {
  appointmentCode: string;
  patientCode: string;
  procedure?: Procedure;
  patient?: {
    code: string;
    bornDate?: string;
    name?: string;
    phone?: string;
    cpf?: string;
  };
  data?: any;
}

export interface CancelScheduleV2<ErpParamType = {}> {
  scheduleCode?: string;
  scheduleId?: number;
  erpParams?: ErpParamType;
}
