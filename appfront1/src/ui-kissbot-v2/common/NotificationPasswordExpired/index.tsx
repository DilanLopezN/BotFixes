import { FC } from 'react';
import I18n from '../../../modules/i18n/components/i18n';
import { NotificationPasswordExpiredProps } from './props';
import { Button, Alert, Space } from 'antd';
import moment from 'moment-timezone';

const NotificationPasswordExpired: FC<NotificationPasswordExpiredProps> = ({
    getTranslation,
    expirationDate,
    setLocalStorage,
}) => {
    const formattedExpirationDate = moment(expirationDate).format('DD/MM/YYYY');

    return (
        <Alert
            className='custom-alert'
            closable
            onClose={() => {
                setLocalStorage();
            }}
            message={
                <>
                    <strong>
                        {getTranslation('Your password expires in')}{' '}
                        {formattedExpirationDate}
                    </strong>
                </>
            }
            description={getTranslation('If you do not remember your password, contact your supervisor.')}
            type='warning'
            showIcon
            action={
                <Space direction='horizontal' style={{ marginTop: '12%' }}>
                    <Button
                        className='antd-span-default-color'
                        type='primary'
                        onClick={() => {
                            setLocalStorage();
                            window.location.href = '/users/password-reset';
                        }}
                    >
                        {getTranslation('Change password')}
                    </Button>
                </Space>
            }
        />
    );
};

export default I18n(NotificationPasswordExpired);
