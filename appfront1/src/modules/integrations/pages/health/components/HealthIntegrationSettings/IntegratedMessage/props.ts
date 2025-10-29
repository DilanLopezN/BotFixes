import { HealthIntegration } from '../../../../../../../model/Integrations';

export enum IntegrationMessages {
    confirmSchedule = 'confirmSchedule',
    avaliableScheduleInList = 'avaliableScheduleInList',
    confirmScheduleWithLinkButtonTitle = 'confirmScheduleWithLinkButtonTitle',
}

export interface IntegratedMessageProps {
    workspaceId: string;
    onClose: () => any;
    getTranslation: (string) => any;
    integration: HealthIntegration;
    onIntegrationUpdated?: (integration: HealthIntegration) => void;
}
