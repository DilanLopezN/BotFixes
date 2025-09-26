export const timeout = (callback: (...injectedArgs: any[]) => void, ms: number, ...args: any[]) => {
    const id = setTimeout(
        (injectedArgs: any[]) => {
            callback(...injectedArgs);
            clearTimeout(id);
        },
        ms,
        args
    );
};

export const sleep = (ms: number): Promise<undefined> => {
    return new Promise((resolve) => timeout(resolve, ms));
};
