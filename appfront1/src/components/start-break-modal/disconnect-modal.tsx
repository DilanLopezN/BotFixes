import { Col, Modal, Row } from 'antd';
import { useUserActivity } from '../../hooks/use-user-activity';
import { notifySuccess } from '../../utils/notify-success';
import { useDisconnectUser } from './hooks/use-disconnect-user';
import type { DisconnectModalProps } from './interfaces';

export const DisconnectModal = ({ isVisible, onClose }: DisconnectModalProps) => {
    const { fetchUserActivity, isLoadingUserActivity, setOffline } = useUserActivity();
    const { disconnect, isDisconnecting } = useDisconnectUser();

    const handleDisconnect = async () => {
        const result = await disconnect();

        if (result) {
            notifySuccess({ message: 'Sucesso', description: 'Usuário está offline' });
            setOffline();
            await fetchUserActivity();
            onClose();
        }
    };

    return (
        <Modal
            title='Desconectar'
            closable={false}
            keyboard={false}
            maskClosable={false}
            open={isVisible}
            okText='Desconectar'
            cancelText='Cancelar'
            onCancel={onClose}
            onOk={handleDisconnect}
            okButtonProps={{
                loading: isDisconnecting,
                disabled: isLoadingUserActivity,
                danger: true,
                className: 'antd-span-default-color',
            }}
            cancelButtonProps={{
                disabled: isLoadingUserActivity || isDisconnecting,
            }}
        >
            <Row gutter={16}>
                <Col span={24}>Tem certeza que deseja se desconectar?</Col>
            </Row>
        </Modal>
    );
};
