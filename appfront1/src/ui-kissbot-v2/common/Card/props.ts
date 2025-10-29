import { ColorType } from "../../theme";

export default interface CardProps {
    selected?: boolean;
    disabled?: boolean;
    border?: string;
    height?: string;
    width?: string;
    padding?: string;
    margin?: string;
    position?: string;
    cursor?: string;
    borderRadius?: string;
    labelColor?: string | boolean;
    selectedColor?: string;
    selectedBgColor?: string;
    onClick?: (...params) => any;
    onMouseOver?: (...params) => any;
    onMouseOut?: (...params) => any;
    colorType?: ColorType;
    borderLeft?: string;
    borderBottom?: string;
    borderTop?: string;
    borderRight?: string;
    flexDirection?: string;
    justifyContent?: string;
    title?: string;
    header?: any;
    styleHeader?: StyleHeader;
    children?: React.ReactNode
}


interface StyleHeader {
    height?: string;
    color?: string;
    bgColor?: string;
    fontSize?: string;
    padding?: string;
    fontWeight?: string;
    textTransform?: string;
}
