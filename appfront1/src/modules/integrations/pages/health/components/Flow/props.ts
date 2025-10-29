import { HealthIntegration } from "../../../../../../model/Integrations";

export interface FlowProps {
    integration: HealthIntegration;
    workspaceId: string;
    setSelectedIntegration: (integration: HealthIntegration) => void;
}
