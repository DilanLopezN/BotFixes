import { User } from "kissbot-core";
import { Workspace } from "../../../../model/Workspace";

export interface HomeProps {
    selectedWorkspace: Workspace;
    loggedUser: User;
}
