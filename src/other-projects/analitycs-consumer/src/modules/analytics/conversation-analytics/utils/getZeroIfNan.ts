export function getZeroIfNaN(number: number | undefined) {
    if (number == undefined) return undefined;
    if (isNaN(number)) return 0;
    return number;
}
