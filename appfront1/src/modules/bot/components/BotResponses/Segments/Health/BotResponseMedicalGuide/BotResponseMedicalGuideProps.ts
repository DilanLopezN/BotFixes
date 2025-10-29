import { Interaction } from '../../../../../../../model/Interaction';
import { BotAttribute } from '../../../../../../../model/BotAttribute';
import { Entity, Bot } from 'kissbot-core/lib';
import { BotResponseProps } from '../../../interfaces';

export interface BotResponseMedicalGuideProps extends BotResponseProps {
  match?: any;
  setCurrentEntities: (entitiesList: Array<Entity>) => any;
  botAttributes: BotAttribute[];
  entitiesList: Entity[];
  interactionList: Interaction[];
  botList: Bot[];
}


export interface BotResponseMedicalGuideState {
  botLoaded: string;
  loadedInteractions: boolean;
  interactionList: Interaction[];
}