import {Interaction} from "../../../../../../model/Interaction";

export interface CommentsTabProps {
    currentInteraction: Interaction;
    setCurrentInteraction: (...params)=> any;
    children?: React.ReactNode;
}
