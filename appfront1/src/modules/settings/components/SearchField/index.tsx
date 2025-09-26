import React, { FC } from 'react';
import i18n from '../../../i18n/components/i18n';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { SearchFieldProps } from './props';
import { Input } from 'antd';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import debounce from 'lodash/debounce';

const { Search } = Input;

const SearchField: FC<SearchFieldProps & I18nProps> = ({
    getTranslation,
    onChange,
    filters,
    placeholder,
    autoFocus = true,
    style,
}) => {
    const debounceChange = debounce((text: string) => {
        return onChange({
            ...filters,
            search: text,
        });
    }, 500);

    return (
        <Wrapper>
            <Search
                autoFocus={autoFocus}
                style={{
                    ...style,
                    height: '38px',
                }}
                placeholder={getTranslation(`${placeholder}`)}
                onChange={(ev: any) => debounceChange(ev.target.value)}
                allowClear
            />
        </Wrapper>
    );
};

export default i18n(SearchField) as FC<SearchFieldProps>;
