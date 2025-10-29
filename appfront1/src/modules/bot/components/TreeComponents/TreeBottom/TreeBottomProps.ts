import { I18nProps } from './../../../../i18n/interface/i18n.interface';
import { Interaction } from "../../../../../model/Interaction";
import { RouteComponentProps } from "react-router";

export interface TreeBottomProps extends RouteComponentProps, I18nProps {
    interactionList: Array<Interaction>;
    interaction: Interaction;
    currentExecutingInteraction: string[];
    setInteractionList: (...params) => any;
    setCurrentInteraction: (...params) => any;
    setValidateInteraction: (...params) => any;
}


export interface TreeBottomState {
    isOpenedNewInteractioPopover: boolean;
    hasFallback: boolean;
    isOpenedModalDelete: boolean;
}