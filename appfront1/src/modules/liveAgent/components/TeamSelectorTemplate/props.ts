import { Team } from "../../../../model/Team";

export interface TeamSelectorTemplateProps {
    teams: Team[];
    teamSelected: Team | undefined;
    onCancel: Function;
    onConfirm: Function;
    actionName: string;
    opened: boolean;
    onTeamSelected: Function;
    emptyMessage?: string;
    showLeaveConversation?: boolean;
}
