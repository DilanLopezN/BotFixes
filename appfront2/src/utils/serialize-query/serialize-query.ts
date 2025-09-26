export const serializeQuery = (obj: any) => {
  const str: string[] = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const key in obj) {
    // eslint-disable-next-line no-prototype-builtins
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
