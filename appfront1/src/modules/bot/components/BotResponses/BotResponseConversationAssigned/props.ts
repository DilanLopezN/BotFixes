import { BotResponseProps } from '../interfaces';
import { Interaction } from '../../../../../model/Interaction';
import { I18nProps } from '../../../../i18n/interface/i18n.interface';
import { Workspace } from '../../../../../model/Workspace';
import { Bot } from 'kissbot-core';

export interface BotResponseConversationAssignedProps extends BotResponseProps, I18nProps{
  interactionList: Interaction[];
  selectedWorkspace: Workspace;
  currentBot: Bot;
}