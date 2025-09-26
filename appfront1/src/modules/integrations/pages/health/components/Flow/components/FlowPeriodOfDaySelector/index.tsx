import { Select } from 'antd';
import { FC, useState } from 'react';
import { I18nProps } from '../../../../../../../i18n/interface/i18n.interface';
import i18n from '../../../../../../../i18n/components/i18n';
import { FlowPeriodOfDay } from 'kissbot-core';

interface FlowPeriodOfDaySelectorProps {
    initialValue?: any;
    onChange: (value: string) => void;
    disabled?: boolean;
}

const FlowPeriodOfDaySelector: FC<FlowPeriodOfDaySelectorProps & I18nProps> = ({
    getTranslation,
    initialValue,
    onChange,
    disabled,
}) => {
    const [value, setValue] = useState(initialValue);

    const getValue = (value: number) => {
        return getTranslation(FlowPeriodOfDay?.[value] ?? undefined);
    };

    return (
        <Select
            value={getValue(value)}
            disabled={disabled}
            dropdownStyle={{ width: 300 }}
            style={{ width: '100%' }}
            onChange={(value) => {
                setValue(value);
                onChange(value as string);
            }}
            placeholder={getTranslation('Select period')}
            allowClear
        >
            <Select.Option value={FlowPeriodOfDay.morning} title={getTranslation('morning')}>
                {getTranslation('morning')}
            </Select.Option>
            <Select.Option value={FlowPeriodOfDay.afternoon} title={getTranslation('afternoon')}>
                {getTranslation('afternoon')}
            </Select.Option>
            <Select.Option value={FlowPeriodOfDay.indifferent} title={getTranslation('indifferent')}>
                {getTranslation('indifferent')}
            </Select.Option>
        </Select>
    );
};

export default i18n(FlowPeriodOfDaySelector) as FC<FlowPeriodOfDaySelectorProps>;
