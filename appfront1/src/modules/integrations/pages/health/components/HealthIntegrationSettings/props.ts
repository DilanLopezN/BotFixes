import { HealthIntegration } from '../../../../../../model/Integrations';

interface HealthIntegrationsSettingsProps {
    integration: HealthIntegration;
    integrations: HealthIntegration[];
    onCancelCreatingIntegration: () => void;
    workspaceId: string;
    onIntegrationCreated: (integration: HealthIntegration) => void;
    onChangeIntegrationSelected: (integration: HealthIntegration) => void;
    setSelectedIntegration: (integration: HealthIntegration) => void;
}
interface statusProps {
    name: string;
    online: boolean;
    since: number;
    workspaceId: string;
}
export type { statusProps, HealthIntegrationsSettingsProps };
