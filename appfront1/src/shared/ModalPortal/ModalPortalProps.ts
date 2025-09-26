export enum ModalPosition {
    left = "left",
    right = "right",
    center = "center"
}

export interface ModalPortalProps {
    position?: ModalPosition; //Possible values "left", "right", "center"
    width?: string;
    height?: string;
    isOpened?: boolean;
    overflowY?: string;
    className?: string;
    onClickOutside?: (...args: any) => any;
    maxHeight?: string;
    minHeight?: string;
    maxWidth?: string;
    minWidth?: string;
    children?: React.ReactNode
}
