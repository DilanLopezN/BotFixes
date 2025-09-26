import {Interaction} from "../../../../../model/Interaction";

export interface LabelsTabProps {
    setCurrentInteraction: (...params) => any;
    currentBot: any;
    currentInteraction: Interaction;
    children?: React.ReactNode;
    setCurrentBot: any;
}
export interface LabelsTabState {
    optionModalList: string;
    onSearchTitleLabel: string;
}
