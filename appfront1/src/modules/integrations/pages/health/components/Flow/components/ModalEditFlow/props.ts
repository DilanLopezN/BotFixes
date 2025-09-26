import { HealthFlow } from 'kissbot-core';
import { EntitiesType } from '../..';

export interface ModalEditFlowProps {
    isOpened: boolean;
    onClose: Function;
    flow: HealthFlow;
    updateFlow: (flow: HealthFlow) => void;
    fields: string[];
    entities: EntitiesType;
    integrationType: string;
}
