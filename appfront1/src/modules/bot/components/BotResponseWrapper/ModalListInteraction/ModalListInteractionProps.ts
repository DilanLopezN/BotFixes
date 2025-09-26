import { I18nProps } from './../../../../i18n/interface/i18n.interface';
import { Interaction } from '../../../../../model/Interaction';
import { Bot, Workspace } from 'kissbot-core';

export interface ModalListInteractionProps extends I18nProps {
    interactionList: Interaction[];
    currentInteraction: Interaction;
    toggleModal: (...params) => any;
    onCopy: (...params) => any;
    workspaceList: Workspace[];
    botList: Bot[];
    currentBot: any;
    copyToIt: boolean;
    touched: boolean;
    errors: any;
    submitted: boolean;
}

export interface ModalListInteractionState {
    selectedItem: string;
    items: any[];
    workspaceId: string;
    botList: Bot[];
    interactionList: Interaction[];
    botId: string;
}
