import { Interaction } from '../../../../../model/Interaction';

export interface ActionProps {
    onChange: (action: string) => void;
    currentInteraction: Interaction;
}
