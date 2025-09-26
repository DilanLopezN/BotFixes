import { Bot, User } from 'kissbot-core';
import { RouteComponentProps } from 'react-router';
import { Interaction } from '../../../../../model/Interaction';
import { Workspace } from '../../../../../model/Workspace';
import { MessageEntryError } from '../../../pages/BotDetail/BotDetailProps';
import { I18nProps } from './../../../../i18n/interface/i18n.interface';

export interface TreeHeaderProps extends RouteComponentProps, I18nProps {
    interactionList: Array<Interaction>;
    interaction: Interaction;
    currentInteraction: Interaction;
    isExecuting?: boolean;
    currentBot: any;
    botList: Bot[];
    workspaceList: Workspace[];
    loggedUser: User;
    setInteractionList: (...params) => any;
    setCurrentInteraction: (...params) => any;
    setValidateInteraction: (...params) => any;
    failedResponseIds?: MessageEntryError[];
}

export interface TreeHeaderState {
    isHoveringNameContainer: boolean;
    isOpenedModalDelete: boolean;
    isOpenedModalCopy: boolean;
}
