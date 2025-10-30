import { User } from 'kissbot-core';
import { RouteComponentProps } from 'react-router';
import { Bot } from '../../../../model/Bot';
import { BotAttribute } from '../../../../model/BotAttribute';
import { Interaction } from '../../../../model/Interaction';
import { I18nProps } from './../../../i18n/interface/i18n.interface';
import { GotoReference } from '../../Interfaces/goto-references.interface';

interface pendingPublicationProps {
    pendingFlows: boolean;
    pendingEntities: boolean;
}

export interface MessageEntryError {
    _id: string;
    name: string;
    responses: string[];
}

export interface BotDetailProps extends RouteComponentProps, I18nProps {
    setCurrentExecutingInteraction: (...params: any) => any;
    setCurrentInteraction: (...params: any) => any;
    setValidateInteraction: (...params: any) => any;
    setInteractionList: (...params: any) => any;
    setBotAttributes: (botAttributes: Array<BotAttribute>) => any;
    setBotList: (...params) => any;
    setCurrentBot: (...params: any) => any;
    setChannelList: (...params: any) => any;
    currentInteraction: Interaction;
    unchangedInteraction?: Interaction;
    validateInteraction: Interaction;
    setWorkspaceBots: Function;
    setEntities: Function;
    loggedUser: User;
    botList: any[];
    interactionList: any[];
}

export interface BotDetailState {
    bot: Bot | undefined;
    treeZoom: number;
    currentExternalInteractionId: string | undefined;
    showActivityInfo: boolean;
    activity: any;
    modalRevert: boolean;
    loadingDisabledPublish: boolean;
    viewPending: boolean;
    collapseType?: 'expanded' | 'collapsed';
    interactionsPendingPublication: any[];
    pendingPublication?: pendingPublicationProps;
    publishErrors: MessageEntryError[];
    gotoErrorModal: {
        visible: boolean;
        interactionId: string | null;
        interactionName: string | null;
        references: GotoReference[] | null;
    };
}
