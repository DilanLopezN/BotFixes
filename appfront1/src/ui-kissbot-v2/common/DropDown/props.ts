import { ColorType } from "../../theme";

export interface DropDownProps {
    onClick?: Function;
    itens: Array<ItemDropDown>;
    width?: string;
    margin?: string;
    height?: string;
    colorType?: ColorType;
    iconName?: string;
    iconSmall?: boolean;
    right?: boolean;
    title?: string;
    handleClick?: Function;
    selected?: string;
    children?: React.ReactNode;
}

interface ItemDropDown {
    label: any;
    onClick?: Function;
    icon?: string;
}
