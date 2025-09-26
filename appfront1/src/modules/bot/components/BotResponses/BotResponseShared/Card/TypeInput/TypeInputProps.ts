import { I18nProps } from './../../../../../../i18n/interface/i18n.interface';
import { Interaction } from "../../../../../../../model/Interaction";
import { Bot, ResponseButtonType } from "kissbot-core";
import { Workspace } from '../../../../../../../model/Workspace';

export interface TypeInputProps extends I18nProps {
    type: ResponseButtonType;
    currentInteraction: Interaction;
    interactionList: Array<Interaction>;
    selectedWorkspace: Workspace;
    currentBot: Bot;
    value: string;
    touched: any;
    errors: any;
    isSubmitted: boolean;
    setFieldValue: Function;
}

export interface TypeInputState {
    type: string;
}

export interface ExposedTypeInputProps {
    type: ResponseButtonType;
    value: string;
    touched: any;
    errors: any;
    isSubmitted: boolean;
}