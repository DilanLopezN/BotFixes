import { RemiConfigCreateData } from '~/services/workspace/create-remi-setting';
import { RemiFormDataForm } from '../../pages/remi-list/interfaces';
import { convertHHMMToMinutes } from '../convert-time';

export const convertFormDataToCreateData = (formData: RemiFormDataForm): RemiConfigCreateData => {
  return {
    initialWaitTime: convertHHMMToMinutes(formData.interval1),
    automaticWaitTime: convertHHMMToMinutes(formData.interval2),
    finalizationWaitTime: convertHHMMToMinutes(formData.interval3),
    automaticReactivate: formData.automaticReactivate,
    initialMessage: formData.message1Content,
    automaticMessage: formData.message2Content,
    finalizationMessage: formData.message3Content,
    name: formData.name,
    teamIds: formData.selectTeams ? formData.selectedTeamIds ?? [] : [],
    active: true,
    ...(formData.objectiveId && { objectiveId: formData.objectiveId }),
    ...(formData.outcomeId && { outcomeId: formData.outcomeId }),
  };
};
