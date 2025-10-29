import { BotAttribute } from '../../../../../../../model/BotAttribute';
import { Entity } from 'kissbot-core/lib';
import { Interaction } from '../../../../../../../model/Interaction';
import { Bot } from '../../../../../../../model/Bot';
import { BotResponseProps } from '../../../interfaces';

export interface BotResponseStatusGuideProps extends BotResponseProps {
  botList: Bot[];
  interactionList: Interaction[];
  match?: any;
  entitiesList: Entity[];
  setCurrentEntities: (entitiesList: Array<Entity>) => any;
  botAttributes: BotAttribute[];
}
