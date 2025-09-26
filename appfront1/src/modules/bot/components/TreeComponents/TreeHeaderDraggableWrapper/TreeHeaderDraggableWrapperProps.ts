import { Interaction } from '../../../../../model/Interaction';
import { MessageEntryError } from '../../../pages/BotDetail/BotDetailProps';

export interface TreeHeaderDraggableWrapperProps {
    interaction: Interaction;
    isExecuting?: boolean;
    connectDragSource: (...params) => any;
    failedResponseIds?: MessageEntryError[];
}
