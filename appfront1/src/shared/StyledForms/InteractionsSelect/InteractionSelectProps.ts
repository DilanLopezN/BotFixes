import { MenuPlacement } from 'react-select';
import { Interaction } from '../../../model/Interaction';

export interface InteractionSelectProps {
    options: Interaction[];
    defaultValue?: string;
    placeholder?: string;
    onCreateOption?: (...params) => any;
    onChange: (...params) => any;
    onBlur?: (...params) => any;
    interactionTypeToShow?: string[];
    name?: string;
    style?: any;
    placement?: MenuPlacement;
}

export interface InteractionSelectState {
    interactions: Interaction[];
}
