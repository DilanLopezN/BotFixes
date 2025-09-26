export interface ConversationCategorization {
  id: number;
  iid: string;
  conversationId: string;
  objectiveId: number;
  outcomeId: number;
  userId: string;
  description?: string;
  conversationTags?: string[];
  createdAt: number;
  updatedAt?: number;
  deletedAt?: number;
}
