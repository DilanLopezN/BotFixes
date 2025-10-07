export interface DistributionRuleData {
  id: string;
  workspaceId: string;
  active: boolean;
  maxConversationsPerAgent: number;
  checkUserWasOnConversation?: boolean;
  checkTeamWorkingTimeConversation?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DistributionRuleCreateData {
  active: boolean;
  maxConversationsPerAgent: number;
  checkUserWasOnConversation?: boolean;
  checkTeamWorkingTimeConversation?: boolean;
}

export interface DistributionRuleUpdateData {
  active: boolean;
  maxConversationsPerAgent: number;
  checkUserWasOnConversation?: boolean;
  checkTeamWorkingTimeConversation?: boolean;
}

export interface PaginatedDistributionRules {
  data: DistributionRuleData[];
  total: number;
  skip: number;
  limit: number;
}
