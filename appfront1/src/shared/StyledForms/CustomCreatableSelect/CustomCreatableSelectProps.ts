export interface CustomCreatableSelectProps {
    options: Array<any>;
    value: any;
    placeholder: string;
    onCreateOption?: (...params) => any;
    onChange: (...params) => any;
    onBlur?: (...params) => any;
    disabled?: boolean;
}
