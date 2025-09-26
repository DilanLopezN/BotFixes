import type { TeamUser } from '~/interfaces/team';

export interface CheckboxValues {
  isSupervisor: boolean;
  canSendAudioMessage: boolean;
  canStartConversation: boolean;
  canTransferConversations: boolean;
  canViewConversationContent: boolean;
  canViewFinishedConversations: boolean;
  canViewHistoricConversation: boolean;
  canViewOpenTeamConversations: boolean;
  canSendOfficialTemplate: boolean;
}
export interface PermissionListRef {
  getCheckboxValues: () => CheckboxValues;
  resetValues: () => void;
}

export interface PermissionListProps {
  selectedUser?: TeamUser;
}
