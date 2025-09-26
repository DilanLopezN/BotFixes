export const createQueryString = (
    queryObj: Record<string, number | string | boolean | number[] | string[] | undefined>
) => {
    const normalizedQueryObj = Object.entries(queryObj).reduce((previousValue, currentValue) => {
        const [key, value] = currentValue;

        if (value === undefined || value === null || value === '') {
            return previousValue;
        }

        const normalizedValue = Array.isArray(value) ? value.join(',') : value;

        return { ...previousValue, [key]: normalizedValue };
    }, {});

    const queryString = new URLSearchParams(normalizedQueryObj).toString();
    return queryString ? `?${queryString}` : '';
};
