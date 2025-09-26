import { HealthFlow } from "kissbot-core";
import { EntitiesType, FiltersPagination } from "../..";
import { HealthIntegration } from "../../../../../../../../model/Integrations";

export interface FlowTableProps {
    flows: HealthFlow[];
    setFlows: Function;
    entities: EntitiesType;
    onUpdateFlow: (flow: HealthFlow) => void;
    integration: HealthIntegration;
    workspaceId: string;
    onCreateFlow: (flow: Partial<HealthFlow>) => Promise<HealthFlow>;
    creatingFlow: boolean;
    handleAddFlow: () => void;
    cancelCreatingFlow: () => void;
    deleteFlow: (id: string) => void;
    getFlows: (value: FiltersPagination) => void;
    filters: FiltersPagination;
    setFilters: (value: FiltersPagination) => void;
    loading: boolean;
}
