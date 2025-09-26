import { ColorType } from "../../theme";

export interface ButtonProps {
    id?: string;
    outline?: Boolean;
    icon?: string;
    active?: Boolean;
    onClick?: Function;
    width?: string;
    minWidth?: string;
    minHeight?: string;
    height?: string;
    padding?: string;
    margin?: string;
    className?: string;
    colorType?: ColorType;
    fontSize?: string;
    disabled?: boolean;
    style?: any;
    whiteSpace?: string;
    tabIndex?: number;
    loading?: boolean;
    title?: string;
    children?: React.ReactNode
}
