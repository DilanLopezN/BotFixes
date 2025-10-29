export interface RemiFormDataForm {
  name: string;
  automaticReactivate: boolean;
  applyToAll: boolean;
  selectTeams: boolean;
  selectedTeamIds?: string[];

  interval1: string;
  interval2: string;
  interval3: string;

  message1Content: string;
  message2Content: string;
  message3Content: string;

  objectiveId?: number;
  outcomeId?: number;
}
