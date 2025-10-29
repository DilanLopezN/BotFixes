export interface CreatableSelectTagsProps {
    value: any;
    placeholder: string;
    onChange?: (...params) => any;
    onBlur?: (...params) => any;
    isDisabled: boolean;
    onCreateOption?: (args: any) => any;
    options?: { label: string; value: string }[];
    overflowValue?: boolean;
    formatCreateLabel?: (value) => string;
    isValidNewOption?: (args: any) => any;
    autoFocus?: boolean;
    menuPlacement?: 'top' | 'bottom';
    menuIsOpen?: boolean;
    inputValue?: string;
    onInputChange?: (
        value: string,
        actionMeta: { action: 'set-value' | 'input-change' | 'input-blur' | 'menu-close' }
    ) => void;
}
