export interface TeamPermission {
  canSendAudioMessage: boolean;
  canSendMultipleMessages: boolean;
  canSendOfficialTemplate: boolean;
  canStartConversation: boolean;
  canTransferConversations: boolean;
  canViewConversationContent: boolean;
  canViewFinishedConversations: boolean;
  canViewHistoricConversation: boolean;
  canViewOpenTeamConversations: boolean;
}

export interface TeamUser {
  userId: string;
  isSupervisor: boolean;
  permission: TeamPermission;
}

export interface AttendancePeriod {
  start: number;
  end: number;
}

export interface OffDaysPeriod extends AttendancePeriod {
  name: string;
  message?: string;
  cannotAssignEndConversation?: boolean;
}

export interface AttendancePeriods {
  mon: AttendancePeriod[];
  tue: AttendancePeriod[];
  wed: AttendancePeriod[];
  thu: AttendancePeriod[];
  fri: AttendancePeriod[];
  sat: AttendancePeriod[];
  sun: AttendancePeriod[];
}

export interface Team {
  teamId?: string;
  name: string;
  workspaceId: string;
  isDefaultTeam?: boolean;
  roleUsers: TeamUser[];
  autoAssignToUser?: boolean;
  priority?: number;
  createdAt?: number;
  updatedAt?: number;
  attendancePeriods: AttendancePeriods;
  assignMessage?: string;
  cannotAssignMessage?: string;
  cannotAssignEndConversation?: boolean;
  notificationNewAttendance?: boolean;
  offDays?: OffDaysPeriod[];
  reassignConversationInterval?: number;
  viewPublicDashboard?: boolean;
  _id?: string;
  inactivatedAt?: string;
  requiredConversationCategorization?: boolean;
}
