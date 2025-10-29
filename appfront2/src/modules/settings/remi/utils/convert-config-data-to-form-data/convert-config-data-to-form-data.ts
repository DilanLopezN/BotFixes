import type { RemiConfigData } from '~/interfaces/remi-config-data';
import { RemiFormDataForm } from '../../pages/remi-list/interfaces';
import { convertMinutesToHHMM } from '../convert-time';

export const convertConfigDataToFormData = (configData: RemiConfigData): RemiFormDataForm => {
  const hasTeams = Array.isArray(configData.teamIds) && configData.teamIds.length > 0;

  return {
    interval1: convertMinutesToHHMM(configData.initialWaitTime),
    interval2: convertMinutesToHHMM(configData.automaticWaitTime),
    interval3: convertMinutesToHHMM(configData.finalizationWaitTime),
    automaticReactivate: configData.automaticReactivate || false,
    message1Content: configData.initialMessage || '',
    message2Content: configData.automaticMessage || '',
    message3Content: configData.finalizationMessage || '',
    name: configData.name || '',
    selectTeams: hasTeams,
    applyToAll: !hasTeams,
    selectedTeamIds: hasTeams ? configData.teamIds! : [],
    objectiveId: configData.objectiveId ? parseInt(String(configData.objectiveId), 10) : undefined,
    outcomeId: configData.outcomeId ? parseInt(String(configData.outcomeId), 10) : undefined,
  };
};
