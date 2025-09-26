import { Bot } from '../../model/Bot';
import { Interaction } from '../../model/Interaction';
import { Workspace } from '../../model/Workspace';
import { LabelWrapperProps } from '../../shared/StyledForms/LabelWrapper/LabelWrapperProps';

export interface LabelWrapperInteractionProps extends LabelWrapperProps {
    currentBot: Bot;
    selectedWorkspace: Workspace;
    interaction: string;
    children: React.ReactElement;
    botId?: string;
    workspaceId?: string;
    interactionList?: Interaction[];
}
