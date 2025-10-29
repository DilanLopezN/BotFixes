import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { Workspace } from '../../../../../../model/Workspace';
import { RouteComponentProps } from 'react-router-dom';

interface RouteParams {
    agentId: string;
}

export interface AgentConfigurationProps extends I18nProps, RouteComponentProps<RouteParams> {
    selectedWorkspace: Workspace;
    addNotification: (notification: any) => void;
}