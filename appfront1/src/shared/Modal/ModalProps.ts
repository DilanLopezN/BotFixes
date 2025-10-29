import { CSSProperties } from "react";

export enum ModalPosition {
    left = "left",
    right = "right",
    center = "center"
}

export interface ModalProps {
    position?: ModalPosition; //Possible values "left", "right", "center"
    width?: string;
    height?: string;
    isOpened?: boolean;
    overflowY?: string;
    className?: string;
    onClickOutside?: (ev?: any) => any;
    style?: CSSProperties;
    children?: React.ReactNode;
}
