import { forwardRef, useEffect, useRef, useState } from 'react';
import { RefSelectProps, Select, SelectProps } from 'antd';
import { debounce } from 'lodash';
import { SelectWithDebounceProps } from './interface';

export const SelectWithDebounce = forwardRef<RefSelectProps, SelectWithDebounceProps>(
    ({ searchRequest, ...otherProps }, ref) => {
        const [searchValue, setSearchValue] = useState('');
        const [options, setOptions] = useState<SelectProps['options']>();
        const [loading, setLoading] = useState(false);

        const debouncedSearch = useRef(
            debounce(async (value: string) => {
                if (!value || value.length < 3) {
                    return;
                }

                try {
                    setLoading(true);
                    const response = await searchRequest(value);
                    setOptions(response);
                } catch (error) {
                    console.error('Erro ao buscar dados:', error);
                } finally {
                    setLoading(false);
                }
            }, 500)
        ).current;

        const handleSearch = (value: string) => {
            setSearchValue(value);
            setOptions(undefined);
            debouncedSearch(value);
        };

        const renderNotFoundContent = () => {
            if (searchValue.length < 3) {
                return 'Digite pelo menos 3 caracteres';
            }

            if (loading || options === undefined) {
                return 'Carregando...';
            }

            return 'Nenhum resultado encontrado';
        };

        useEffect(() => {
            return () => {
                debouncedSearch.cancel();
            };
        }, [debouncedSearch]);

        return (
            <Select
                {...otherProps}
                ref={ref}
                options={options}
                showSearch
                placeholder='Selecione um item...'
                defaultActiveFirstOption={false}
                showArrow={false}
                filterOption={false}
                searchValue={searchValue}
                onSearch={handleSearch}
                loading={loading}
                notFoundContent={renderNotFoundContent()}
            />
        );
    }
);
