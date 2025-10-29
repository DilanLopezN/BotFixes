import { SelectProps } from 'antd';

export interface SelectWithDebounceProps extends SelectProps{
    searchRequest: (searchValue: string) => Promise<SelectProps['options']>;
}
