import { Input, Select } from 'antd';
import { Field } from 'formik';
import React from 'react';

type AnyProps = any;

const toAntDSelectChildren = (children: React.ReactNode): React.ReactNode => {
    const { Option, OptGroup } = Select as any;
    const nodes = React.Children.toArray(children) as any[];
    return nodes
        .map((child: any, idx: number) => {
            if (!React.isValidElement(child)) return null;
            const el = child as React.ReactElement<any>;
            if (typeof el.type === 'string' && el.type === 'option') {
                const { value, disabled } = (el.props as any) || {};
                if (disabled && (value === '' || value === undefined)) return null;
                return (
                    <Option key={`opt-${idx}-${value}`} value={value} disabled={disabled}>
                        {el.props?.children}
                    </Option>
                );
            }
            if (typeof el.type === 'string' && el.type === 'optgroup') {
                const label = (el.props as any)?.label;
                const groupChildren = toAntDSelectChildren((el.props as any)?.children);
                return (
                    <OptGroup key={`grp-${idx}-${label}`} label={label}>
                        {groupChildren}
                    </OptGroup>
                );
            }
            return el;
        })
        .filter(Boolean);
};

const getPlaceholderFromChildren = (children: React.ReactNode): string | undefined => {
    const nodes = React.Children.toArray(children) as any[];
    for (const child of nodes) {
        if (!React.isValidElement(child)) continue;
        const el = child as React.ReactElement<any>;
        if (typeof el.type === 'string' && el.type === 'option') {
            const { value, disabled } = (el.props as any) || {};
            const label = (el.props as any)?.children;
            if (disabled && (value === '' || value === undefined)) {
                return typeof label === 'string' ? label : undefined;
            }
        }
        if (typeof el.type === 'string' && el.type === 'optgroup') {
            const ph = getPlaceholderFromChildren((el.props as any)?.children);
            if (ph) return ph;
        }
    }
    return undefined;
};

export const StyledFormikField: React.FC<AnyProps> = (props) => {
    const { name, component, children, onChange, onBlur, placeholder, style, className, ...rest } = props as AnyProps;

    return (
        <Field name={name}>
            {({ field, form }: AnyProps) => {
                const callUserOnChange = (eLike: any) => {
                    if (typeof onChange === 'function') onChange(eLike);
                };
                const callUserOnBlur = (eLike: any) => {
                    if (typeof onBlur === 'function') onBlur(eLike);
                };

                if (component === 'select') {
                    const antChildren = toAntDSelectChildren(children);
                    const derivedPlaceholder = placeholder ?? getPlaceholderFromChildren(children);

                    const isMultiple =
                        !!(props as AnyProps)?.multiple ||
                        (rest as AnyProps)?.mode === 'multiple' ||
                        (rest as AnyProps)?.mode === 'tags';

                    const normalizedValue = isMultiple
                        ? Array.isArray(field.value)
                            ? (field.value as any[])
                                  .filter((v) => v !== '' && v !== undefined && v !== null)
                                  .map((v) => String(v))
                            : []
                        : field.value === '' || field.value === undefined || field.value === null
                        ? undefined
                        : String(field.value);

                    const selectMode = (props as AnyProps)?.multiple ? 'multiple' : (rest as AnyProps)?.mode;
                    const allowClear = isMultiple
                        ? (normalizedValue as any[]).length > 0
                        : normalizedValue !== undefined;

                    return (
                        <Select
                            mode={selectMode}
                            value={normalizedValue}
                            onChange={(val: any) => {
                                form.setFieldValue(name, val);
                                callUserOnChange({ target: { name, value: val } });
                            }}
                            onBlur={() => {
                                form.setFieldTouched(name, true);
                                callUserOnBlur({ target: { name, value: form?.values?.[name] } });
                            }}
                            placeholder={derivedPlaceholder}
                            allowClear={allowClear}
                            maxTagCount='responsive'
                            getPopupContainer={(trigger) => trigger.parentElement as HTMLElement}
                            size='large'
                            style={{ width: '100%', ...style }}
                            className={className}
                            {...rest}
                        >
                            {antChildren}
                        </Select>
                    );
                }

                if (component === 'textarea') {
                    return (
                        <Input.TextArea
                            name={name}
                            value={field.value ?? ''}
                            onChange={(e) => {
                                field.onChange(e);
                                callUserOnChange(e);
                            }}
                            onBlur={(e) => {
                                field.onBlur(e);
                                callUserOnBlur(e);
                            }}
                            placeholder={placeholder}
                            size='large'
                            style={{ width: '100%', ...style }}
                            className={className}
                            {...rest}
                        />
                    );
                }

                return (
                    <Input
                        type={props.type || 'text'}
                        name={name}
                        value={field.value ?? ''}
                        onChange={(e) => {
                            field.onChange(e);
                            callUserOnChange(e);
                        }}
                        onBlur={(e) => {
                            field.onBlur(e);
                            callUserOnBlur(e);
                        }}
                        placeholder={placeholder}
                        size='large'
                        style={{ width: '100%', ...style }}
                        className={className}
                        {...rest}
                    />
                );
            }}
        </Field>
    );
};
