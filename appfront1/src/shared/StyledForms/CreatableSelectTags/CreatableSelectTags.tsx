import { Select } from 'antd';
import { Component } from 'react';
import { CreatableSelectTagsProps } from './CreatableSelectTagsProps';

export class CreatableSelectTags extends Component<CreatableSelectTagsProps> {
    render() {
        const {
            options = [],
            isDisabled,
            placeholder,
            onChange,
            onBlur,
            value,
            onCreateOption,
            formatCreateLabel,
            overflowValue,
            menuPlacement,
            inputValue,
            onInputChange,
            menuIsOpen,
        } = this.props as any;

        const optionValues = new Set((options || []).map((o: any) => o.value));
        const placement = menuPlacement === 'top' ? 'topLeft' : 'bottomLeft';

        return (
            <Select
                mode='tags'
                size='large'
                style={{ width: '100%' }}
                showSearch
                allowClear
                placeholder={placeholder}
                options={options}
                value={value as any}
                labelInValue
                disabled={isDisabled}
                onChange={(vals: any[] | undefined) => {
                    const list = Array.isArray(vals) ? vals : [];

                    if (onCreateOption) {
                        list.forEach((item) => {
                            if (!optionValues.has(item.value)) {
                                onCreateOption(item.value);
                            }
                        });
                    }

                    onChange && onChange(list);
                }}
                onBlur={onBlur}
                placement={placement as any}
                open={menuIsOpen}
                searchValue={inputValue}
                onSearch={(val) => onInputChange && onInputChange(val, { action: 'input-change' })}
                maxTagCount={overflowValue ? 'responsive' : undefined}
                filterOption={(input, option) =>
                    (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
            />
        );
    }
}
