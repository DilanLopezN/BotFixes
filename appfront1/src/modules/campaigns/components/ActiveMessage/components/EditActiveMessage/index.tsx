import { Select, Space, Spin } from 'antd';
import { Form, Formik } from 'formik';
import orderBy from 'lodash/orderBy';
import { FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import * as Yup from 'yup';
import { InputSimple } from '../../../../../../shared/InputSample/InputSimple';
import { ModalConfirm } from '../../../../../../shared/ModalConfirm/ModalConfirm';
import { ModalPosition } from '../../../../../../shared/ModalPortal/ModalPortalProps';
import { SimpleSelect } from '../../../../../../shared/SimpleSelect/SimpleSelect';
import { CreatableSelectTags } from '../../../../../../shared/StyledForms/CreatableSelectTags/CreatableSelectTags';
import { LabelWrapper } from '../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { TextAreaSimple } from '../../../../../../shared/TextAreaSimple/TextAreaSimple';
import Toggle from '../../../../../../shared/Toggle/Toggle';
import { Card, PrimaryButton, Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { ColorType } from '../../../../../../ui-kissbot-v2/theme';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { TemplateMessage } from '../../../../../liveAgent/components/TemplateMessageList/interface';
import { WorkspaceService } from '../../../../../workspace/services/WorkspaceService';
import { isSystemAdmin, isSystemDevAdmin } from '../../../../../../utils/UserPermission';
import {
    ActiveMessageSetting,
    CreateActiveMessageSettingDto,
    ObjectiveType,
    TimeType,
    UpdateActiveMessageSettingDto,
} from '../../../../interfaces/active-message-setting-dto';
import { CampaignAction } from '../../../../interfaces/campaign';
import { CampaignsActionService } from '../../../../service/CampaignsActionService';
import { CampaignsService } from '../../../../service/CampaignsService';
import { EditActiveMessageProps } from './props';

const EditActiveMessage: FC<EditActiveMessageProps & I18nProps> = ({
    activeMessage,
    workspaceId,
    getTranslation,
    addNotification,
    onCancel,
    onUpdatedActiveMessage,
    onCreatedActiveMessage,
    onDeletedActiveMessage,
    editing,
    loadingRequest,
    channelList,
}) => {
    const emptyActiveMessage: ActiveMessageSetting = {
        enabled: false,
        channelConfigToken: '',
        callbackUrl: '',
        objective: ObjectiveType.api,
    };
    const [currentActiveMessage, setCurrentActiveMessage] = useState<ActiveMessageSetting>(
        activeMessage || emptyActiveMessage
    );
    const [withError, setWithError] = useState<any>(undefined);
    const [submitted, setSubmitted] = useState(false);
    const [deleteActive, setDeleteActive] = useState<boolean>(false);
    const [modalChangeOpen, setModalChangeOpen] = useState(false);
    const [workspaceTags, setWorkspaceTags] = useState<any[]>([]);
    const [templates, setTemplates] = useState<TemplateMessage[]>([]);
    const [workspaceCustomFlow, setWorkspaceCustomFlow] = useState<CampaignAction[]>([]);

    const loggedUser = useSelector((state: any) => state.loginReducer.loggedUser);
    const userCanDelete = isSystemAdmin(loggedUser) || isSystemDevAdmin(loggedUser);

    const getWorkspaceTags = async () => {
        if (!workspaceId) return;

        const response = await WorkspaceService.workspaceTags(workspaceId);
        setWorkspaceTags(response?.data ?? []);
    };

    const getTemplatesOfficial = async () => {
        const newFilter = {
            filter: {
                isHsm: true,
                $or: [
                    {
                        active: true,
                    },
                    {
                        active: { $exists: false },
                    },
                ],
            },
        };
        const response = await WorkspaceService.getTemplates(newFilter, workspaceId);

        setTemplates(response?.data ?? []);
    };

    const getWorkspaceCustomFlow = async () => {
        const response = await CampaignsActionService.getActionMessagesFlow(workspaceId);
        setWorkspaceCustomFlow(response ?? []);
    };

    const tagsToLabel = () => {
        return workspaceTags.map((tag) => ({
            label: tag.name,
            value: tag.name,
        }));
    };

    const adjustmentValues = (values) => {
        let tags: string[] = [];
        values.map((entity) => {
            if (entity.value) {
                tags.push(entity.value);
            }
        });
        return tags;
    };

    useEffect(() => {
        getWorkspaceTags();
        getTemplatesOfficial();
        getWorkspaceCustomFlow();
        if (activeMessage) {
            setCurrentActiveMessage(activeMessage);
        }
    }, [activeMessage]);

    const getValidationSchema = (): Yup.ObjectSchema => {
        return Yup.object().shape({
            channelConfigToken: Yup.string().required('This field is required'),
        });
    };

    const updateActiveMessage = async (activeMessage: UpdateActiveMessageSettingDto) => {
        if (!activeMessage) {
            return;
        }

        const updatedActiveMessage = await CampaignsService.updateActiveMessage(
            workspaceId,
            activeMessage,
            (err: any) => {
                setWithError(err);
            }
        );

        if (!withError && updatedActiveMessage) {
            addNotification({
                type: 'success',
                duration: 3000,
                title: getTranslation('Success'),
                message: getTranslation('Integration updated successfully'),
            });

            setSubmitted(false);
            return onUpdatedActiveMessage();
        } else {
            addNotification({
                type: 'warning',
                duration: 3000,
                title: getTranslation('Error. Try again'),
                message: getTranslation('Error. Try again'),
            });
        }
    };

    const createActiveMessage = async (activeMessage: CreateActiveMessageSettingDto) => {
        if (!activeMessage) {
            return;
        }

        const createdActiveMessage = await CampaignsService.createActiveMessage(
            workspaceId,
            activeMessage,
            (err: any) => {
                setWithError(err);
            }
        );

        if (!withError && createdActiveMessage) {
            addNotification({
                type: 'success',
                duration: 3000,
                title: getTranslation('Success'),
                message: getTranslation('Active message successfully created'),
            });

            setSubmitted(false);
            return onCreatedActiveMessage();
        } else {
            addNotification({
                type: 'warning',
                duration: 3000,
                title: getTranslation('Error. Try again'),
                message: getTranslation('Error. Try again'),
            });
        }
    };

    const save = (values) => {
        if (activeMessage) {
            updateActiveMessage({
                id: values.id,
                settingName: values?.settingName,
                callbackUrl: values.callbackUrl,
                channelConfigToken: values.channelConfigToken,
                enabled: values.enabled,
                expirationTime: values.expirationTime,
                expirationTimeType: values.expirationTimeType,
                suspendConversationUntilTime: values.suspendConversationUntilTime,
                suspendConversationUntilType: values.suspendConversationUntilType,
                sendMessageToOpenConversation: values.sendMessageToOpenConversation,
                tags: values?.tags,
                objective: values?.objective,
                action: values?.action,
                templateId: values?.templateId,
                authorizationHeader: values?.authorizationHeader,
                endMessage: values?.endMessage,
                data: { contactListLimit: values?.data?.contactListLimit },
            });
        } else {
            createActiveMessage({
                callbackUrl: values.callbackUrl,
                channelConfigToken: values.channelConfigToken,
                settingName: values?.settingName,
                enabled: values.enabled,
                expirationTime: values.expirationTime,
                expirationTimeType: values.expirationTimeType,
                suspendConversationUntilTime: values.suspendConversationUntilTime,
                suspendConversationUntilType: values.suspendConversationUntilType,
                sendMessageToOpenConversation: values.sendMessageToOpenConversation,
                tags: values?.tags,
                objective: values?.objective,
                action: values?.action,
                templateId: values?.templateId,
                authorizationHeader: values?.authorizationHeader,
                endMessage: values?.endMessage,
                data: { contactListLimit: values?.data?.contactListLimit },
            });
        }

        setCurrentActiveMessage(values);
    };

    const onDeleteActive = async () => {
        if (!currentActiveMessage.id) {
            return;
        }

        await CampaignsService.deleteActiveMessage(workspaceId, currentActiveMessage.id, (err: any) => {
            setWithError(err);
        });

        if (!withError) {
            addNotification({
                type: 'success',
                duration: 3000,
                title: getTranslation('Success'),
                message: getTranslation('Successfully deleted'),
            });

            return onDeletedActiveMessage(currentActiveMessage.id);
        } else {
            addNotification({
                type: 'warning',
                duration: 3000,
                title: getTranslation('Error. Try again'),
                message: getTranslation('Error. Try again'),
            });
        }
    };

    const cancelEdit = (values) => {
        if (!values._id) {
            onCancel();
        }

        let newValues: any = {};
        let newActiveMessage: any = {};
        orderBy(Object.keys(values)).map((value) => {
            newValues[value] = values[value];
        });

        if (!activeMessage) return;

        orderBy(Object.keys(activeMessage)).map((value) => {
            newActiveMessage[value] = activeMessage[value];
        });

        if (JSON.stringify(newActiveMessage) === JSON.stringify(newValues)) {
            onCancel();
        } else {
            setCurrentActiveMessage(values);
            setModalChangeOpen(true);
        }
    };

    const optionsTemplate = (channelConfigToken) => {
        return templates
            .filter((template) => {
                const channelConfigId = channelList.find((channel) => channel.token === channelConfigToken)?._id;
                return !!channelConfigId && !!template.channels?.includes(channelConfigId);
            })
            ?.map((template) => {
                return { label: template.name, value: template._id };
            });
    };

    return (
        <Wrapper>
            <Formik
                enableReinitialize
                initialValues={{ ...currentActiveMessage }}
                validationSchema={getValidationSchema()}
                onSubmit={() => {}}
                render={({ values, setFieldValue, touched, errors, validateForm, submitForm, resetForm }) => {
                    const submit = () => {
                        setSubmitted(true);
                        validateForm().then((validatedValues: any) => {
                            if (validatedValues.isCanceled) {
                                return submit();
                            }
                            submitForm();

                            if (Object.keys(validatedValues).length === 0) {
                                save(values);

                                if (!withError) {
                                    resetForm();
                                }
                            }
                        });
                    };

                    return (
                        <>
                            <div className='ModalContainer'>
                                <ModalConfirm
                                    height='150px'
                                    width='390px'
                                    isOpened={modalChangeOpen}
                                    position={ModalPosition.center}
                                    onAction={(action: any) => {
                                        if (action) {
                                            onCancel();
                                            setModalChangeOpen(false);
                                        } else {
                                            setModalChangeOpen(false);
                                        }
                                    }}
                                >
                                    <div className='modal-change-close'>
                                        <h5>{getTranslation('Unsaved changes')}</h5>
                                        <p>
                                            {getTranslation('You have unsaved changes. Are you sure you want to leave')}
                                            <span> {getTranslation('without saving')}?</span>
                                        </p>
                                    </div>
                                </ModalConfirm>
                            </div>
                            <ModalConfirm
                                isOpened={deleteActive}
                                onAction={(action: any) => {
                                    if (action) {
                                        onDeleteActive();
                                    }
                                    setDeleteActive(false);
                                }}
                            >
                                <h5 style={{ textAlign: 'center' }}>{getTranslation('Confirm delete')}</h5>
                                <p style={{ margin: '10px 0px 17px' }}>
                                    {getTranslation('Are you sure you want to delete the integration active message?')}
                                </p>
                            </ModalConfirm>
                            <Form
                                style={{
                                    margin: '0 10px 5px',
                                }}
                            >
                                <Wrapper
                                    flexBox
                                    justifyContent={activeMessage && userCanDelete ? 'space-between' : 'flex-end'}
                                    alignItems='center'
                                    margin='0 0 15px 0'
                                    maxWidth='1040px'
                                >
                                    {activeMessage && userCanDelete && (
                                        <PrimaryButton
                                            colorType={ColorType.danger}
                                            onClick={(event: any) => {
                                                event.stopPropagation();
                                                setDeleteActive(true);
                                            }}
                                        >
                                            {getTranslation('Delete')}
                                        </PrimaryButton>
                                    )}

                                    <Wrapper flexBox justifyContent='flex-end' alignItems='center'>
                                        <div
                                            style={{
                                                marginRight: '10px',
                                                color: '#1890ff',
                                                textDecoration: 'none',
                                                cursor: 'pointer',
                                                transition: 'color 0.3s',
                                            }}
                                            onClick={() => cancelEdit(values)}
                                        >
                                            {getTranslation('Cancel')}
                                        </div>
                                        <PrimaryButton onClick={submit}>{getTranslation('Save')}</PrimaryButton>
                                    </Wrapper>
                                </Wrapper>
                                <Spin spinning={editing ? loadingRequest : false}>
                                    <Card header={getTranslation('Active message')}>
                                        {channelList.length && (
                                            <Wrapper margin='0 0 5px 0' width='100%' flexBox>
                                                <LabelWrapper
                                                    validate={{
                                                        touched,
                                                        errors,
                                                        isSubmitted: submitted,
                                                        fieldName: `channelConfigToken`,
                                                    }}
                                                    tooltip={getTranslation('activeMessage-channelConfigToken')}
                                                    label={getTranslation('Channel')}
                                                >
                                                    <Select
                                                        style={{ width: '100%' }}
                                                        size='large'
                                                        value={values.channelConfigToken}
                                                        onChange={(value) => {
                                                            setFieldValue('channelConfigToken', value);
                                                            setFieldValue('templateId', undefined);
                                                        }}
                                                    >
                                                        {channelList.map((channel) => {
                                                            return (
                                                                <option value={channel.token}>{channel.name}</option>
                                                            );
                                                        })}
                                                    </Select>
                                                </LabelWrapper>
                                            </Wrapper>
                                        )}
                                        <LabelWrapper
                                            validate={{
                                                touched,
                                                errors,
                                                isSubmitted: submitted,
                                                fieldName: `settingName`,
                                            }}
                                            tooltip={getTranslation('activeMessage-settingName')}
                                            label={getTranslation('Name')}
                                        >
                                            <InputSimple
                                                value={values.settingName}
                                                onChange={(event) => {
                                                    event.preventDefault();
                                                    setFieldValue('settingName', event.target.value);
                                                }}
                                            />
                                        </LabelWrapper>

                                        <Wrapper margin='0 0 5px 0' width='100%' flexBox>
                                            <LabelWrapper
                                                validate={{
                                                    touched,
                                                    errors,
                                                    isSubmitted: submitted,
                                                    fieldName: `callbackUrl`,
                                                }}
                                                tooltip={getTranslation('activeMessage-callbackUrl')}
                                                label={getTranslation('callbackUrl')}
                                            >
                                                <InputSimple
                                                    value={values.callbackUrl}
                                                    onChange={(event) => {
                                                        event.preventDefault();
                                                        setFieldValue('callbackUrl', event.target.value);
                                                    }}
                                                />
                                            </LabelWrapper>
                                        </Wrapper>

                                        <LabelWrapper
                                            validate={{
                                                touched,
                                                errors,
                                                isSubmitted: submitted,
                                                fieldName: `authorizationHeader`,
                                            }}
                                            tooltip={getTranslation('activeMessage-authorizationHeader')}
                                            label={getTranslation('authorizationHeader')}
                                        >
                                            <InputSimple
                                                value={values.authorizationHeader}
                                                onChange={(event) => {
                                                    event.preventDefault();
                                                    setFieldValue('authorizationHeader', event.target.value);
                                                }}
                                            />
                                        </LabelWrapper>

                                        <Wrapper margin='0 0 5px 0' width='100%' flexBox>
                                            <LabelWrapper
                                                validate={{
                                                    touched,
                                                    errors,
                                                    isSubmitted: submitted,
                                                    fieldName: `tags`,
                                                }}
                                                tooltip={getTranslation('activeMessage-tags')}
                                                label={getTranslation('Tags')}
                                            >
                                                <CreatableSelectTags
                                                    isDisabled={false}
                                                    options={tagsToLabel()}
                                                    onChange={(value) => {
                                                        if (!value) return;
                                                        setFieldValue('tags', adjustmentValues(value));
                                                        values['tags'] = adjustmentValues(value);
                                                    }}
                                                    placeholder={getTranslation('Tags')}
                                                    value={
                                                        Array.isArray(values.tags)
                                                            ? values.tags.map((element: any) => {
                                                                  return { value: element, label: element };
                                                              })
                                                            : []
                                                    }
                                                />
                                            </LabelWrapper>
                                        </Wrapper>

                                        <LabelWrapper
                                            validate={{
                                                touched,
                                                errors,
                                                isSubmitted: submitted,
                                                fieldName: `action`,
                                            }}
                                            tooltip={getTranslation('activeMessage-action')}
                                            label={getTranslation('Custom flow')}
                                        >
                                            <Select
                                                style={{ width: '100%' }}
                                                size='large'
                                                value={values.action}
                                                onChange={(value) => {
                                                    setFieldValue('action', value);
                                                }}
                                                placeholder={getTranslation('Selecione um fluxo personalizado')}
                                                options={workspaceCustomFlow?.map((action) => {
                                                    return { label: action.name, value: action.action };
                                                })}
                                            />
                                        </LabelWrapper>

                                        {values.channelConfigToken && (
                                            <LabelWrapper
                                                validate={{
                                                    touched,
                                                    errors,
                                                    isSubmitted: submitted,
                                                    fieldName: `templateId`,
                                                }}
                                                tooltip={getTranslation('activeMessage-templateId')}
                                                label={getTranslation('Template')}
                                            >
                                                <Select
                                                    style={{ width: '100%' }}
                                                    size='large'
                                                    value={values.templateId}
                                                    onChange={(value) => {
                                                        setFieldValue('templateId', value);
                                                    }}
                                                    placeholder={getTranslation('Selecione um template')}
                                                    options={optionsTemplate(values.channelConfigToken)}
                                                />
                                            </LabelWrapper>
                                        )}
                                        <Space>
                                            <LabelWrapper
                                                tooltip={getTranslation('activeMessage-objective')}
                                                label={getTranslation('Objective')}
                                            >
                                                <Wrapper flexBox width='300px'>
                                                    <SimpleSelect
                                                        value={values?.objective}
                                                        onChange={(event) => {
                                                            setFieldValue('objective', event.target.value);
                                                        }}
                                                    >
                                                        {Object.values(ObjectiveType).map((objective) => {
                                                            return (
                                                                <option value={objective}>
                                                                    {getTranslation(
                                                                        `${
                                                                            String(objective).charAt(0).toUpperCase() +
                                                                            String(objective).substring(1)
                                                                        }`
                                                                    )}
                                                                </option>
                                                            );
                                                        })}
                                                    </SimpleSelect>
                                                </Wrapper>
                                            </LabelWrapper>

                                            <LabelWrapper
                                                tooltip={getTranslation(
                                                    'It is used to set the active message sending limit per day'
                                                )}
                                                label={getTranslation('Contact list limit')}
                                            >
                                                <InputSimple
                                                    value={values?.data?.contactListLimit}
                                                    type='number'
                                                    min={1}
                                                    style={{ width: '100px' }}
                                                    onChange={(event) => {
                                                        const value = parseInt(event.target.value);
                                                        if (value > 0) {
                                                            setFieldValue('data.contactListLimit', value);
                                                        }
                                                    }}
                                                />
                                            </LabelWrapper>
                                        </Space>
                                        <LabelWrapper
                                            tooltip={getTranslation('activeMessage-suspended')}
                                            label={getTranslation('Suspend conversation until')}
                                        >
                                            <Wrapper flexBox width='300px'>
                                                <InputSimple
                                                    value={values?.suspendConversationUntilTime}
                                                    type='number'
                                                    min={1}
                                                    max={100}
                                                    style={{ width: '100px' }}
                                                    onChange={(event) => {
                                                        const value = parseInt(event.target.value);
                                                        if (value > 0 && value < 101) {
                                                            setFieldValue('suspendConversationUntilTime', value);
                                                            if (!values?.suspendConversationUntilType) {
                                                                setFieldValue(
                                                                    'suspendConversationUntilType',
                                                                    TimeType.minutes
                                                                );
                                                            }
                                                        }
                                                    }}
                                                />
                                                <SimpleSelect
                                                    value={values?.suspendConversationUntilType}
                                                    onChange={(event) => {
                                                        if (event.target.value === 'undefined') {
                                                            setFieldValue('suspendConversationUntilTime', undefined);
                                                            return setFieldValue(
                                                                'suspendConversationUntilType',
                                                                undefined
                                                            );
                                                        }
                                                        setFieldValue(
                                                            'suspendConversationUntilType',
                                                            event.target.value
                                                        );
                                                        if (!values?.suspendConversationUntilTime) {
                                                            setFieldValue('suspendConversationUntilTime', 1);
                                                        }
                                                    }}
                                                >
                                                    <option value={'undefined'}>
                                                        {getTranslation('do not suspend')}
                                                    </option>
                                                    <option value={TimeType.minutes}>
                                                        {getTranslation('Minutes')}
                                                    </option>
                                                    <option value={TimeType.hours}>{getTranslation('Hours')}</option>
                                                    <option value={TimeType.days}>{getTranslation('Days')}</option>
                                                </SimpleSelect>
                                            </Wrapper>
                                        </LabelWrapper>

                                        <LabelWrapper
                                            tooltip={getTranslation('activeMessage-expiration')}
                                            label={getTranslation('Expiration time')}
                                        >
                                            <Wrapper flexBox width='300px'>
                                                <InputSimple
                                                    value={values?.expirationTime}
                                                    type='number'
                                                    min={1}
                                                    max={100}
                                                    style={{ width: '100px' }}
                                                    onChange={(event) => {
                                                        const value = parseInt(event.target.value);
                                                        if (value > 0 && value < 101) {
                                                            setFieldValue('expirationTime', value);
                                                            if (!values?.expirationTimeType) {
                                                                setFieldValue('expirationTimeType', TimeType.minutes);
                                                            }
                                                        }
                                                    }}
                                                />
                                                <SimpleSelect
                                                    value={values?.expirationTimeType}
                                                    onChange={(event) => {
                                                        if (event.target.value === 'undefined') {
                                                            setFieldValue('expirationTime', undefined);
                                                            return setFieldValue('expirationTimeType', undefined);
                                                        }
                                                        setFieldValue('expirationTimeType', event.target.value);
                                                        if (!values?.expirationTime) {
                                                            setFieldValue('expirationTime', 1);
                                                        }
                                                    }}
                                                >
                                                    <option value={'undefined'}>
                                                        {getTranslation('do not expire')}
                                                    </option>
                                                    <option value={TimeType.minutes}>
                                                        {getTranslation('Minutes')}
                                                    </option>
                                                    <option value={TimeType.hours}>{getTranslation('Hours')}</option>
                                                    <option value={TimeType.days}>{getTranslation('Days')}</option>
                                                </SimpleSelect>
                                            </Wrapper>
                                        </LabelWrapper>

                                        <LabelWrapper
                                            validate={{
                                                touched,
                                                errors,
                                                fieldName: 'endMessage',
                                                isSubmitted: true,
                                            }}
                                            label={getTranslation('Standard conversation end message')}
                                        >
                                            <TextAreaSimple
                                                value={values.endMessage}
                                                rows={3}
                                                onChange={(event) => setFieldValue('endMessage', event.target.value)}
                                            />
                                        </LabelWrapper>

                                        <LabelWrapper
                                            validate={{
                                                touched,
                                                errors,
                                                fieldName: 'enabled',
                                                isSubmitted: true,
                                            }}
                                        >
                                            <Toggle
                                                tabIndex='52'
                                                tooltip={getTranslation('activeMessage-active')}
                                                label={getTranslation(values.enabled ? 'Active' : 'Inactive')}
                                                checked={values.enabled}
                                                onChange={() => {
                                                    setFieldValue('enabled', !values.enabled);
                                                }}
                                            />
                                        </LabelWrapper>

                                        <LabelWrapper
                                            validate={{
                                                touched,
                                                errors,
                                                fieldName: 'sendMessageToOpenConversation',
                                                isSubmitted: true,
                                            }}
                                        >
                                            <Toggle
                                                tabIndex='52'
                                                tooltip={getTranslation('activeMessage-sendMessageToOpenConversation')}
                                                label={getTranslation('Send message to open conversation')}
                                                checked={values.sendMessageToOpenConversation ?? false}
                                                onChange={() => {
                                                    setFieldValue(
                                                        'sendMessageToOpenConversation',
                                                        !values.sendMessageToOpenConversation
                                                    );
                                                }}
                                            />
                                        </LabelWrapper>

                                        {values.apiToken && (
                                            <Wrapper
                                                margin='10px 0 5px 0'
                                                width='100%'
                                                flexBox
                                            >{`ApiToken: ${values.apiToken}`}</Wrapper>
                                        )}
                                    </Card>
                                </Spin>
                            </Form>
                        </>
                    );
                }}
            />
        </Wrapper>
    );
};

export default i18n(EditActiveMessage) as FC<EditActiveMessageProps>;
