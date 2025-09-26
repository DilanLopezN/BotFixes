export interface ButtonSelectProps {
    onChange: (...params) => any;
    value: string | boolean;
    options: { label: string | boolean, value?: string | boolean }[];
}