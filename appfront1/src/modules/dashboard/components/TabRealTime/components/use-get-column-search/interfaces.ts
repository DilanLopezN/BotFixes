import { Key } from 'react';
import { Team } from '../../../../../../model/Team';
import { ResultAnalytics } from '../../props';
import { Workspace } from '../../../../../../model/Workspace';

export type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

export type SaveAnalyticsRange = (key: string, value: RangeValue) => Promise<Workspace>;

export type RangeValue = number | [number | null, number | null] | string | null | Key[] | boolean;

export type ColumnSearchProps<T> = {
    dataFilter?: Team[] | ResultAnalytics[];
    saveAnalyticsRange: SaveAnalyticsRange;
    selectedKeysData?: Key[];
    setSelectedKeysData: SetState<Key[]>;
    data: any;
    showOnlyWith?: boolean;
};
