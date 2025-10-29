export interface CommonFilterProps {
    onKeyPress?: (args: any) => any;
    onChange?: (args: any) => any;
    submitted?: (args: any) => any;
    initialValue?: string | number;
    placeholder?: string;
    autofocus?: boolean;
    disabled?: boolean;
    allowClear?: boolean;
}
