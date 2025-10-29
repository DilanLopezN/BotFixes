import { useCallback } from 'react';

export const useRangeFilter = <T extends { [key: string]: [number | null, number | null] }>(initialFilter: T) => {
    const sanitizedFilter = Object.fromEntries(
        Object.entries(initialFilter).map(([key, value]) => [
            key,
            [value[0] !== null ? Number(value[0]) : null, value[1] !== null ? Number(value[1]) : null],
        ])
    );

    const handleSetFilterValues = useCallback(
        (key: string, min: number | null, max: number | null) => {
            sanitizedFilter[key] = [min, max];
        },
        [sanitizedFilter]
    );

    return { handleSetFilterValues };
};
