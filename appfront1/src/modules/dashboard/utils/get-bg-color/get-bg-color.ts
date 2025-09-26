export const getBackgroundColor = (
    key: keyof any,
    value: number,
    filterValues: any,
    metricType: 'integer-range-filter' | 'duration-range-filter'
) => {

    const filterValue = filterValues[key];

    if (!Array.isArray(filterValue)) {
        return 'inherit';
    }

    const [minValue, maxValue] = filterValue;

    if (minValue === null && maxValue === null) {
        return 'inherit';
    }

    if (metricType === 'integer-range-filter') {
        if (minValue !== null && value < minValue) {
            return 'rgba(255, 77, 79, 0.3)';
        } else if (maxValue !== null && value > maxValue) {
            return 'rgba(255, 77, 79, 0.3)';
        } else if (minValue !== null && value >= minValue) {
            return 'rgba(82, 196, 26, 0.3)';
        }
    } else if (metricType === 'duration-range-filter') {
        if (minValue !== null && value < minValue) {
            return 'rgba(82, 196, 26, 0.3)';
        } else if (maxValue !== null && value > maxValue) {
            return 'rgba(255, 77, 79, 0.3)';
        } else if (minValue !== null && value >= minValue) {
            return 'rgba(250, 173, 20, 0.3)';
        }
    }

    return 'inherit';
};
