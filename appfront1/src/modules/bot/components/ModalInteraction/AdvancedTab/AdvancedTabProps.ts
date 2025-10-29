import { Interaction } from "../../../../../model/Interaction";

export interface AdvancedTabProps {
    setCurrentInteraction: (...params) => any;
    currentInteraction: Interaction;
    unchangedInteraction: Interaction;
    children?: React.ReactNode;
}
