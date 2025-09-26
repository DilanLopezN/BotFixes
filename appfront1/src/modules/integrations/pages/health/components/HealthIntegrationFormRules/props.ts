import { HealthIntegration } from '../../../../../../model/Integrations';

export interface HealthIntegrationFormRulesProps {
    integration: HealthIntegration;
    onIntegrationSaved: (entity: HealthIntegration) => any;
    onClose: () => void;
}
