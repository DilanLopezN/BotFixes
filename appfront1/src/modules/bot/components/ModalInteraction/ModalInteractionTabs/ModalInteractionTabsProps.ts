import { I18nProps } from './../../../../i18n/interface/i18n.interface';
import { Interaction } from "../../../../../model/Interaction";
import { TABS } from './ModalInteractionTabs';

export interface ModalInteractionTabsProps extends I18nProps{
    onSelectTab: (tabName: string) => any;
    onSelectLanguage: (...params: any) => any;
    currentInteraction: Interaction;
    unchangedInteraction?: Interaction;
    tab: TABS;
    preview?: boolean;
}

export interface ModalInteractionTabsState{
    selectedTab: string;
}