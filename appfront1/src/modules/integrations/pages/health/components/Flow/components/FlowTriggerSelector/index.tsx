import { Select } from 'antd';
import { FlowTriggerType } from 'kissbot-core';
import { FC } from 'react';
import { I18nProps } from '../../../../../../../i18n/interface/i18n.interface';
import i18n from '../../../../../../../i18n/components/i18n';

interface FlowTriggerSelectorProps {
    initialValue?: any;
    onChange: (value: string | null) => void;
    maxTagCount?: number;
    disabled?: boolean;
}

const FlowTriggerSelector: FC<FlowTriggerSelectorProps & I18nProps> = ({
    getTranslation,
    initialValue,
    onChange,
    maxTagCount,
    disabled,
}) => {
    const options = Object.keys(FlowTriggerType).map((entityType) => (<Select.Option
            value={FlowTriggerType[entityType]}
            label={getTranslation(entityType)}
            title={getTranslation(entityType)}
        >
            {getTranslation(entityType)}
        </Select.Option>
    ));

    return (
        <Select
            maxTagCount={maxTagCount}
            allowClear
            disabled={disabled}
            mode='multiple'
            style={{ width: '100%' }}
            placeholder={getTranslation('search by entity')}
            defaultValue={initialValue}
            filterOption={(search, opt) => {
                return (opt?.label as string)?.toLowerCase().search(search?.toLowerCase()) > -1;
            }}
            onChange={(entityIds) => {
                onChange(entityIds);
            }}
            optionLabelProp='label'
        >
            {options}
        </Select>
    );
};

export default i18n(FlowTriggerSelector) as FC<FlowTriggerSelectorProps>;
