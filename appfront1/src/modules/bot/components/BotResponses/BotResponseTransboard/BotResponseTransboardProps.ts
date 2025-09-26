import { BotResponseProps } from '../interfaces';
import { Interaction } from '../../../../../model/Interaction';
import { Bot } from '../../../../../model/Bot';
import { I18nProps } from '../../../../i18n/interface/i18n.interface';
import { Workspace } from '../../../../../model/Workspace';

export interface BotResponseTransboardProps extends BotResponseProps, I18nProps {
    interactionList: Interaction[];
    currentBot: Bot;
    selectedWorkspace: Workspace;
}
