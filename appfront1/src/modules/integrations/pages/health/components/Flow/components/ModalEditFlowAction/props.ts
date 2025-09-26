import { FlowAction, HealthFlow } from "kissbot-core";


export interface ModalEditFlowActionProps {
    isOpened: boolean;
    onClose: Function;
    flow: HealthFlow;
    onActionsChanged: (id: string, actions: FlowAction[]) => void;
    workspaceId: string;
}
