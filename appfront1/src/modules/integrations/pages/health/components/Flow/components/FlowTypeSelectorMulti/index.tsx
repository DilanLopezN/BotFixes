import { Select } from 'antd';
import { FlowType } from 'kissbot-core';
import { FC } from 'react';
import { I18nProps } from '../../../../../../../i18n/interface/i18n.interface';
import i18n from '../../../../../../../i18n/components/i18n';

interface FlowTypeSelectorMultiProps {
    initialValue?: any;
    onChange: (value: string | null) => void;
    maxTagCount?: number;
    disabled?: boolean;
}

const FlowTypeSelectorMulti: FC<FlowTypeSelectorMultiProps & I18nProps> = ({
    getTranslation,
    initialValue,
    onChange,
    maxTagCount,
    disabled,
}) => {
    const options = Object.keys(FlowType).map((entityType) => (
        <Select.Option
            value={FlowType[entityType]}
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
            defaultValue={initialValue ?? undefined}
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

export default i18n(FlowTypeSelectorMulti) as FC<FlowTypeSelectorMultiProps>;
