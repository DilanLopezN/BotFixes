import { Interaction } from '../../../../../model/Interaction';
import { MessageEntryError } from '../../../pages/BotDetail/BotDetailProps';

export interface TreeProps {
    interactionList: Interaction[];
    failedResponseIds?: MessageEntryError[];
}

export interface TreeState {
    welcome: Interaction | any;
}
