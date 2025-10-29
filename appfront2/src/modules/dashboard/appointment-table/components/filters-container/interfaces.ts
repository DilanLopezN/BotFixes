import type { RefObject } from 'react';
import type { EnhancedTableRef } from '~/components/enhanced-table';
import { ConversationStatus } from '~/constants/conversation-status';

export interface FiltersContainerProps {
  onRefresh: () => void;
  tableRef: RefObject<EnhancedTableRef>;
  isRefreshing?: boolean;
}

export interface FilterModalProps {
  isVisible?: boolean;
  onClose: () => void;
}

export interface FilterFormValues {
  channelId?: string;
  agentIds?: string[];
  teamIds?: string[];
  appointmentStatus?: ConversationStatus[];
  tags?: string[];
}
