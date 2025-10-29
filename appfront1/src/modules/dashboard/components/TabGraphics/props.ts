import { User } from "kissbot-core";
import { Workspace } from "../../../../model/Workspace";
import { MenuProps } from "../../../../ui-kissbot-v2/common/MenuProps/props";

export interface TabGraphicsProps {
    selectedWorkspace: Workspace;
    menuSelected: MenuProps;
    loggedUser: User;
}
