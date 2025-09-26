import { FilterDropdownProps } from 'antd/lib/table/interface';

export interface RangeFilterProps<T> extends FilterDropdownProps {
    setFilterValues: (min: number | null, max: number | null) => void;
    saveLocalFilter: (dataIndex: string, value: [number | null, number | null]) => void;
    initialFilters: T;
    dataIndex: string;
    removeFilterFromLocalStorage: (dataIndex: string) => void;
}
export type RangeTime = number | null;
