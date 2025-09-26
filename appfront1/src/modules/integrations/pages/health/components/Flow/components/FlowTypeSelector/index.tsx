import { AutoComplete } from 'antd';
import { FC, useState } from 'react';
import { I18nProps } from '../../../../../../../i18n/interface/i18n.interface';
import i18n from '../../../../../../../i18n/components/i18n';
import orderBy from 'lodash/orderBy';
import { FlowType } from 'kissbot-core';

interface FlowTypeSelectorProps {
    initialValue?: any;
    onChange?: (value: string) => void;
    integrationType: string;
}

const FlowTypeSelector: FC<FlowTypeSelectorProps & I18nProps> = ({
    getTranslation,
    initialValue,
    onChange,
    integrationType,
}) => {
    const [value, setValue] = useState(initialValue);
    const [search, setSearch] = useState('');

    const options = orderBy(
        Object.keys(FlowType).map((flowType) => ({
            key: flowType,
            props: {},
            text: getTranslation(flowType),
            value: flowType,
        })),
        'text'
    );

    const filteredOptionsType = options.filter((item) => item.value !== 'correlation');

    const getOptions = () => {
        if (integrationType === 'CUSTOM_IMPORT') {
            return options.filter((option) => option.text.toLowerCase().search(search) > -1);
        }
        return filteredOptionsType;
    };

    const onSearch = (value: string) => {
        setSearch(value);
        setValue(value);
    };

    return (
        <AutoComplete
            value={getTranslation(value)}
            className='certain-category-search'
            popupClassName='certain-category-search-dropdown'
            dropdownMatchSelectWidth={false}
            dropdownStyle={{ width: 300 }}
            style={{ width: '100%' }}
            onSelect={(value) => {
                setValue(value);
                onChange?.(value as string);
            }}
            dataSource={getOptions()}
            onSearch={onSearch}
            placeholder={getTranslation('search by entity')}
        />
    );
};

export default i18n(FlowTypeSelector) as FC<FlowTypeSelectorProps>;
