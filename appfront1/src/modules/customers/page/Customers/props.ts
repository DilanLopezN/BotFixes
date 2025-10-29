import { User } from 'kissbot-core';
import { RouteComponentProps } from 'react-router-dom';
import { Workspace } from '../../../../model/Workspace';

export interface CustomersProps extends RouteComponentProps {
    selectedWorkspace: Workspace;
    loggedUser: User;
}