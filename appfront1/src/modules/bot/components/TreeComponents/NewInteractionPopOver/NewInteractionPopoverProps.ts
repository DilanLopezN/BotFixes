import { Interaction } from '../../../../../model/Interaction';

export interface NewInteractionPopoverProps {
    isOpened: boolean;
    interaction: Interaction;
    hasFallback: boolean;
}

export interface NewInteractionPopoverState {
    isSubmitting: boolean;
    selectedType: NewInteractionType | undefined;
    isOpened: boolean;
}

export enum NewInteractionType {
    INTERACTION = 'INTERACTION',
    REFERENCE = 'REFERENCE',
    CONTAINER = 'CONTAINER',
    CONTEXT_FALLBACK = 'CONTEXT_FALLBACK',
}
