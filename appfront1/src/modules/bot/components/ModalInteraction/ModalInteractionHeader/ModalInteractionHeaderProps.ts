import { Interaction } from '../../../../../model/Interaction';

export interface ModalInteractionHeaderProps {
    onSubmit: (...params) => any;
    onCloseModal: (...params) => any;
    onPublish: () => boolean;
    currentInteraction: Interaction;
    preview?: boolean;
    setPendingPublication: (interactionList: Interaction[]) => void;
}
