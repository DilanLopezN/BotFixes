import { FC, useState } from 'react';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import i18n from '../../../i18n/components/i18n';
import { Modal } from '../../../../shared/Modal/Modal';
import { ModalPosition } from '../../../../shared/Modal/ModalProps';
import { ColorType } from '../../../../ui-kissbot-v2/theme';
import { ActionsArea, Content } from './styles';
import moment from 'moment';
import omit from 'lodash/omit';
import { WorkspaceUserService } from '../../../settings/service/WorkspaceUserService';
import { PasswordExpireProps } from './props';
import { Button } from 'antd';

const PasswordExpire: FC<PasswordExpireProps & I18nProps> = ({
    getTranslation,
    user,
    workspaceId,
    addNotification,
    onUserUpdated,
}) => {
    const [visible, setVisible] = useState(false);

    const forceExpiresPassword = async () => {
        await WorkspaceUserService.update(workspaceId, user._id as string, {
            ...omit(user, ['avatar']),
            passwordExpires: moment().startOf('day').valueOf(),
        });
        setVisible(false);
        return addNotification({
            title: getTranslation('Success'),
            message: getTranslation('User updated successfully'),
            type: 'success',
            duration: 3000,
        });
    };

    return (
        <>
            <Button
                className='antd-span-default-color'
                type='link'
                onClick={() => setVisible(true)}
                title={getTranslation('The password will expire and the user will be forced to update the password')}
            >
                {getTranslation('Force password change')}
            </Button>
            <Modal
                width='390px'
                height='auto'
                className='confirmationModal'
                isOpened={visible}
                position={ModalPosition.center}
                onClickOutside={() => setVisible(false)}
            >
                <Content>
                    <div style={{ margin: '0 0 30px 0' }}>
                        <p>
                            <h6>{getTranslation('Password expiration forces the user to change it on next login.')}</h6>
                        </p>
                        <p>
                            <span style={{ margin: '10px 0 0 0' }}>
                                {`${getTranslation('To expire the password, the user')} `}
                                <b>{`${getTranslation('must know what your current password is')}`}</b>
                                {`. ${getTranslation(
                                    'If you have lost/forgotten a password, a password change must be carried out.'
                                )}`}
                            </span>
                        </p>
                    </div>

                    <ActionsArea>
                        <Button
                            className='antd-span-default-color'
                            type='primary'
                            ghost
                            onClick={() => setVisible(false)}
                        >
                            {getTranslation('Cancel')}
                        </Button>
                        <Button className='antd-span-default-color' type='primary' onClick={forceExpiresPassword}>
                            {getTranslation('Continue and force password change')}
                        </Button>
                    </ActionsArea>
                </Content>
            </Modal>
        </>
    );
};

export default i18n(PasswordExpire) as FC<PasswordExpireProps>;
