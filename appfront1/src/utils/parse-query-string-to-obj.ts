export const parseQueryStringToObj = <T>(queryString: string) => {
    const urlParams = new URLSearchParams(queryString);
    const parsedQueryString = Object.fromEntries(urlParams);
    return parsedQueryString as T | Record<string, string>;
};
