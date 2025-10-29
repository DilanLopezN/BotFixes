import { Identity } from "../../interfaces/conversation.interface";

export interface AvatarIconAgroupedProps {
    agents: Identity[];
    disabled: boolean;
    maxAvatarVisible: number;
}