import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { Workspace } from '../../../../model/Workspace';
import { RouteComponentProps } from 'react-router-dom';

export interface AIAgentProps extends I18nProps, RouteComponentProps {
    menuSelected: any;
    selectedWorkspace: Workspace;
    addNotification: (notification: any) => void;
}