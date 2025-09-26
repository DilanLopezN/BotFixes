import { TemplateMessage } from '../../../../../liveAgent/components/TemplateMessageList/interface';
import { Tag } from '../../../../../liveAgent/components/TagSelector/props';
import { ChannelConfig } from '../../../../../../model/Bot';

export interface TemplateItemProps {
    template: TemplateMessage;
    onEditTemplate: Function;
    workspaceTags: Tag[];
    workspaceId: string;
    user: any;
    workspaceChannelConfigs?: ChannelConfig[];
}
