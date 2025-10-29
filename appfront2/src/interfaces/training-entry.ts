export interface TrainingEntry {
  id: string;
  identifier: string;
  content: string;
  workspaceId: string;
  botId?: string;
  pendingTraining: boolean;
  createdAt: string;
  executedTrainingAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface CreateTrainingEntryDto {
  botId?: string;
  identifier: string;
  content: string;
}

export interface UpdateTrainingEntryDto {
  trainingEntryId: string;
  botId?: string;
  identifier: string;
  content: string;
}

export interface DeleteTrainingEntryDto {
  trainingEntryId: string;
}

export interface DoTrainingDto {
  trainingEntryId?: string;
  forceAll?: boolean;
}

export interface GetTrainingEntryDto {
  trainingEntryId: string;
}
