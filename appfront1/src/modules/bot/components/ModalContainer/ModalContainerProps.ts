import { I18nProps } from './../../../i18n/interface/i18n.interface';
import { RouteComponentProps } from 'react-router';
import { Interaction } from '../../../../model/Interaction';

export interface ModalConatinerProps extends RouteComponentProps, I18nProps {
    currentInteraction: Interaction;
    validateInteraction: Interaction;
    modalInteractionSubmitted: boolean;
    setCurrentInteraction: (...params) => any;
    setModalSubmitted: (isSubmitted: boolean) => any;
    setInteractionList: (interactionList: Array<Interaction>) => any;
    interactionList: Interaction[];
    setValidateInteraction: (...params) => any;
    match: any;
}

export interface ModalInteractionState {
    interaction: Interaction | undefined;
    isSubmitting: boolean | undefined;
    modalChangeOpen;
    originalNameContainer: any;
    hasUnsavedChanges:boolean
}
