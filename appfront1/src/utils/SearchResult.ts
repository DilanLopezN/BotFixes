export const searchResult = (search: string, originalArray: any[], field: string | string[]) => {
    if (search === '') {
        return originalArray;
    }

    const array = originalArray.filter((element) => {
        if (typeof field === 'string') {
            return element[field].toLowerCase().includes(search.toLowerCase());
        } else {
            return field.some((f) => element[f].toLowerCase().includes(search.toLowerCase()));
        }
    });

    if (array.length) {
        return array;
    } else {
        return [];
    }
};