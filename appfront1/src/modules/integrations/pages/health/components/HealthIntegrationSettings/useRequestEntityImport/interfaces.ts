import { HealthIntegration } from '../../../../../../../model/Integrations';

export interface RequestEntityImportParams {
    workspaceId: string;
    integration: HealthIntegration;
    addNotification: Function;
    getTranslation: (text?: string) => string;
    integrations: HealthIntegration[];
    setSelectedIntegration: (integration: HealthIntegration) => void;
}
