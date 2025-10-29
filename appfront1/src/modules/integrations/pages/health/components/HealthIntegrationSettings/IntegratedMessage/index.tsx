import { Input, notification, Table } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import CardWrapperForm from '../../../../../../../shared-v2/CardWrapperForm/CardWrapperForm';
import Header from '../../../../../../../shared-v2/Header/Header';
import { addNotification } from '../../../../../../../utils/AddNotification';
import { isSystemAdmin, isSystemDevAdmin } from '../../../../../../../utils/UserPermission';
import i18n from '../../../../../../i18n/components/i18n';
import { HealthService } from '../../../../../services/HealthService';
import { IntegratedMessageProps, IntegrationMessages } from './props';

const IntegratedMessage: React.FC<IntegratedMessageProps> = ({
    getTranslation,
    onClose,
    integration,
    workspaceId,
    onIntegrationUpdated,
}) => {
    const [isSaveButtonDisabled, setIsSaveButtonDisabled] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editedMessages, setEditedMessages] = useState<Record<string, string>>(() => {
        return Object.keys(IntegrationMessages).reduce((acc, key) => {
            acc[key] = '';
            return acc;
        }, {});
    });
    const [jsonError] = useState<string>('');
    const [customMessagesJSON, setCustomMessagesJSON] = useState<string>('');
    const { loggedUser } = useSelector((state: any) => state.loginReducer);

    const rolesJsonConfigIntegrationMessages = () => {
        return isSystemAdmin(loggedUser) || isSystemDevAdmin(loggedUser);
    };

    const getObjIntegrationMessages = (messagesObject: any) => {
        if (!messagesObject || typeof messagesObject !== 'object') {
            return messagesObject;
        }
        return messagesObject;
    };

    const validateJsonIntegrationMessages = (value: string) => {
        if (!value.trim()) {
            return true;
        }
    };

    const dataSource = Object.entries(IntegrationMessages).map(([key, message]) => {
        return {
            key,
            message: message,
        };
    });

    useEffect(() => {
        setEditedMessages((prev) => {
            return Object.keys(prev).reduce((acc, key) => {
                acc[key] = integration?.messages?.[key] || prev[key];
                return acc;
            }, {});
        });

        if (!customMessagesJSON && integration?.messages) {
            const messagesObject = getObjIntegrationMessages(integration.messages);
            setCustomMessagesJSON(JSON.stringify(messagesObject, null, 2));
        }
    }, [integration?.messages]);

    const columns = [
        {
            title: getTranslation('Identifier'),
            dataIndex: 'key',
            key: 'key',
            width: '30%',
            render: (key: string) => getTranslation(key),
        },
        {
            title: getTranslation('Message'),
            dataIndex: 'message',
            key: 'message',
            render: (text: string, record: { key: string; message: string }) => (
                <Input
                    value={editedMessages[record.key] !== undefined ? editedMessages[record.key] : text}
                    onChange={(e) => handleInputChange(record.key, e.target.value)}
                />
            ),
        },
    ];

    const handleInputChange = (key: string, value: string) => {
        setEditedMessages((prev) => ({
            ...prev,
            [key]: value,
        }));
        setIsSaveButtonDisabled(false);

        if (!customMessagesJSON) return;

        const json = JSON.parse(customMessagesJSON);
        json[key] = value;
        setCustomMessagesJSON(JSON.stringify(json, null, 2));
    };

    const updatedMessagesWithJson = (jsonString: string) => {
        const parsedJSON = JSON.parse(jsonString);
        Object.keys(parsedJSON).forEach((key) => {
            setEditedMessages((prev) => ({
                ...prev,
                [key]: parsedJSON[key],
            }));
        });
    };

    const changeJsonIntegrationMessages = (event: any) => {
        const value = event.target.value;
        setCustomMessagesJSON(value);
        setIsSaveButtonDisabled(false);

        if (validateJsonIntegrationMessages(value) && value.trim()) {
            updatedMessagesWithJson(value);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);

        let messagesForSubmit = { ...editedMessages };

        if (customMessagesJSON.trim()) {
            try {
                const customMessages = JSON.parse(customMessagesJSON);
                messagesForSubmit = { ...messagesForSubmit, ...customMessages };
            } catch (error) {
                notification.error({
                    message: getTranslation('Error'),
                    description: getTranslation('Error processing the JSON. Please review your JSON and try again'),
                });
                setIsSaving(false);
                return;
            }
        }

        await onSubmit(messagesForSubmit);
        setIsSaveButtonDisabled(true);
        setIsSaving(false);
    };

    const onSubmit = async (messagesForSubmit) => {
        const messagesObject = Object.entries(IntegrationMessages).reduce((acc, [key]) => {
            return {
                ...acc,
                [key]: messagesForSubmit[key] || '',
            };
        }, {});

        const customMessages = { ...messagesObject, ...messagesForSubmit };

        const integrationMessage = {
            ...integration,
            workspaceId: workspaceId,
            messages: customMessages,
        };
        try {
            await HealthService.updateHealthIntegration(workspaceId, integrationMessage);
            onIntegrationUpdated?.({
                ...integration,
                messages: customMessages,
            });
            addNotification({
                type: 'success',
                duration: 3000,
                title: getTranslation('Success'),
                message: getTranslation('Successfully edited'),
            });
        } catch (error) {
            console.error('Erro ao enviar mensagens:', error);
            addNotification({
                type: 'warning',
                duration: 3000,
                title: getTranslation('Error'),
                message: getTranslation('Error. Try again'),
            });
        }
    };
    return (
        <>
            <Header
                title={getTranslation('Notifications')}
                buttonBack={{ visible: true, onClick: onClose }}
                buttonSave={{
                    visible: true,
                    onClick: handleSave,
                    text: getTranslation('Salvar'),
                    disable: isSaveButtonDisabled || !!jsonError,
                    loading: isSaving,
                }}
            />
            <div style={{ minWidth: '900px', margin: '30px' }}>
                <Table dataSource={dataSource} columns={columns} pagination={false} />
            </div>

            {rolesJsonConfigIntegrationMessages() && (
                <CardWrapperForm
                    title={getTranslation('Custom integration messages configuration via JSON')}
                    childrenHeader
                    children={
                        <>
                            <TextArea
                                rows={14}
                                placeholder={`Exemplo:\n{\n"novaMensagem": "Texto da mensagem",\n"outraMensagem": "Outro texto"\n}`}
                                value={customMessagesJSON}
                                onChange={changeJsonIntegrationMessages}
                                style={{
                                    borderColor: jsonError ? '#ff4d4f' : undefined,
                                    fontSize: '12px',
                                }}
                            />
                            {jsonError && (
                                <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>{jsonError}</div>
                            )}
                            <div
                                style={{
                                    color: '#666',
                                    fontSize: '12px',
                                    marginTop: '8px',
                                }}
                            >
                                {getTranslation(
                                    'This JSON will be merged with the current integration messages configuration'
                                )}
                            </div>
                        </>
                    }
                />
            )}
        </>
    );
};

export default i18n(IntegratedMessage);
