export const serialize = (obj: any) => {
    const str: string[] = [];

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(
                encodeURIComponent(key) +
                    (typeof obj[key] === 'string' && obj[key].substring(0, 2) === '!='
                        ? `!=${encodeURIComponent(obj[key].substring(2))}`
                        : `=${encodeURIComponent(obj[key])}`)
            );
        }
    }

    return str.join('&');
};
