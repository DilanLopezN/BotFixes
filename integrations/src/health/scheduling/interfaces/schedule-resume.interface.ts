interface ListSchedulesResumeResponse {
  guidanceType: ScheduleResumeType;
  defaultGuidanceLink?: string;
  patientFirstName?: string;
  schedules: ScheduleResume[];
}

interface ScheduleResume {
  scheduleCode: string;
  scheduleDate: string;
  status: ScheduleStatus;
  organizationUnitAddress?: string;
  procedureName: string;
  specialityName: string;
  organizationUnitName: string;
  doctorName: string;
  scheduleTypeName: string;
  scheduleTypeCode: string;
  guidanceLink?: string;
  guidance?: string;
  observation?: string;
  permissions: {
    allowConfirm: boolean;
    allowCancel: boolean;
    allowReschedule: boolean;
  };
  data?: any;
}

type ScheduleResumeType = 'rawText' | 'file';

enum ScheduleStatus {
  scheduled = 'scheduled',
  canceled = 'canceled',
  confirmed = 'confirmed',
  finished = 'finished',
}

export type { ListSchedulesResumeResponse, ScheduleResume };
export { ScheduleStatus };
