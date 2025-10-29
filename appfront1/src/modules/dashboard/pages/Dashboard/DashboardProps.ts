import { User } from "kissbot-core";
import { RouteComponentProps } from "react-router";
import { Workspace } from '../../../../model/Workspace';

export interface DashboardProps extends RouteComponentProps {
    selectedWorkspace: Workspace
    loggedUser: User;
}
