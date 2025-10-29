export interface DistributionRuleData {
  id: string;
  workspaceId: string;
  active: boolean;
  maxConversationsPerAgent: number;
  checkUserWasOnConversation?: boolean;
  checkTeamWorkingTimeConversation?: boolean;
  createdAt: string;
  updatedAt: string;
  excludedUserIds?: string[];
}

export interface DistributionRuleCreateData {
  active: boolean;
  maxConversationsPerAgent: number;
  checkUserWasOnConversation?: boolean;
  checkTeamWorkingTimeConversation?: boolean;
  excludedUserIds?: string[];
}

export interface DistributionRuleUpdateData {
  active: boolean;
  maxConversationsPerAgent: number;
  checkUserWasOnConversation?: boolean;
  checkTeamWorkingTimeConversation?: boolean;
  excludedUserIds?: string[];
}

export interface PaginatedDistributionRules {
  data: DistributionRuleData[];
  total: number;
  skip: number;
  limit: number;
}
