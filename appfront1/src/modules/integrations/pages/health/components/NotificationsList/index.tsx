import { FC, useEffect, useRef, useState } from 'react';
import { Alert, Button, Input, Modal, Popconfirm, Table, Tag, notification, Space } from 'antd';
import { NotificationsListProps, NotificationProps } from './props';
import i18n from '../../../../../i18n/components/i18n';
import Header from '../../../../../../shared-v2/Header/Header';
import { HealthService } from '../../../../services/HealthService';
import { ScrollView } from '../../../../../newChannelConfig/components/ScrollView';
import { ApiError } from '../../../../../../interfaces/api-error.interface';
import { useSelector } from 'react-redux';
import { isAnySystemAdmin } from '../../../../../../utils/UserPermission';
import moment from 'moment-timezone';

import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;

const NotificationsList: FC<NotificationsListProps> = ({
    integrationId,
    workspaceId,
    setShowNotifications,
    getTranslation,
    increment,
    setIncrement,
}) => {
    const [notifications, setNotificatios] = useState<NotificationProps[]>([]);
    const [messageNotification, setMessageNotification] = useState<string>('');
    const [openModal, setOpenModal] = useState<boolean>(false);
    const [alertEmpty, setAlertEmpty] = useState<boolean>(false);

    const textAreaRef = useRef<any>(null);
    const { loggedUser } = useSelector((state: any) => state.loginReducer);
    const anyAdmin = isAnySystemAdmin(loggedUser);

    const createNotification = () => {
        if (!messageNotification.trim()) {
            setAlertEmpty(true);
        } else {
            setOpenModal(false);
            onCreateNotification();
        }
    };

    const onIncrement = () => {
        setIncrement(increment + 1);
    };

    const onDecrement = () => {
        setIncrement(increment - 1);
    };

    const onCreateNotification = async () => {
        let error: any;
        try {
            await HealthService.createIntegrationNotification(
                workspaceId,
                integrationId as string,
                messageNotification,
                (err: ApiError) => {
                    error = err;
                }
            );

            if (error) {
                notification.error({
                    message: error.message,
                    style: { backgroundColor: '#fff2f0' },
                    duration: 1.5,
                });
            } else {
                onIncrement();
                notification.success({
                    message: 'Mensagem adicionada com sucesso!',
                    style: { backgroundColor: '#f6ffed' },
                    duration: 1.5,
                });

                onRequestNotifications();
            }
        } catch (e) {}
    };

    const onRequestNotifications = async () => {
        const response = await HealthService.getIntegrationNotifications(workspaceId, integrationId);
        setNotificatios(response);
    };

    const onDeleteNotifications = async (messageId: string) => {
        let error: any;
        try {
            await HealthService.deleteIntegrationNotification(
                workspaceId,
                integrationId,
                messageId,
                (err: ApiError) => {
                    error = err;
                }
            );
            if (error) {
                notification.error({
                    message: error.message,
                    style: { backgroundColor: '#fff2f0' },
                    duration: 1.5,
                });
            } else {
                onDecrement();
                notification.success({
                    message: 'Mensagem deletada com sucesso!',
                    style: { backgroundColor: '#f6ffed' },
                    duration: 1.5,
                });
                onRequestNotifications();
            }
        } catch (e) {}
    };

    useEffect(() => {
        onRequestNotifications();
    }, []);

    useEffect(() => {
        if (openModal && textAreaRef.current) {
            textAreaRef.current.focus();
            setAlertEmpty(false);
        }
    }, [openModal]);

    const columns: ColumnsType<NotificationProps> = [
        {
            title: getTranslation('Message'),
            dataIndex: 'mensagem',
            key: 'mensagem',
            width: '80%',
            render: (_, { message, createdAt }) => {
                return (
                    <div>
                        <div style={{ wordBreak: 'break-word' }}>{message}</div>
                        <span style={{ fontSize: '9px' }}> {moment(createdAt).format('DD/MM/YYYY HH:mm')}</span>
                    </div>
                );
            },
        },

        {
            title: getTranslation('Type'),
            key: 'tags',
            dataIndex: 'tags',
            render: (_, { type }) => {
                return (
                    <Tag
                        style={{
                            width: '70px',
                            textAlign: 'center',
                        }}
                        color={type === 'system' ? 'blue' : 'green'}
                    >
                        {' '}
                        {type}
                    </Tag>
                );
            },
        },
        {
            title: getTranslation('Action'),
            key: 'action',
            render: (_, item) => (
                <Space size='middle'>
                    <div style={{ width: '70px', paddingRight: '10px' }}>
                        {!anyAdmin && item.type === 'user' && (
                            <Popconfirm
                                className='antd-span-default-color'
                                placement='topRight'
                                title='Tem certeza que deseja excluir essa mensagem?'
                                onConfirm={() => onDeleteNotifications(item._id)}
                            >
                                <Button className='antd-span-default-color' onClick={() => ''}>
                                    {getTranslation('Delete')}
                                </Button>
                            </Popconfirm>
                        )}
                        {anyAdmin && (
                            <Popconfirm
                                className='antd-span-default-color'
                                placement='topRight'
                                title='Tem certeza que deseja excluir essa mensagem?'
                                onConfirm={() => onDeleteNotifications(item._id)}
                            >
                                <Button className='antd-span-default-color' onClick={() => ''}>
                                    {getTranslation('Delete')}
                                </Button>
                            </Popconfirm>
                        )}
                    </div>
                </Space>
            ),
        },
    ];

    return (
        <>
            <Header
                title={getTranslation('Notifications')}
                buttonBack={{ visible: true, onClick: () => setShowNotifications(false) }}
                buttonSave={{ visible: true, onClick: () => setOpenModal(true), text: getTranslation('Add') }}
            />
            <ScrollView minWidth='900px'>
                <Table style={{ margin: '30px' }} columns={columns} dataSource={notifications} />
            </ScrollView>
            <Modal
                className='antd-span-default-color'
                title='Mensagem'
                open={openModal}
                onOk={() => {
                    setMessageNotification('');
                    createNotification();
                }}
                onCancel={() => {
                    setMessageNotification('');
                    setOpenModal(false);
                }}
            >
                <TextArea
                    value={messageNotification}
                    rows={4}
                    ref={textAreaRef}
                    style={{ resize: 'none', borderRadius: '3px' }}
                    placeholder='Insira a mensagem aqui.'
                    onChange={(e) => {
                        const newMessage = e.target.value;
                        setMessageNotification(newMessage);
                        if (newMessage.trim() !== '') {
                            setAlertEmpty(false);
                        }
                    }}
                />
                {alertEmpty && (
                    <div style={{ marginTop: '10px' }}>
                        <Alert
                            message='Campo vazio!'
                            description='Por favor, insira uma mensagem.'
                            type='error'
                            showIcon
                        />
                    </div>
                )}
            </Modal>
        </>
    );
};
export default i18n(NotificationsList);
