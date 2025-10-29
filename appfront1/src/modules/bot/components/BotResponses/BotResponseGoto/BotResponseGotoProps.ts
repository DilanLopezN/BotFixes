import { User } from 'kissbot-core';
import { I18nProps } from './../../../../i18n/interface/i18n.interface';
import { BotResponseProps } from '../interfaces';
import { Bot } from '../../../../../model/Bot';
import { Interaction } from '../../../../../model/Interaction';
import { Workspace } from '../../../../../model/Workspace';

export interface BotResponseGotoProps extends BotResponseProps, I18nProps {
    botList: Array<Bot>;
    interactionList: Array<Interaction>;
    currentInteraction: Interaction;
    match: any;
    workspaceList: Workspace[];
    loggedUser: User;
}
