import type { SelectProps } from 'antd';
import { Select } from 'antd';
import { Component } from 'react';
import { CustomCreatableSelectProps } from './CustomCreatableSelectProps';

interface LabeledValue {
    value: string | number;
    label: string;
    isCreateOption?: boolean;
    inputValue?: string;
}

interface CustomCreatableSelectState {
    internalOptions: LabeledValue[];
    searchValue: string;
}

const CREATE_OPTION_PREFIX = '__create__::';

export class CustomCreatableSelect extends Component<CustomCreatableSelectProps, CustomCreatableSelectState> {
    state: CustomCreatableSelectState = {
        internalOptions: [],
        searchValue: '',
    };

    componentDidMount() {
        const { options = [] } = this.props;
        this.setState({ internalOptions: options });
    }

    componentDidUpdate(prevProps: CustomCreatableSelectProps) {
        if (prevProps.options !== this.props.options) {
            this.setState({ internalOptions: this.props.options });
        }
    }

    render() {
        const { value, placeholder, onCreateOption, onChange, onBlur, disabled} = this.props;

        const { internalOptions, searchValue } = this.state;

        const normalizedValue =
            value && typeof value === 'object' ? value : value ? { value, label: String(value) } : undefined;

        const trimmedSearch = searchValue.trim();
        const normalizedSearch = trimmedSearch.toLowerCase();
        const hasMatchingOption = trimmedSearch
            ? internalOptions.some((option) => {
                  const valueAsString = option.value?.toString().toLowerCase();
                  const labelAsString = option.label?.toString().toLowerCase();
                  return valueAsString === normalizedSearch || labelAsString === normalizedSearch;
              })
            : false;

        const creatableOption: LabeledValue[] =
            trimmedSearch && !hasMatchingOption
                ? [
                      {
                          value: `${CREATE_OPTION_PREFIX}${trimmedSearch}`,
                          label: `Adicionar '${trimmedSearch}'`,
                          isCreateOption: true,
                          inputValue: trimmedSearch,
                      },
                  ]
                : [];

        const combinedOptions = [...internalOptions, ...creatableOption];

        const handleSearch: NonNullable<SelectProps['onSearch']> = (searchText) => {
            this.setState({ searchValue: searchText });
        };

        const handleSelect: SelectProps['onSelect'] = (_, option: any) => {
            if (option?.isCreateOption) {
                const inputValue = option?.inputValue?.trim();
                if (!inputValue) return;

                const newOption = { value: inputValue, label: inputValue };

                this.setState((prev) => {
                    const alreadyExists = prev.internalOptions.some(
                        (existing) => existing.value === newOption.value || existing.label === newOption.label,
                    );

                    return {
                        internalOptions: alreadyExists ? prev.internalOptions : [...prev.internalOptions, newOption],
                        searchValue: '',
                    };
                });

                if (onCreateOption) onCreateOption(inputValue);
                if (onChange) onChange(newOption);
                return;
            }

            this.setState({ searchValue: '' });
        };

        const handleDropdownVisibleChange = (open: boolean) => {
            if (!open) {
                this.setState({ searchValue: '' });
            }
        };

        const handleChange: SelectProps['onChange'] = (val: any) => {
            if (val?.value && typeof val.value === 'string' && val.value.startsWith(CREATE_OPTION_PREFIX)) {
                return;
            }

            this.setState({ searchValue: '' });
            onChange && onChange(val);
        };

        return (
            <Select
                size='large'
                style={{ width: '100%' }}
                showSearch
                onSearch={handleSearch}
                allowClear
                labelInValue
                placeholder={placeholder}
                disabled={disabled}
                options={combinedOptions as SelectProps['options']}
                value={normalizedValue as any}
                onChange={handleChange}
                onSelect={handleSelect}
                onDropdownVisibleChange={handleDropdownVisibleChange}
                onBlur={onBlur}
                filterOption={(input, option) =>
                    (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
            />
        );
    }
}
