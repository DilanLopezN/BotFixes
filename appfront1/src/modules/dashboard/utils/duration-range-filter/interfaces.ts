import { FilterDropdownProps } from 'antd/lib/table/interface';

export interface RangeFilterProps<T> extends FilterDropdownProps {
    setFilterValues: (min: number | null, max: number | null) => void;
    initialFilters: T;
    dataIndex: string;
}
export type RangeTime = number | null;
