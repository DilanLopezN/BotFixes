import { Select } from 'antd';
import { HealthFlowSteps } from 'kissbot-core';
import { FC } from 'react';
import { I18nProps } from '../../../../../../../i18n/interface/i18n.interface';
import i18n from '../../../../../../../i18n/components/i18n';

interface FlowStepSelectorProps {
    initialValue?: any;
    onChange?: (value: string | null) => void;
    maxTagCount?: number;
    disabled?: boolean;
}

const FlowStepSelector: FC<FlowStepSelectorProps & I18nProps> = ({
    getTranslation,
    initialValue,
    onChange,
    maxTagCount,
    disabled,
}) => {
    const options: any[] = [];

    Object.keys(HealthFlowSteps).forEach((entityType) => {
        options.push(
            <Select.Option
                value={HealthFlowSteps[entityType]}
                label={getTranslation(entityType)}
                title={getTranslation(entityType)}
            >
                {getTranslation(entityType)}
            </Select.Option>
        );
    });

    return (
        <Select
            maxTagCount={maxTagCount}
            allowClear
            autoClearSearchValue={false}
            disabled={disabled}
            key={`${disabled ? 'disabled' : ''}`}
            mode='multiple'
            style={{ width: '100%' }}
            placeholder={getTranslation('search by entity')}
            defaultValue={disabled ? undefined : initialValue ?? undefined}
            filterOption={(search, opt) => {
                return (opt?.label as string)?.toLowerCase().search(search?.toLowerCase()) > -1;
            }}
            onChange={(entityIds) => {
                onChange?.(entityIds);
            }}
            optionLabelProp='label'
        >
            {options}
        </Select>
    );
};

export default i18n(FlowStepSelector) as FC<FlowStepSelectorProps>;
