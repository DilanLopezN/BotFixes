export const onFocusChange = (onChange: (focused: boolean) => void) => {
    let visibilityState: string = '';
    let visibilityChange: string = '';

    if (typeof (document as any)?.hidden !== 'undefined') {
        visibilityChange = 'visibilitychange';
        visibilityState = 'visibilityState';
    } else if (typeof (document as any)?.mozHidden !== 'undefined') {
        visibilityChange = 'mozvisibilitychange';
        visibilityState = 'mozVisibilityState';
    } else if (typeof (document as any)?.msHidden !== 'undefined') {
        visibilityChange = 'msvisibilitychange';
        visibilityState = 'msVisibilityState';
    } else if (typeof (document as any)?.webkitHidden !== 'undefined') {
        visibilityChange = 'webkitvisibilitychange';
        visibilityState = 'webkitVisibilityState';
    }

    document.addEventListener(visibilityChange, function () {
        switch (document[visibilityState]) {
            case 'visible':
                return onChange(true);
            case 'hidden':
                return onChange(false);
        }
    });
};
