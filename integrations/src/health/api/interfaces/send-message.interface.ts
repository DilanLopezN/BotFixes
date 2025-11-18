export interface SendActiveMessageData {
  apiToken: string;
  phoneNumber: string;
  parsedNumber?: string;
  action?: string;
  externalId?: string;
  attributes?: { label?: string; value: string }[];
  campaignId?: number;
  confirmationId?: number;
  omitAction?: boolean;
  contactName?: string;
  templateId?: string;
}

export interface SendActiveTrackedMessageData {
  apiKey: string;
  sendType?: string;
  contact: {
    phone: string[];
    email?: string[] | null;
    name: string;
    code: string;
  };
  schedule?: {
    scheduleCode: string;
    scheduleDate: string;
    organizationUnitAddress?: string;
    organizationUnitName?: string;
    procedureName?: string;
    specialityName?: string;
    doctorName?: string;
    doctorObservation?: string;
    principalScheduleCode?: string;
    isPrincipal?: boolean;
    appointmentTypeName?: string;
    isFirstComeFirstServed?: boolean;
    appointmentTypeCode?: string;
    doctorCode?: string;
    organizationUnitCode?: string;
    procedureCode?: string;
    specialityCode?: string;
    data?: Record<string, unknown>;
  };
}
