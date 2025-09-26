import { Bot } from 'kissbot-core';
import { Workspace } from '../../../../model/Workspace';
import { I18nProps } from './../../../i18n/interface/i18n.interface';

export interface BotCreateButtonProps extends I18nProps {
    className: string;
    workspaceId: string;
    onCreate: () => any;
    history?: any;
    selectedWorkspace: Workspace;
    setBotList: (botList: Array<Bot>) => any;
    setNameBotFromWorkspace: (botName: string) => void;
}
