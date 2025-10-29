export const truncate = (value: string, length: number = 15, options = { middle: true, suffix: '...' }): string => {
    if (typeof value !== 'string') {
        return '';
    }

    if (value.length <= length) {
        return value;
    }

    if (!options.middle) {
        return `${value.slice(0, length).trim()}${options.suffix.trim()}`;
    }

    return `${value.slice(0, length / 2).trim()}${options.suffix.trim()}${value.slice(-length / 2).trim()}`;
};
