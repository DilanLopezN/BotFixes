import { NOTIFICATION_CONTAINER, NOTIFICATION_INSERTION, NOTIFICATION_TYPE, Store } from 'react-notifications-component';

interface Notification {
    title?: string;
    message: string;
    type: NOTIFICATION_TYPE;
    insert?: NOTIFICATION_INSERTION;
    container?: NOTIFICATION_CONTAINER;
    duration?: number;
    click?: boolean;
}

interface NotificationApp {
    insert?: NOTIFICATION_INSERTION;
    container?: NOTIFICATION_CONTAINER;
    content: any;
    duration?: number;
}

export const addNotification = (notification: Notification) => {
    return Store.addNotification({
        title: notification?.title || '',
        message: notification.message,
        type: notification.type,
        insert: notification?.insert || 'bottom',
        container: notification?.container || 'bottom-right',
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: {
          duration: notification?.duration || 5000,
          onScreen: true,
          click: notification?.click || true,
        }
    });
}

export const addNotificationApp = (notification: NotificationApp) =>
Store.addNotification({
    title: '',
    message: '',
    type: undefined,
    insert: notification?.insert || 'bottom',
    container: notification?.container || 'bottom-right',
    animationIn: ["animate__animated", "animate__fadeIn"],
    animationOut: ["animate__animated", "animate__fadeOut"],
    dismiss: {
        duration: notification.duration || 0,
        pauseOnHover: true,
        click: true
    },
    content: notification?.content,
});