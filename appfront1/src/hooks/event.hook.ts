import { useEffect } from 'react';

type WindowEvent = string;

const UseWindowEvent = (event: WindowEvent, callback: (params?: any) => any, dependencies: any[]) => {
    useEffect(() => {
        window.addEventListener(event, callback);
        return () => window.removeEventListener(event, callback);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [event, callback, ...dependencies]);
};

const dispatchWindowEvent = (event: WindowEvent, data: any) => {
    window.dispatchEvent(new CustomEvent(event, { detail: { ...data } }));
};

export { UseWindowEvent, dispatchWindowEvent };
export type { WindowEvent };
