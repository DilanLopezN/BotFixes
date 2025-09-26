export interface LabelWrapperProps {
    tooltip?: string;
    tooltipStyle?: any;
    label?: string | React.ReactNode;
    asTitle?: boolean;
    validate?: {
        fieldName: string;
        errors: any;
        touched: any;
        isSubmitted: boolean;
        ignoreErrorMessage?: string[];
    };
    children?: React.ReactNode;
}
