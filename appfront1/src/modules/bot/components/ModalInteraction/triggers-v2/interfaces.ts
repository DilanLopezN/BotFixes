import { Interaction } from '../../../../../model/Interaction';

export interface TriggersProps {
    onChange: (triggers: String[], isValid: boolean) => void;
    currentInteraction: Interaction;
    children?: React.ReactNode;
    setCurrentInteraction?: (interaction: Interaction) => void;
}

export interface TriggersFormValues {
    triggers: String[];
    name: string;
}
