import { Button, Form, Input, Modal } from 'antd';
import { useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { Interaction } from '../../../../../model/Interaction';
import { useLanguageContext } from '../../../../i18n/context';
import { DisabledTypeContext } from '../../../contexts/disabledFieldsContext';
import { useInteractionsPendingPublicationContext } from '../../../contexts/interactionsPendingPublication';
import { usePendingInteraction } from '../../TreeComponents/NewInteractionPopOver/use-pending-interaction';
import { ModalInteractionHeaderFormProps } from './ModalInteractionHeaderFormProps';
import { usePublishInteraction } from './use-publish-interaction';

export const ModalInteractionHeaderForm = ({
    onSubmit,
    preview,
    onPublish,
    onInteractionsPending,
    name,
}: ModalInteractionHeaderFormProps) => {
    const history = useHistory();
    const [form] = Form.useForm();
    const { getTranslation } = useLanguageContext();
    const { publishInteraction, loading } = usePublishInteraction();
    const { setInteractionsPendingPublication } = useInteractionsPendingPublicationContext();
    const { fetchPendingInteraction } = usePendingInteraction();
    const { disabledFields } = useContext(DisabledTypeContext);
    const selectedWorkspace = useSelector((state: any) => state.workspaceReducer.selectedWorkspace);
    const currentBot = useSelector((state: any) => state.botReducer.currentBot);
    const unchangedInteraction = useSelector((state: any) => state.botReducer.unchangedInteraction);
    const currentInteraction = useSelector((state: any) => state.botReducer.currentInteraction);
    const loggedUser = useSelector((state: any) => state.loginReducer.loggedUser);

    const goToTree = () => {
        history.push(`/workspace/${selectedWorkspace._id}/bot/${currentBot._id}`);
    };

    const isModifiedByAnotherUser: boolean =
        currentInteraction?.lastUpdateBy?.userId && currentInteraction?.lastUpdateBy?.userId !== loggedUser?._id;

    const onFinishInteraction = (values: { name: string }) => {
        if (isModifiedByAnotherUser) {
            Modal.confirm({
                title: getTranslation('Interaction modified by another user'),
                content: getTranslation(
                    'This interaction was modified by another user. Do you want to continue saving?'
                ),
                okText: getTranslation('Yes'),
                cancelText: getTranslation('No'),
                onOk: () => {
                    onSubmit(values);
                },
                okButtonProps: { className: 'antd-span-default-color', type: 'primary', loading },
            });
        } else {
            onSubmit(values);
        }
    };

    const handleClick = async () => {
        const pendingList = await fetchPendingInteraction();
        if (onPublish()) {
            Modal.info({
                title: getTranslation('Interaction pending publication'),
                content: getTranslation('You have unsaved changes. Please save before publishing.'),
                okText: getTranslation('Ok'),
                okButtonProps: { className: 'antd-span-default-color', type: 'primary' },
            });
        } else {
            Modal.confirm({
                title: getTranslation('Post interaction'),
                content: `${getTranslation('Are you sure you want to publish the interaction?')} ${
                    currentInteraction?.name
                } `,
                okText: getTranslation('Yes'),
                cancelText: getTranslation('No'),
                onOk: () => {
                    const isPendingPublication: Interaction[] = pendingList?.filter((interaction) => {
                        return interaction._id !== currentInteraction?._id;
                    });
                    publishInteraction(currentInteraction._id);
                    onInteractionsPending(isPendingPublication);
                    setInteractionsPendingPublication(isPendingPublication);
                },
                okButtonProps: { className: 'antd-span-default-color', type: 'primary', loading },
            });
        }
    };

    useEffect(() => {
        form.setFieldsValue({ name });
    }, [name, form]);

    const buttonSpaceRequired = preview ? 350 : 210;

    return (
        <Form
            form={form}
            initialValues={{ name }}
            onFinish={onFinishInteraction}
            style={{
                position: 'relative',
                backgroundColor: '#FFF',
                padding: '8px 10px 8px 8px',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#FFF',
                }}
            >
                <div
                    style={{
                        width: `calc(100% - ${buttonSpaceRequired}px)`,
                        overflow: 'hidden',
                        backgroundColor: '#FFF',
                    }}
                >
                    {disabledFields ? (
                        <div
                            title={unchangedInteraction?.name || ''}
                            style={{
                                height: '34px',
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: '#FFF',
                                fontSize: '1.2rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                paddingRight: '10px',
                            }}
                        >
                            {unchangedInteraction?.name}
                        </div>
                    ) : (
                        <Form.Item name='name' style={{ marginBottom: 0 }}>
                            <Input
                                style={{
                                    fontSize: 16,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    backgroundColor: '#FFF',
                                    height: '34px',
                                }}
                                className='form-control no-border form-control-lg'
                                placeholder='Interaction name'
                                title={String(name)}
                            />
                        </Form.Item>
                    )}
                </div>

                <div
                    style={{
                        display: 'flex',
                        gap: '10px',
                        flexShrink: 0,
                        backgroundColor: '#FFF',
                        paddingLeft: '10px',
                    }}
                >
                    {preview && (
                        <Button
                            className='antd-span-default-color'
                            style={{
                                background: '#1eb11e',
                                minWidth: '80px',
                                height: '34px',
                            }}
                            onClick={goToTree}
                        >
                            {getTranslation('Tree')}
                        </Button>
                    )}
                    {!disabledFields && (
                        <Button
                            onClick={handleClick}
                            loading={loading}
                            className='antd-span-default-color'
                            style={{
                                minWidth: '120px',
                                height: '34px',
                            }}
                        >
                            {getTranslation('Post interaction')}
                        </Button>
                    )}
                    {!disabledFields && (
                        <Button
                            className='antd-span-default-color'
                            htmlType='submit'
                            type='primary'
                            style={{
                                minWidth: '80px',
                                height: '34px',
                            }}
                        >
                            {getTranslation('Save')}
                        </Button>
                    )}
                </div>
            </div>
        </Form>
    );
};
