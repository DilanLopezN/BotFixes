import { FormProps } from '../../../../../interfaces/FormProps';
import { Interaction } from '../../../../../model/Interaction';

export interface ModalInteractionHeaderFormProps extends FormProps {
    name: string | String;
    preview?: boolean;
    children?: React.ReactNode;
    unchangedInteraction?: Interaction;
    onPublish: () => boolean;
    onInteractionsPending: (interactionPending: Interaction[]) => void;
}
