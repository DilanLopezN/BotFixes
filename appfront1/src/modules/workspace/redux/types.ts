import { ReduxType } from "../../../interfaces/ReduxTypes";

class WorkspaceTypesClass implements ReduxType{
    prefix = "WORKSPACE__";
    SET_WORKSPACE_LIST = this.prefix + "SET_WORKSPACE_LIST";
    SET_BOT_LIST = this.prefix + "SET_BOT_LIST";
    SET_SELECTED_WORKSPACE = this.prefix + "SET_SELECTED_WORKSPACE";
    SET_CHANNEL_LIST = this.prefix + "SET_CHANNEL_LIST";
    UPDATE_CHANNEL = this.prefix + "UPDATE_CHANNEL";
    DELETE_CHANNEL = this.prefix + "DELETE_CHANNEL";
    ADD_CHANNEL = this.prefix + "ADD_CHANNEL";
    RESET_STORE = this.prefix + "RESET_STORE";
}
export const WorkspaceTypes = new WorkspaceTypesClass();
