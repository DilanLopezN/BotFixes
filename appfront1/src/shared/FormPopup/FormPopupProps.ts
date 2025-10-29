export interface FormPopupProps{
    isOpenedPopover: boolean;
    popupBody: any;
    position?: string;
    onClose: (...params) => any;
    trigger?: string;
    preferPlace?: string;
    children?: React.ReactNode;
}

export interface FormPopupState{
    isOpenedPopover: boolean;
}
