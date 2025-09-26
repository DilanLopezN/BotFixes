import { FC } from 'react';
import { SettingItemProps } from './SettingsItemProps';

export const SettingsItem: FC<SettingItemProps> = ({ description, children, title }) => {
    return (
        <div style={{ justifyContent: 'space-between', display: 'flex', margin: '5px 0 0 0' }}>
            <div style={{ width: '35%' }}>
                <div style={{ fontSize: 15, color: 'black' }}>{title}</div>
                <div style={{ width: '100%', wordWrap: 'break-word', fontSize: 13, marginTop: 2 }}>
                    {description}
                </div>
            </div>

            <div>{children}</div>
        </div>
    );
};
