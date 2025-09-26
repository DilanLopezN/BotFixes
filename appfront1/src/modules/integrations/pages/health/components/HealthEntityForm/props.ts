import { HealthEntity } from "../../../../../../model/Integrations";

export interface HealthEntityFormProps {
    entity: HealthEntity;
    workspaceId: string;
    integrationId: string;
    integrationType: string;
    onEntitySaved: (entity: HealthEntity) => any
    onClose: () => any
}
