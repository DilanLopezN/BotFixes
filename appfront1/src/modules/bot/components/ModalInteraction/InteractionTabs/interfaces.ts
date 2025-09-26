import { Select } from 'antd';
import { Interaction } from '../../../../../model/Interaction';
import { I18nProps } from '../../../../i18n/interface/i18n.interface';
import { TABS } from '../ModalInteraction/tabs.enum';

export const { Option } = Select;

export interface InteractionTabsProps extends I18nProps {
    preview?: boolean;
    menuTab: TABS;
    onSelectTab: (tab: TABS) => void;
    onSelectLanguage: (language: string) => void;
    currentInteraction: Interaction;
    unchangedInteraction?: Interaction;
}
export interface Tab {
    label: string;
    key: string;
}
