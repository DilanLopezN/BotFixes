import { Component } from 'react';
import { Select } from 'antd';

export class CustomSelect extends Component<any> {
    render() {
        const { value, options, placeholder, onChange, onBlur, disabled, notClearable, menuPlacement, style } = this
            .props as any;

        const placement = menuPlacement === 'top' ? 'topLeft' : 'bottomLeft';

        return (
            <Select
                showSearch
                size='large'
                allowClear={!notClearable}
                placeholder={placeholder}
                options={options}
                value={value as any}
                onChange={(val) => {
                    onChange && onChange(val ?? null);
                }}
                onBlur={onBlur}
                disabled={disabled}
                placement={placement as any}
                labelInValue
                filterOption={(input, option) =>
                    (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
                style={{ width: '100%', ...style }}
            />
        );
    }
}
