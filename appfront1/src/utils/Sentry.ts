import { getLoggedUserFromStore } from './get-user-from-store';
declare var Sentry: any;

export const dispatchSentryError = (err: any) => {
    try {
        if (!!Sentry && !!Sentry.captureException) {
            return Sentry?.captureException(err);
        }
    } catch (e) {
        console.log(e)
    }
};

export const configureSentry = async () => {
    if (typeof Sentry != 'undefined' && !!Sentry) {
        const user = getLoggedUserFromStore();
        Sentry.setUser({ id: user?._id || null });
    }
};
