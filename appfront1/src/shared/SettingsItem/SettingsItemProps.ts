import { PropsWithChildren } from 'react';

export interface SettingItemProps extends PropsWithChildren {
    title: string;
    description: string | React.ReactNode;
}
