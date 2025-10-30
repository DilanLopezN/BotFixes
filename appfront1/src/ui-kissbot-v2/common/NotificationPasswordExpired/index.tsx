import { Alert, Button, Space } from 'antd';
import moment from 'moment-timezone';
import { FC, useMemo } from 'react';
import I18n from '../../../modules/i18n/components/i18n';
import { NotificationPasswordExpiredProps } from './props';

const NotificationPasswordExpired: FC<NotificationPasswordExpiredProps> = ({
    getTranslation,
    expirationDate,
    setLocalStorage,
}) => {
    const formattedExpirationDate = moment(expirationDate).format('DD/MM/YYYY');

    const canAppear = useMemo(() => {
        const lastClosed = localStorage.getItem('passwordAlertClosedAt');

        if (lastClosed) {
            const diffHours = moment().diff(moment(lastClosed), 'hours');
            if (diffHours < 12) {
                return false;
            }
        }

        return true;
    }, []);

    if (!canAppear) {
        return null;
    }

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
                        {getTranslation('Your password expires in')} {formattedExpirationDate}
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
