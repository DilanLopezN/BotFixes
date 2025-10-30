import { Select } from 'antd';
import React, { Key, ReactNode, useMemo } from 'react';
import styled from 'styled-components';

const StyledSelect = styled(Select)`
    width: 100%;

    .ant-select-selector {
        box-shadow: 0 2px 15px 0 rgba(0, 0, 0, 0.07);
        background: var(--color8);
        border: 1px solid #d9d9d9 !important;
        color: var(--color7);
        padding: 9px 24px 9px 19px !important;
        font-size: 15px !important;
        font-weight: 400 !important;
        line-height: 22px !important;
        min-height: 42px;
        border-radius: 3px !important;
    }

    &.ant-select-focused .ant-select-selector,
    &:hover .ant-select-selector {
        border: 1px solid rgba(3, 102, 214, 0.6) !important;
        box-shadow: 0 2px 15px 0 rgba(0, 0, 0, 0.07);
    }

    .ant-select-selection-item,
    .ant-select-selection-placeholder {
        color: var(--color7);
        font-size: 15px;
        line-height: 22px;
    }

    .ant-select-selection-placeholder {
        color: var(--color1) !important;
    }
`;

type SimpleSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
    children?: ReactNode;
};

const resolveKey = (candidate: unknown, fallback: string): Key => {
    if (typeof candidate === 'string' || typeof candidate === 'number') {
        return candidate;
    }
    return fallback;
};

const mapChildrenToOptions = (children: ReactNode): ReactNode => {
    return React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return null;

        if (child.type === 'option') {
            const {
                value,
                children: optionChildren,
                disabled,
            } = child.props as React.OptionHTMLAttributes<HTMLOptionElement>;
            let optionValue = value;
            if (optionValue === undefined) {
                if (typeof optionChildren === 'string' || typeof optionChildren === 'number') {
                    optionValue = optionChildren;
                } else {
                    optionValue = `option-${index}`;
                }
            }
            const optionKey = resolveKey(child.key ?? optionValue, `option-${index}`);
            return (
                <Select.Option key={optionKey} value={optionValue as any} disabled={disabled}>
                    {optionChildren}
                </Select.Option>
            );
        }

        if (child.type === 'optgroup') {
            const { label, children: groupChildren } = child.props as React.OptgroupHTMLAttributes<HTMLOptGroupElement>;
            const groupKey = resolveKey(
                child.key ?? (typeof label === 'string' || typeof label === 'number' ? label : undefined),
                `optgroup-${index}`
            );
            return (
                <Select.OptGroup key={groupKey} label={label}>
                    {mapChildrenToOptions(groupChildren)}
                </Select.OptGroup>
            );
        }

        return child;
    });
};

const buildSyntheticEvent = (value: any, name?: string) => ({
    target: { value, name },
    currentTarget: { value, name },
    preventDefault: () => undefined,
    stopPropagation: () => undefined,
});

export const SimpleSelect: React.FC<SimpleSelectProps> = ({
    children,
    value,
    defaultValue,
    onChange,
    onBlur,
    disabled,
    className,
    style,
    placeholder,
    name,
    id,
    autoFocus,
    tabIndex,
    ...rest
}) => {
    const options = useMemo(() => mapChildrenToOptions(children), [children]);
    const extraProps: Record<string, unknown> = {};

    Object.keys(rest).forEach((key) => {
        if (key.startsWith('data-') || key.startsWith('aria-')) {
            extraProps[key] = (rest as Record<string, unknown>)[key];
        }
    });

    return (
        <StyledSelect
            value={value === undefined ? undefined : value}
            defaultValue={defaultValue === undefined ? undefined : (defaultValue as any)}
            onChange={(selectedValue) => {
                if (onChange) {
                    (onChange as any)(buildSyntheticEvent(selectedValue, name));
                }
            }}
            onBlur={() => {
                if (onBlur) {
                    (onBlur as any)(buildSyntheticEvent(value, name));
                }
            }}
            disabled={disabled}
            className={className}
            style={{ width: '100%', ...(style || {}) }}
            placeholder={placeholder as string | undefined}
            showSearch={false}
            id={id}
            autoFocus={autoFocus}
            tabIndex={tabIndex}
            dropdownMatchSelectWidth
            {...extraProps}
        >
            {options}
        </StyledSelect>
    );
};
