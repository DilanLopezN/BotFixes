export interface RemiConfigCreateData {
  initialWaitTime: number;
  automaticReactivate: boolean;
  initialMessage: string;
  automaticWaitTime: number;
  automaticMessage: string;
  finalizationWaitTime: number;
  finalizationMessage: string;
  name: string;
  teamIds: string[];
  active: boolean;
  objectiveId?: number;
  outcomeId?: number;
}
