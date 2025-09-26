import { OptionModalMenu } from './';

export interface MenuSelectionProps {
    options: OptionModalMenu[];
    onSelect: Function;
    selected: OptionModalMenu;
}