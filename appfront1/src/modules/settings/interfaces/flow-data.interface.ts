import { Flow } from "./flow.interface";

export interface FlowData {
    id: number;
    workspaceId: string;
    name: string;
    flowId: number;
    flowScreen: string;
    data?: Record<string, any>;

    flow?: Flow;
}
