import { Entity } from 'kissbot-core/lib';
import { BotAttribute } from './../../../../../../../model/BotAttribute';
import { I18nProps } from './../../../../../../i18n/interface/i18n.interface';
import { Interaction } from '../../../../../../../model/Interaction';
import { IButton } from 'kissbot-core';

export interface ExposedButtonFormModalProps extends I18nProps {
    isSubmitted: boolean;
    button: IButton;
    onChange: (button: IButton) => any;
    onClose: () => any;
    onDelete: () => any;
}

export interface ButtonFormModalProps extends ExposedButtonFormModalProps {
    interactionList: Array<Interaction>;
    botAttributes: Array<BotAttribute>;
    entitiesList: Array<Entity>;
    buildAsQuickReply?: boolean;
    buildAsList?: boolean;
}

export interface ButtonFormModalState {
    isOpenedDismissModal: boolean;
    viewSelected: ButtonFormView;
}

export enum ButtonFormView {
    'general' = 'general',
    'actions' = 'actions',
}
