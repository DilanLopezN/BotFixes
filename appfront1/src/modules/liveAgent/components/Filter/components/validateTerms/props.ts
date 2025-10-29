export interface ValidateTermsProps {
    onConfirm: () => void;
    visible: boolean;
    sizeLimit: number;
    onVisibleChange: (visible: boolean) => void;
    children?: React.ReactNode;
}
