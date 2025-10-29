import { I18nProps } from './../../../../i18n/interface/i18n.interface';
import { Interaction } from '../../../../../model/Interaction';
import { RouteComponentProps } from 'react-router';
import { Bot } from '../../../../../model/Bot';
import { Workspace } from '../../../../../model/Workspace';
import { TABS } from './tabs.enum';
import { OrganizationSettings } from 'kissbot-core';

interface ModalInteractionProps extends RouteComponentProps, I18nProps {
    selectedLanguage: string;
    currentInteraction: Interaction;
    unchangedInteraction?: Interaction;
    validateInteraction: Interaction;
    modalInteractionSubmitted: boolean;
    setCurrentInteraction: (...params) => any;
    setUnchangedInteraction: (...params) => any;
    setModalSubmitted: (isSubmitted: boolean) => any;
    setInteractionList: (interactionList: Array<Interaction>) => any;
    setValidateInteraction: (...params) => any;
    setSelectedLanguage: (...params) => any;
    preview?: boolean;
    interactionList: Interaction[];
    currentBot: Bot;
    selectedWorkspace: Workspace;
    children?: React.ReactNode;
    onResetCollapseType?: Function;
    setInteractionsPendingPublication: Function;
    setPendingPublication: (interactionList: Interaction[]) => void;
}

export interface ModalInteractionState {
    interaction: Interaction | undefined;
    selectedTab: TABS;
    isSubmitting: boolean | undefined;
    fetchingInteraction: boolean;
    errorFetchInteraction: boolean;
    modalChangeOpen: boolean;
}

interface SettingsProps {
    settings: OrganizationSettings & { generalFeatureFlag: { [key: string]: any } };
}

export type CombinedProps = ModalInteractionProps & SettingsProps;
