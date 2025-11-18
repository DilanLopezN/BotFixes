export interface GetScheduleValue {
  insurance: {
    planCode: string;
    subPlanCode?: string;
    code: string;
    planCategoryCode?: string;
  };
  procedure: {
    specialityCode: string;
    specialityType: string;
    code: string;
  };
  doctor?: {
    code: string;
  };
  appointmentType?: {
    code: string;
  };
  organizationUnit?: {
    code: string;
  };
  speciality?: {
    code: string;
  };
  typeOfService?: {
    code: string;
  };
  scheduleCode?: string;
  data?: any;
}
