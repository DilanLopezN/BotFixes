import { ExportType } from '~/components/export-button';
import { ConversationStatus } from '~/constants/conversation-status';

export interface ExportAppointmentTableProps {
  workspaceId: string;
  startDate: string;
  endDate: string;
  teamIds?: string[];
  agentIds?: string[];
  channelId?: string;
  tags?: string[];
  state?: string[];
  appointmentStatus?: ConversationStatus[];
  timezone?: string;
  includeAppointmentDetails?: boolean;
  downloadType?: ExportType;
}
