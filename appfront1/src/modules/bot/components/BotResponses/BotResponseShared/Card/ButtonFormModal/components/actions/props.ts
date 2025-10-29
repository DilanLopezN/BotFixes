import { BotAttribute } from './../../../../../../../../../model/BotAttribute';
import { Interaction } from './../../../../../../../../../model/Interaction';
import { IButton, Entity } from 'kissbot-core';
import { I18nProps } from './../../../../../../../../i18n/interface/i18n.interface';

export interface ActionsProps extends I18nProps{
  interactionList: Interaction[];
  values: IButton;
  touched: Function;
  errors: any;
  isSubmitted: boolean;
  setFieldValue: Function;
  botAttributes: BotAttribute[];
  entitiesList: Entity[];
}