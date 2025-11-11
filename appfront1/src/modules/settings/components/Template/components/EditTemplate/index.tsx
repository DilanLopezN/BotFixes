import {
    Alert,
    Button,
    Input,
    message,
    Modal,
    notification,
    Select,
    Spin,
    Switch,
    Tag as TagComponent,
    Tooltip,
    Upload,
} from 'antd';
import { Form, Formik } from 'formik';
import omit from 'lodash/omit';
import orderBy from 'lodash/orderBy';
import { FC, useEffect, useRef, useState } from 'react';
import { BiUpload } from 'react-icons/bi';
import { BsExclamationCircle } from 'react-icons/bs';
import { RiBracesLine } from 'react-icons/ri';
import * as Yup from 'yup';
import ActivityPreview from '../../../../../../shared-v2/ActivityPreview/ActivityPreview';
import HelpCenterLink from '../../../../../../shared/HelpCenterLink';
import { ModalPosition } from '../../../../../../shared/Modal/ModalProps';
import { ModalConfirm } from '../../../../../../shared/ModalConfirm/ModalConfirm';
import { LabelWrapper } from '../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { Card, Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { fileToBase64 } from '../../../../../../utils/File';
import { formatBytes } from '../../../../../../utils/formatBytes';
import { isAnySystemAdmin, isSystemAdmin, isSystemDevAdmin } from '../../../../../../utils/UserPermission';
import { CampaignAction } from '../../../../../campaigns/interfaces/campaign';
import { CampaignsActionService } from '../../../../../campaigns/service/CampaignsActionService';
import { defaultVars } from '../../../../../campaigns/utils/defaultVars';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { Tag } from '../../../../../liveAgent/components/TagSelector/props';
import {
    TemplateButton,
    TemplateButtonType,
    TemplateCategory,
    TemplateMessage,
    TemplateStatus,
    TemplateType,
    TemplateVariable,
} from '../../../../../liveAgent/components/TemplateMessageList/interface';
import { AttachmentService } from '../../../../../liveAgent/service/Atttachment.service';
import { WorkspaceService } from '../../../../../workspace/services/WorkspaceService';
import { ComponentManagerEnum } from '../../../../interfaces/component-manager.enum';
import { FlowData } from '../../../../interfaces/flow-data.interface';
import { FlowDataService } from '../../../../service/FlowDataService';
import { DraftEditor } from '../DraftEditor';
import { useTemplateVariableContext } from '../DraftEditor/context';
import { ActiveModal, InlineStyleType } from '../DraftEditor/props';
import TemplateInsightsModal from '../TemplateInsightsModal';
import TemplateSuggestionsModal from '../TemplateSuggestionsModal';
import TemplatePermissions from './components/templatePermissions';
import { EditTemplateProps } from './props';
import { ContainerMessage } from './styled';
import { InfoCircleOutlined } from '@ant-design/icons';

const FILE_ACCEPT_TEMPLATE_NOT_HSM =
    'image/jpeg,image/png,video/mp4,video/3gpp,application/pdf,text/plain,application/vnd.ms-excelapplication/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation';
const MAX_LENGTH_MESSAGE_HSM = 1024;
const MAX_LENGTH_MESSAGE = 4096;
const MIN_LENGTH_MESSAGE = 10;
const MAX_SIZE_FILE_IMAGE_TEMPLATE_HSM = 5000000; // 5 MB
const MAX_SIZE_FILE_VIDEO_TEMPLATE_HSM = 16000000; // 16 MB
const MAX_SIZE_FILE_AUDIO_TEMPLATE_HSM = 16000000; // 16 MB
const MAX_SIZE_FILE_DOCUMENT_TEMPLATE_HSM = 100000000; // 100 MB

export const emptyVariable: TemplateVariable = {
    label: '',
    required: true,
    type: '@sys.text',
    value: '',
    sampleValue: '',
};

export const emptyTemplate: TemplateMessage = {
    canEdit: false,
    isHsm: false,
    active: true,
    message: '',
    name: '',
    userId: '',
    workspaceId: '',
    tags: [],
    teams: [],
    channels: [],
    variables: [],
    category: TemplateCategory.UTILITY,
};

const EditTemplate: FC<EditTemplateProps & I18nProps> = ({
    template,
    workspaceId,
    getTranslation,
    user,
    addNotification,
    onCancel,
    onUpdatedTemplate,
    onCreatedTemplate,
    onDeletedTemplate,
    loadingRequest,
    setLoadingRequest,
    setCurrentComponent,
}) => {
    const { templateVariables, setTemplateVariables } = useTemplateVariableContext();
    const [currentTemplate, setCurrentTemplate] = useState<TemplateMessage>(
        template || { ...emptyTemplate, userId: user?._id as string, workspaceId }
    );
    const [withError, setWithError] = useState<any>(undefined);
    const [submitted, setSubmitted] = useState(false);
    const [workspaceTags, setWorkspaceTags] = useState<Tag[]>([]);
    const [workspaceFlowData, setWorkspaceFlowData] = useState<FlowData[]>([]);
    const [customFlow, setCustomFlow] = useState<CampaignAction[]>([]);
    const [deleteTemplate, setDeleteTemplate] = useState<boolean>(false);
    const [previewTemplateMessage, setPreviewTemplateMessage] = useState<boolean>(false);
    const [modalChangeOpen, setModalChangeOpen] = useState(false);
    const [url, setUrl] = useState(template?.fileUrl || '');
    const [file, setFile] = useState<any>(undefined);
    const [textEditor, setTextEditor] = useState(template?.message || '');
    const [allowTemplateCategoryChange, setAllowTemplateCategoryChange] = useState(false);
    const [activeModal, setActiveModal] = useState<ActiveModal>(null);
    const [modalErrors, setModalErrors] = useState<any>(undefined);
    const [lastCheckedText, setLastCheckedText] = useState<string>('');
    const [hasValidationErrors, setHasValidationErrors] = useState(false);
    const [has422Error, setHas422Error] = useState(false);
    const [templateBeforeError, setTemplateBeforeError] = useState<string>('');
    const [applyingAiSuggestion, setApplyingAiSuggestion] = useState<boolean>(false);
    const category = Object.values(template?.wabaResult || {}).find((res: any) => !!res?.category)?.category;

    const isAnyAdmin = isAnySystemAdmin(user);
    const isAdmin = isSystemAdmin(user);
    const isDevAdmin = isSystemDevAdmin(user);
    const isAdminOrDevAdmin = isAdmin || isDevAdmin;
    const canChange = !currentTemplate?.isHsm ? true : user && isAnyAdmin;
    const disabledHsmStatusPending =
        currentTemplate.isHsm &&
        !!Object.values(currentTemplate.wabaResult || {})?.find(
            (waba) => waba.status === TemplateStatus.AWAITING_APPROVAL
        );
    const disabledHsmStatusNotApproved =
        currentTemplate.isHsm &&
        !Object.values(currentTemplate.wabaResult || {})?.find((waba) => waba.status === TemplateStatus.APPROVED);
    const disabledUpdateHsm = !!currentTemplate._id && currentTemplate.isHsm;
    const editorRef = useRef<any>(null);

    const handleSelectSuggestion = (suggestion: { message: string; buttons: TemplateButton[] }) => {
        // Se o template não é editável, criar um novo template
        const { message: messageSuggestion, buttons } = suggestion;
        if (!canChange || disabledUpdateHsm) {
            createNewTemplateFromSuggestion(messageSuggestion, buttons);
            return;
        }

        setApplyingAiSuggestion(true);

        if (editorRef.current?.insertSuggestion) {
            editorRef.current.insertSuggestion(messageSuggestion);
            setActiveModal(null);
            const draftEditorElement = document.querySelector('.public-DraftEditor-content') as HTMLElement;
            if (draftEditorElement) {
                const event = new Event('input', { bubbles: true });
                draftEditorElement.dispatchEvent(event);

                setTimeout(() => {
                    draftEditorElement.focus();
                }, 100);
            }
        }

        const newCurrentTemplate = { ...currentTemplate, message: messageSuggestion, buttons };
        setCurrentTemplate(newCurrentTemplate);
        setHasValidationErrors(false);
        setHas422Error(false);
        setModalErrors(undefined);

        message.success('Sugestão aplicada com sucesso!');
    };

    const createNewTemplateFromSuggestion = (suggestionText: string, buttons: TemplateButton[]) => {
        const newTemplate = {
            ...emptyTemplate,
            name: `${currentTemplate.name}_V2`,
            userId: user?._id as string,
            workspaceId,
            message: suggestionText,
            buttons,
            isHsm: currentTemplate.isHsm,
            category: currentTemplate.category,
            variables: currentTemplate.variables || [],
            tags: currentTemplate.tags || [],
            teams: currentTemplate.teams || [],
            channels: currentTemplate.channels || [],
        };

        window.history.replaceState(null, '', '/settings/templates');
        setCurrentTemplate(newTemplate);
        setActiveModal(null);
        message.success('Novo template criado com a sugestão! Preencha o nome e outros campos antes de salvar.');
    };

    const getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            name: Yup.string().required(getTranslation('This field is required')),
        });
    };

    const validationVariables = () => {
        const variables: string[] = [];
        textEditor
            ?.trim()
            .match(/{{(.*?)}}/g)
            ?.forEach((string, index) => {
                variables.push(string);
            });
        let validMessageTemplate = true;
        let variableEmpty = false;
        variables?.forEach((currVariable) => {
            if (!variableEmpty) {
                const value = currVariable.replace(/[{,}]/g, '');
                const existVariable = templateVariables?.find((entity) => entity.value === value);
                const isDefault = !!defaultVars.find((curr) => curr.value === value);
                if (!existVariable && !isDefault) {
                    variableEmpty = true;
                }
            }
            if (!validMessageTemplate) {
                return;
            }

            const trimmedText = textEditor?.trim() || '';
            const variablePosition = trimmedText.indexOf(currVariable);
            const maxPosition = trimmedText.length - currVariable.length - 10;
            const minPosition = 4;

            if (variablePosition < minPosition || variablePosition > maxPosition) {
                validMessageTemplate = false;
            }
        });

        return { validMessageTemplate, variableEmpty };
    };

    const validationMessageTemplateNotHsm = () => {
        if (currentTemplate.isHsm) {
            return {};
        }
        const contentFile = file || currentTemplate.fileUrl;
        if (!textEditor?.trim() && !contentFile && submitted) {
            return { message: getTranslation('Fill in this field or select a file') };
        }

        const { variableEmpty } = validationVariables();

        if (variableEmpty) {
            return { message: getTranslation('There are variables that have not yet been filled in') };
        }

        return {};
    };

    const validationMessageTemplateHsm = () => {
        const contentFile = file || currentTemplate.fileUrl;
        if ((!textEditor?.trim() && submitted) || (!textEditor?.trim() && !!contentFile)) {
            return { message: getTranslation('This field is required') };
        }
        if ((textEditor?.trim()?.length || 0) < MIN_LENGTH_MESSAGE && !!contentFile) {
            return {
                message: getTranslation(
                    'You must fill in the message field with at least 10 characters, along with the file!'
                ),
            };
        }

        const { validMessageTemplate, variableEmpty } = validationVariables();

        if (!validMessageTemplate) {
            return {
                message: getTranslation(
                    'Invalid message, variables at the beginning or end of the text are not allowed'
                ),
            };
        }

        if (variableEmpty) {
            return { message: getTranslation('There are variables that have not yet been filled in') };
        }

        return {};
    };

    const createVariablesContentainedText = () => {
        const variables: string[] = [];
        (textEditor || '').match(/{{(.*?)}}/g)?.forEach((string, index) => {
            let variable = string.replace(/{{/g, '');
            variable = variable.replace(/}}/g, '');
            variables.push(variable);
        });

        const newVariables: { [key: string]: TemplateVariable } = {};
        variables.forEach((variable) => {
            if (newVariables[variable]) {
                return;
            }
            const exist = templateVariables.find((currVar) => currVar.value === variable);
            const isDefault = !!defaultVars.find((curr) => curr.value === variable);

            if (exist && !isDefault) {
                newVariables[variable] = exist;
                return;
            }
        });

        return Object.values(newVariables).map((variable) => ({
            ...omit(variable, '_id'),
        }));
    };

    const updateTemplate = async (template: TemplateMessage) => {
        if (!template) {
            return;
        }
        setLoadingRequest(true);
        const variables = createVariablesContentainedText();

        let newTemplate = { ...template, message: template.message?.trim(), aiSuggestion: applyingAiSuggestion };
        newTemplate.variables = variables;

        if (!newTemplate.isHsm && file?.type && !AttachmentService.isImageFile(file?.type)) {
            newTemplate.message = '';
            newTemplate.variables = [];
        }

        let formData: FormData = new FormData();
        formData.append('template', JSON.stringify(newTemplate));
        if (file && !newTemplate.isHsm) {
            formData.append('attachment', file);
        }

        let errorObj: any = null;
        const updatedTemplate = await WorkspaceService.updateTemplate(
            formData,
            newTemplate._id!,
            workspaceId,
            (err: any) => {
                errorObj = err;
                setWithError(err);
            }
        );
        setLoadingRequest(false);

        if (!errorObj && updatedTemplate) {
            addNotification({
                type: 'success',
                duration: 3000,
                title: getTranslation('Success'),
                message: getTranslation('Template updated successfully'),
            });

            setSubmitted(false);
            setApplyingAiSuggestion(false);
            return onUpdatedTemplate();
        } else {
            const shouldShowSuccess =
                errorObj?.remove && Array.isArray(errorObj.remove) && errorObj.remove.length === 0;

            if (shouldShowSuccess) {
                addNotification({
                    type: 'success',
                    duration: 3000,
                    title: getTranslation('Success'),
                    message: getTranslation('Template updated successfully'),
                });
                setSubmitted(false);
                setApplyingAiSuggestion(false);
                return onUpdatedTemplate();
            } else {
                addNotification({
                    type: 'warning',
                    duration: 3000,
                    title: getTranslation('Error. Try again'),
                    message: getTranslation('Error. Try again'),
                });

                // Detecta especificamente erro 422 e abre modal com sugestões
                if (
                    errorObj &&
                    (errorObj.statusCode === 422 ||
                        errorObj.status === 422 ||
                        errorObj.response?.status === 422 ||
                        errorObj.response?.statusCode === 422)
                ) {
                    if (errorObj.data || errorObj.messages || errorObj.suggestions || errorObj.remove) {
                        setModalErrors(errorObj);
                        setLastCheckedText(textEditor);
                        setTemplateBeforeError(textEditor);
                        setHasValidationErrors(true);
                        setHas422Error(true);
                        setActiveModal(InlineStyleType.AI_SUGGESTION);
                    }
                }
            }
        }
    };

    const createTemplate = async (template: TemplateMessage) => {
        if (!template) {
            return;
        }

        setLoadingRequest(true);
        const variables = createVariablesContentainedText();

        let newTemplate = { ...template, message: template.message?.trim(), aiSuggestion: applyingAiSuggestion };
        newTemplate.variables = variables;

        // Garantir que userId não seja string vazia
        if (!newTemplate.userId || newTemplate.userId === '') {
            newTemplate.userId = user?._id as string;
        }

        if (!newTemplate.isHsm && file?.type && !AttachmentService.isImageFile(file?.type)) {
            newTemplate.message = '';
            newTemplate.variables = [];
        }

        let formData: FormData = new FormData();
        formData.append('template', JSON.stringify(newTemplate));
        if (file) {
            formData.append('attachment', file);
        }

        let errorObj: any = null;
        const createdTemplate = await WorkspaceService.createTemplate(
            formData,
            workspaceId,
            newTemplate.isHsm,
            allowTemplateCategoryChange,
            (err: any) => {
                errorObj = err;
                setWithError(err);
            }
        );
        setLoadingRequest(false);

        if (createdTemplate && !errorObj) {
            addNotification({
                type: 'success',
                duration: 3000,
                title: getTranslation('Success'),
                message: getTranslation('Template successfully created'),
            });
            setSubmitted(false);
            setApplyingAiSuggestion(false);
            return onCreatedTemplate();
        } else if (errorObj?.remove && Array.isArray(errorObj.remove) && errorObj.remove.length === 0) {
            addNotification({
                type: 'success',
                duration: 3000,
                title: getTranslation('Success'),
                message: getTranslation('Template successfully created'),
            });
            setSubmitted(false);
            setApplyingAiSuggestion(false);
            return onCreatedTemplate();
        } else {
            addNotification({
                type: 'error',
                duration: 5000,
                title: getTranslation('Error. Try again'),
                message: typeof errorObj?.message === 'string' ? errorObj.message : getTranslation('Error. Try again'),
            });

            // Detecta especificamente erro 422 e abre modal com sugestões
            if (errorObj) {
                if (errorObj.data || errorObj.messages || errorObj.suggestions || errorObj.remove) {
                    setModalErrors(errorObj);
                    setLastCheckedText(textEditor);
                    setTemplateBeforeError(textEditor);
                    setHasValidationErrors(true);
                    setHas422Error(true);
                    setActiveModal(InlineStyleType.AI_SUGGESTION);
                }
            }
        }
    };

    const save = (updatedTemplate: TemplateMessage) => {
        updatedTemplate.variables = updatedTemplate.variables.map((variable) => ({
            ...omit(variable, '_id'),
        }));

        setCurrentTemplate(updatedTemplate);

        if (!!updatedTemplate?._id) {
            return updateTemplate(updatedTemplate);
        }

        return createTemplate(updatedTemplate);
    };

    const onDeleteTemplate = async () => {
        if (!currentTemplate._id || !workspaceId) {
            return;
        }
        setLoadingRequest(true);
        let error;

        await WorkspaceService.deleteTemplate(currentTemplate._id, workspaceId, (err) => {
            error = err;
        });
        setLoadingRequest(false);

        if (!error) {
            addNotification({
                type: 'success',
                duration: 3000,
                title: getTranslation('Success'),
                message: getTranslation('Successfully deleted'),
            });

            return onDeletedTemplate(currentTemplate._id);
        } else {
            const errorMessage = error?.message || 'Error. Try again';
            const errorStatus = error?.statusCode || 500;

            let notificationMessage: string;
            let notificationWarning: string;
            let notificationType: string;
            let notificationMessageTemplateUse: string;

            if (errorStatus === 400 && errorMessage === 'Template is in use') {
                notificationMessageTemplateUse = 'Template is being used for active messages';
                notificationWarning = 'Warning';
                notificationType = 'Warning';
                addNotification({
                    type: notificationType,
                    duration: 3000,
                    title: getTranslation(notificationWarning),
                    message: getTranslation(notificationMessageTemplateUse),
                });
            } else {
                notificationMessage = 'Error. Try again';
                notificationWarning = 'Error';
                notificationType = 'Error';
                addNotification({
                    type: notificationType,
                    duration: 3000,
                    title: getTranslation(notificationWarning),
                    message: getTranslation(notificationMessage),
                });
            }
        }
    };

    const cancelEdit = (values: TemplateMessage) => {
        if (!values._id) {
            onCancel();
        }

        let newValues: any = {};
        let newTemplate: any = {};
        orderBy(Object.keys(values)).forEach((value) => {
            newValues[value] = values[value];
        });

        if (!template) return;

        orderBy(Object.keys(template)).forEach((value) => {
            newTemplate[value] = template[value];
        });

        if (JSON.stringify(newTemplate) === JSON.stringify(newValues)) {
            setCurrentComponent(ComponentManagerEnum.LIST);
            onCancel();
        } else {
            setCurrentTemplate(values);
            setModalChangeOpen(true);
        }
    };

    const onChangeVariable = (variable: TemplateVariable) => {
        const normalizedValue = variable.value?.trim?.() ?? '';
        const normalizedLabel = variable.label?.trim?.() ?? '';
        const normalizedSampleValue =
            variable.sampleValue === undefined ? undefined : variable.sampleValue.trim();

        const isDefaultVariable = !!defaultVars.find((curr) => curr.value === normalizedValue);
        const sampleIsRequired = currentTemplate.isHsm && !isDefaultVariable;

        if (!normalizedValue || !normalizedLabel || (sampleIsRequired && !normalizedSampleValue)) {
            return;
        }

        const normalizedVariable: TemplateVariable = {
            ...variable,
            value: normalizedValue,
            label: normalizedLabel,
            sampleValue: normalizedSampleValue,
        };

        setTemplateVariables((prevState) => {
            const nextState = [...prevState];
            const existingIndex = nextState.findIndex((currVar) => currVar._id === normalizedVariable?._id);

            if (existingIndex !== -1) {
                nextState[existingIndex] = normalizedVariable;
            } else if (!isDefaultVariable) {
                nextState.push({ ...normalizedVariable });
            }

            return nextState;
        });
    };

    const getMaxSizeFile = (file) => {
        if (file) {
            if (file.mimetype?.startsWith?.('video')) {
                return MAX_SIZE_FILE_VIDEO_TEMPLATE_HSM;
            }
            if (file.mimetype?.startsWith?.('audio')) {
                return MAX_SIZE_FILE_AUDIO_TEMPLATE_HSM;
            }
            if (file.mimetype?.startsWith?.('image')) {
                return MAX_SIZE_FILE_IMAGE_TEMPLATE_HSM;
            }
            return MAX_SIZE_FILE_DOCUMENT_TEMPLATE_HSM;
        }
        return 0;
    };

    useEffect(() => {
        if (!!template) {
            setCurrentTemplate(template);
            setTemplateVariables(template.variables);
            setTextEditor(template.message || '');
        }
    }, [setTemplateVariables, template]);

    // Efeito separado para carregar sugestões automaticamente em novos templates HSM
    useEffect(() => {
        if (!template && currentTemplate.isHsm && isAnyAdmin && currentTemplate.userId && !currentTemplate._id) {
            // Carrega sugestões automaticamente para novos templates oficiais do WhatsApp
            setTimeout(() => {
                setActiveModal(InlineStyleType.AI_SUGGESTION);
            }, 500);
        }
    }, [template, currentTemplate.isHsm, currentTemplate.userId, currentTemplate._id, isAnyAdmin]);

    // Monitora mudanças no texto do editor para limpar erros antigos
    useEffect(() => {
        if (textEditor !== lastCheckedText) {
            setHasValidationErrors(false);
            setModalErrors(undefined);
        }

        // Se teve erro 422 e o template foi modificado, reativa o botão salvar
        if (has422Error && textEditor !== templateBeforeError) {
            setHas422Error(false);
            setHasValidationErrors(false);
        }
    }, [textEditor, lastCheckedText, has422Error, templateBeforeError]);

    useEffect(() => {
        const getWorkspaceTags = async () => {
            const response = await WorkspaceService.workspaceTags(workspaceId, {
                filter: {
                    $or: [
                        {
                            inactive: false,
                        },
                        {
                            inactive: { $exists: false },
                        },
                    ],
                },
            });

            setWorkspaceTags(response?.data || []);
        };

        getWorkspaceTags();
        getWorkspaceFlowData();
    }, [workspaceId]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const getWorkspaceFlowData = async () => {
        const response = await FlowDataService.getFlowDataByWorkspaceIdAndFlow(workspaceId);

        setWorkspaceFlowData(response?.data || []);
    };

    useEffect(() => {
        const getActionMessagesFlow = async () => {
            const response = await CampaignsActionService.getActionMessagesFlow(workspaceId);

            if (response) {
                setCustomFlow(response);
            } else notification.error({ message: 'Ocorreu algum erro' });
        };

        getActionMessagesFlow();
    }, [workspaceId]);

    const FooterModalPreviewTemplate = (
        <div>
            <Button className='antd-span-default-color' onClick={() => setPreviewTemplateMessage(false)}>
                {getTranslation('Ok')}
            </Button>
        </div>
    );

    const disableButtonUrl = (buttons) => {
        return (
            disabledUpdateHsm ||
            (buttons && buttons?.length >= 3) ||
            (!currentTemplate?.isHsm &&
                buttons &&
                buttons?.some((bt) => bt?.type === TemplateButtonType.URL && buttons.length === 1)) ||
            (!currentTemplate?.isHsm && buttons && buttons?.some((bt) => bt?.type !== TemplateButtonType.URL)) ||
            (!!currentTemplate?.isHsm && buttons && buttons?.some((bt) => bt?.type === TemplateButtonType.FLOW))
        );
    };

    const disableButtonQuick = (buttons) => {
        return (
            disabledUpdateHsm ||
            (buttons && buttons?.length >= 10) ||
            (!currentTemplate?.isHsm &&
                buttons &&
                buttons?.some((bt) => bt?.type !== TemplateButtonType.QUICK_REPLY)) ||
            (!!currentTemplate?.isHsm && buttons && buttons?.some((bt) => bt?.type === TemplateButtonType.FLOW))
        );
    };

    const disableButtonFlow = (buttons) => {
        return disabledUpdateHsm || (buttons && buttons?.length >= 1);
    };

    return (
        <Wrapper>
            <Formik
                enableReinitialize
                initialValues={{ ...currentTemplate } as TemplateMessage}
                validationSchema={getValidationSchema()}
                onSubmit={() => {}}
                render={(formikProps) => {
                    const { values, setFieldValue, touched, errors, validateForm, resetForm } = formikProps;

                    const submit = () => {
                        setSubmitted(true);
                        const validHsm = validationMessageTemplateHsm();
                        const valid = validationMessageTemplateNotHsm();

                        if ((values.isHsm && validHsm?.message && !isAnyAdmin) || valid.message) {
                            return;
                        }

                        validateForm().then((validatedValues: any) => {
                            const validSubmit = file?.type && validatedValues?.message;
                            if (Object.keys(validatedValues).length === 0 || validSubmit) {
                                const newValues = {
                                    ...values,
                                    message: textEditor,
                                    canEdit: values.isHsm ? false : values.canEdit,
                                };
                                save(newValues);

                                if (!withError) {
                                    resetForm();
                                }
                            }
                        });
                    };

                    const disableTextFileInvalidType =
                        ((!!values.fileContentType && !AttachmentService.isImageFile(values.fileContentType)) ||
                            (file?.type && !AttachmentService.isImageFile(file?.type))) &&
                        !values.isHsm;
                    return (
                        <>
                            <div className='ModalContainer'>
                                <ModalConfirm
                                    height='150px'
                                    width='390px'
                                    isOpened={modalChangeOpen}
                                    position={ModalPosition.center}
                                    onConfirmText={getTranslation('Yes')}
                                    onCancelText={getTranslation('No')}
                                    onAction={(action) => {
                                        if (action) {
                                            onCancel();
                                            setModalChangeOpen(false);
                                            setCurrentComponent(ComponentManagerEnum.LIST);
                                        } else {
                                            setModalChangeOpen(false);
                                            setCurrentComponent(ComponentManagerEnum.LIST);
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
                                isOpened={deleteTemplate}
                                onAction={(action: any) => {
                                    if (action) {
                                        onDeleteTemplate();
                                    }
                                    setDeleteTemplate(false);
                                }}
                            >
                                <h5 style={{ textAlign: 'center' }}>{getTranslation('Confirm delete')}</h5>
                                <p style={{ margin: '10px 0px 17px' }}>
                                    {getTranslation('Are you sure you want to delete the template?')}
                                </p>
                            </ModalConfirm>

                            <Modal
                                open={previewTemplateMessage}
                                centered
                                onCancel={() => setPreviewTemplateMessage(false)}
                                width={500}
                                closable={false}
                                footer={FooterModalPreviewTemplate}
                                bodyStyle={{ overflow: 'auto', maxHeight: '500px' }}
                                destroyOnClose
                            >
                                <ActivityPreview
                                    message={textEditor}
                                    footerMessage={values.footerMessage}
                                    buttons={values.buttons}
                                    variables={templateVariables}
                                    file={
                                        !!values?.fileUrl || url
                                            ? {
                                                  type: values?.fileContentType || file?.type,
                                                  url: values?.fileUrl || url,
                                                  name: values?.fileOriginalName || file?.name,
                                                  size: values?.fileSize || file.size,
                                              }
                                            : undefined
                                    }
                                />
                            </Modal>

                            <Wrapper
                                flexBox
                                justifyContent={`${template?._id && canChange ? 'space-between' : 'flex-end'}`}
                                alignItems='center'
                                margin='0 0 15px 0'
                                maxWidth='1040px'
                            >
                                {template?._id && canChange && (
                                    <Button
                                        disabled={loadingRequest}
                                        className='antd-span-default-color'
                                        danger
                                        type='primary'
                                        onClick={(event: any) => {
                                            event.stopPropagation();
                                            setDeleteTemplate(true);
                                        }}
                                    >
                                        {getTranslation('Delete')}
                                    </Button>
                                )}

                                <Wrapper flexBox justifyContent='flex-end' alignItems='center'>
                                    <Button
                                        className='antd-span-default-color'
                                        type='link'
                                        onClick={() => cancelEdit(values)}
                                    >
                                        {getTranslation('Cancel')}
                                    </Button>

                                    <Button
                                        className='antd-span-default-color'
                                        type='primary'
                                        disabled={
                                            loadingRequest
                                                ? true
                                                : has422Error && !applyingAiSuggestion
                                                ? true
                                                : hasValidationErrors && !applyingAiSuggestion
                                                ? true
                                                : values.isHsm
                                                ? !!validationMessageTemplateHsm()?.message && !isAnyAdmin
                                                : !!validationMessageTemplateNotHsm()?.message
                                        }
                                        onClick={submit}
                                    >
                                        {getTranslation('Save')}
                                    </Button>
                                </Wrapper>
                            </Wrapper>
                            <Spin spinning={loadingRequest}>
                                <Card
                                    header={
                                        <Wrapper flexBox alignItems='center'>
                                            {getTranslation(values.isHsm ? 'Official template' : 'Template')}
                                        </Wrapper>
                                    }
                                >
                                    <Form
                                        style={{
                                            margin: '0 10px 0',
                                        }}
                                    >
                                        {disabledUpdateHsm ? (
                                            <Alert
                                                style={{ marginBottom: '10px' }}
                                                message={getTranslation(
                                                    'It is not possible to edit messages in official templates, if you have questions click on the link below'
                                                )}
                                                type='warning'
                                                showIcon
                                            />
                                        ) : null}
                                        <Wrapper flexBox justifyContent='space-between'>
                                            <HelpCenterLink
                                                textStyle={{ color: '#1890ff', textDecoration: 'underline' }}
                                                text={getTranslation('Understand more about the templates')}
                                                article={
                                                    '69000869567-como-criar-um-template-oficial-e-submeter-a-aprovacão-do-whatsapp-'
                                                }
                                            />
                                            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                                <Switch
                                                    checked={values?.active ?? false}
                                                    disabled={
                                                        (disabledHsmStatusPending && !isAnyAdmin) ||
                                                        (disabledHsmStatusNotApproved && !isAnyAdmin)
                                                    }
                                                    onChange={() => setFieldValue(`active`, !values.active)}
                                                    style={{ margin: '0 10px 10px 0' }}
                                                />
                                                {getTranslation('Active')}
                                            </div>
                                        </Wrapper>
                                        <Wrapper margin='0 0 5px 0' width='100%' flexBox>
                                            <LabelWrapper
                                                validate={{
                                                    touched,
                                                    errors,
                                                    isSubmitted: submitted,
                                                    fieldName: `name`,
                                                }}
                                                label={getTranslation('Template name')}
                                            >
                                                <Wrapper flexBox>
                                                    <Wrapper
                                                        margin='0 9px 0 0'
                                                        fontWeight='900'
                                                        color='#777'
                                                        fontSize='24px'
                                                    >
                                                        /
                                                    </Wrapper>
                                                    <Input
                                                        value={values.name}
                                                        autoFocus
                                                        maxLength={300}
                                                        placeholder={getTranslation(
                                                            'Enter a name to trigger the template'
                                                        )}
                                                        style={{ width: '100%' }}
                                                        onChange={(ev: any) => {
                                                            values.name = ev.target.value;
                                                            setFieldValue('name', ev.target.value);
                                                        }}
                                                    />
                                                </Wrapper>
                                            </LabelWrapper>
                                        </Wrapper>

                                        {!values.isHsm ? (
                                            <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: 10 }}>
                                                <Switch
                                                    checked={values.canEdit}
                                                    onChange={() => setFieldValue(`canEdit`, !values.canEdit)}
                                                    style={{ margin: '0 10px 10px 0' }}
                                                />
                                                {getTranslation('Text can be changed after selected')}
                                            </div>
                                        ) : null}

                                        <Wrapper>
                                            <Wrapper flexBox justifyContent='flex-end' position='absolute' right='5px'>
                                                <Wrapper flexBox>
                                                    <Button
                                                        className='antd-span-default-color'
                                                        onClick={() => setPreviewTemplateMessage(true)}
                                                        type='link'
                                                        children={getTranslation('Show message preview')}
                                                    />
                                                </Wrapper>
                                            </Wrapper>
                                            <LabelWrapper
                                                validate={{
                                                    touched,
                                                    errors: {},
                                                    isSubmitted: submitted,
                                                    fieldName: `message`,
                                                }}
                                                label={getTranslation('Message')}
                                            >
                                                {values.isHsm && !!validationMessageTemplateHsm()?.message ? (
                                                    <Alert
                                                        icon={<BsExclamationCircle />}
                                                        style={{ marginBottom: '10px' }}
                                                        message={validationMessageTemplateHsm().message}
                                                        type='error'
                                                        showIcon
                                                    />
                                                ) : validationMessageTemplateNotHsm()?.message ? (
                                                    <Alert
                                                        icon={<BsExclamationCircle />}
                                                        style={{ marginBottom: '10px' }}
                                                        message={validationMessageTemplateNotHsm().message}
                                                        type='error'
                                                        showIcon
                                                    />
                                                ) : null}
                                                <ContainerMessage disabled={disableTextFileInvalidType}>
                                                    <DraftEditor
                                                        templateCategory={category}
                                                        ref={editorRef}
                                                        setActiveModal={setActiveModal}
                                                        initialValue={values.message}
                                                        maxLength={
                                                            values.isHsm || url || file
                                                                ? MAX_LENGTH_MESSAGE_HSM
                                                                : MAX_LENGTH_MESSAGE
                                                        }
                                                        variables={values.variables || []}
                                                        onChangeVariable={onChangeVariable}
                                                        isHsm={values.isHsm}
                                                        disabled={
                                                            disableTextFileInvalidType ||
                                                            disabledUpdateHsm ||
                                                            applyingAiSuggestion
                                                        }
                                                        onChange={(value) => {
                                                            setTextEditor(value);
                                                        }}
                                                        toolbarOnFocus={true}
                                                    />
                                                </ContainerMessage>
                                            </LabelWrapper>
                                            {disableTextFileInvalidType && (
                                                <div style={{ color: 'red' }}>
                                                    {getTranslation(
                                                        'Message can only be sent with a file of this type (image) or without any file!'
                                                    )}
                                                </div>
                                            )}
                                            {(hasValidationErrors || has422Error) && (
                                                <Alert
                                                    message={'Erro de Validação'}
                                                    description={
                                                        'O template não atende aos critérios de validação do WhatsApp. Modifique o conteúdo para reativar o botão salvar ou veja as correções sugeridas.'
                                                    }
                                                    type='warning'
                                                    showIcon
                                                    style={{ marginTop: '10px' }}
                                                    action={
                                                        <Button
                                                            size='small'
                                                            type='primary'
                                                            onClick={() =>
                                                                setActiveModal(InlineStyleType.AI_SUGGESTION)
                                                            }
                                                        >
                                                            Sugestões de IA
                                                        </Button>
                                                    }
                                                />
                                            )}
                                        </Wrapper>
                                        {!values?.fileUrl && !url && values.buttons && values.buttons.length > 0 && (
                                            <Wrapper margin='15px 0 0 0'>
                                                <LabelWrapper
                                                    validate={{
                                                        touched,
                                                        errors,
                                                        isSubmitted: submitted,
                                                        fieldName: `footerMessage`,
                                                    }}
                                                    label={getTranslation('Footer message')}
                                                >
                                                    <Input
                                                        value={values.footerMessage || ''}
                                                        maxLength={60}
                                                        placeholder={getTranslation('Type a footer message (optional)')}
                                                        style={{ width: '100%' }}
                                                        disabled={disabledUpdateHsm}
                                                        onChange={(ev: any) => {
                                                            setFieldValue('footerMessage', ev.target.value);
                                                        }}
                                                    />
                                                </LabelWrapper>
                                            </Wrapper>
                                        )}

                                        <Wrapper width='30%'>
                                            <LabelWrapper
                                                tooltip={getTranslation(
                                                    'Accepted extensions: jpeg, png, 3gpp, mp4, pdf, txt, xls, xlsx, doc, docx, ppt, and pptx'
                                                )}
                                                label={getTranslation('File')}
                                            >
                                                <Upload
                                                    name={`file`}
                                                    disabled={
                                                        (!!currentTemplate?._id && !!currentTemplate?.isHsm) ||
                                                        values?.buttons?.[0]?.type === TemplateButtonType.FLOW
                                                    }
                                                    customRequest={() => {}}
                                                    accept={FILE_ACCEPT_TEMPLATE_NOT_HSM}
                                                    showUploadList
                                                    fileList={
                                                        url || values.fileUrl
                                                            ? [
                                                                  {
                                                                      uid: '1',
                                                                      name: 'arquivo',
                                                                      status: 'done',
                                                                      size: 1234,
                                                                      type: '',
                                                                      url: values.fileUrl || url,
                                                                  },
                                                              ]
                                                            : []
                                                    }
                                                    onPreview={(file) => {
                                                        if (values.fileUrl) {
                                                            window.open(values.fileUrl, '_blank');
                                                        } else {
                                                            window
                                                                .open()
                                                                ?.document.write(
                                                                    '<iframe src="' +
                                                                        file.url +
                                                                        '" frameborder="0" style="width:100%; height:100%;" allowfullscreen></iframe>'
                                                                );
                                                        }
                                                    }}
                                                    multiple={false}
                                                    onChange={async ({ file, fileList }) => {
                                                        if (fileList?.length > 0) {
                                                            const fileToUpload = fileList[fileList.length - 1];
                                                            if (fileToUpload?.originFileObj) {
                                                                const allowedExtensions = [
                                                                    'jpeg',
                                                                    'png',
                                                                    '3gpp',
                                                                    'mp4',
                                                                    'pdf',
                                                                    'txt',
                                                                    'xls',
                                                                    'xlsx',
                                                                    'doc',
                                                                    'docx',
                                                                    'ppt',
                                                                    'pptx',
                                                                ];
                                                                const fileExtension = fileToUpload.originFileObj.name
                                                                    .split('.')
                                                                    .pop()
                                                                    ?.toLowerCase();

                                                                if (!allowedExtensions.includes(fileExtension || '')) {
                                                                    addNotification({
                                                                        type: 'warning',
                                                                        title: getTranslation('Invalid file format'),
                                                                        duration: 6000,
                                                                        message:
                                                                            getTranslation(
                                                                                'Please try again by selecting a file with one of the following extensions:'
                                                                            ) + ` ${allowedExtensions.join(', ')}.`,
                                                                    });

                                                                    return;
                                                                }
                                                            }
                                                        }
                                                        if (fileList?.length === 0) {
                                                            setUrl('');
                                                            setFile(undefined);
                                                            setFieldValue('fileContentType', undefined);
                                                            setFieldValue('fileKey', undefined);
                                                            setFieldValue('fileOriginalName', undefined);
                                                            setFieldValue('fileSize', undefined);
                                                            setFieldValue('type', TemplateType.message);
                                                            if (!values.buttons || values.buttons.length === 0) {
                                                                setFieldValue('footerMessage', '');
                                                            }
                                                            return setFieldValue('fileUrl', undefined);
                                                        }

                                                        const fileToUpload = fileList[fileList.length - 1];
                                                        const maxSizeMB = getMaxSizeFile(
                                                            fileToUpload?.originFileObj?.size
                                                        );
                                                        if (
                                                            fileToUpload?.originFileObj &&
                                                            fileToUpload?.originFileObj?.size > maxSizeMB
                                                        ) {
                                                            alert(
                                                                `${getTranslation('Select a file up to')} ${formatBytes(
                                                                    maxSizeMB
                                                                )}`
                                                            );
                                                            return;
                                                        }

                                                        if (fileToUpload?.originFileObj) {
                                                            const encodedFile = await fileToBase64(
                                                                fileToUpload.originFileObj as File
                                                            );

                                                            setUrl(encodedFile.url);
                                                            setFile(fileToUpload.originFileObj);
                                                            setFieldValue('footerMessage', undefined);
                                                            setFieldValue('fileUrl', undefined);
                                                        } else {
                                                            setUrl('');
                                                            return setFieldValue('fileUrl', undefined);
                                                        }
                                                    }}
                                                >
                                                    <Button
                                                        disabled={
                                                            (!!currentTemplate?._id && !!currentTemplate?.isHsm) ||
                                                            values?.buttons?.[0]?.type === TemplateButtonType.FLOW
                                                        }
                                                    >
                                                        <BiUpload style={{ marginRight: '5px' }} />{' '}
                                                        {getTranslation('Select file')}
                                                    </Button>
                                                </Upload>
                                            </LabelWrapper>
                                        </Wrapper>

                                        <Wrapper margin='15px 0 0 0'>
                                            <Card header={<span>{getTranslation('Buttons')}</span>}>
                                                <Wrapper flexBox flexDirection='column'>
                                                    {values.buttons &&
                                                        values.buttons?.map((button, index) => {
                                                            return (
                                                                <LabelWrapper
                                                                    validate={{
                                                                        touched,
                                                                        errors,
                                                                        isSubmitted: submitted,
                                                                        fieldName: `buttons[${index}].text`,
                                                                    }}
                                                                    label={`${getTranslation(
                                                                        button.type === TemplateButtonType.QUICK_REPLY
                                                                            ? 'Quick reply'
                                                                            : button.type === TemplateButtonType.FLOW
                                                                            ? 'Flow'
                                                                            : 'URL'
                                                                    )} - ${index + 1}`}
                                                                >
                                                                    <Input
                                                                        value={button.text}
                                                                        disabled={disabledUpdateHsm}
                                                                        maxLength={20}
                                                                        showCount
                                                                        placeholder={getTranslation('Add text')}
                                                                        style={{ width: '40%', margin: '3px 0' }}
                                                                        onChange={(ev: any) => {
                                                                            setFieldValue(
                                                                                `buttons[${index}].text`,
                                                                                ev.target.value
                                                                            );
                                                                        }}
                                                                    />
                                                                    {button.type === TemplateButtonType.URL ? (
                                                                        <>
                                                                            <Input
                                                                                value={button.url}
                                                                                disabled={disabledUpdateHsm}
                                                                                maxLength={2000}
                                                                                showCount
                                                                                addonAfter={
                                                                                    !button.example?.length ? (
                                                                                        <RiBracesLine
                                                                                            title={getTranslation(
                                                                                                'Add variable'
                                                                                            )}
                                                                                            style={{
                                                                                                cursor: 'pointer',
                                                                                            }}
                                                                                            onClick={() => {
                                                                                                if (disabledUpdateHsm) {
                                                                                                    return;
                                                                                                }
                                                                                                setFieldValue(
                                                                                                    `buttons[${index}].example`,
                                                                                                    ['']
                                                                                                );
                                                                                                setFieldValue(
                                                                                                    `buttons[${index}].url`,
                                                                                                    button.url + '{{1}}'
                                                                                                );
                                                                                            }}
                                                                                        />
                                                                                    ) : null
                                                                                }
                                                                                placeholder={getTranslation('Add URL')}
                                                                                style={{
                                                                                    width: button.example?.length
                                                                                        ? '30%'
                                                                                        : '50%',
                                                                                    margin: '3px 0',
                                                                                }}
                                                                                onChange={(ev: any) => {
                                                                                    if (button.example?.length) {
                                                                                        return;
                                                                                    }
                                                                                    let url = ev.target.value;
                                                                                    url = (url || '').replace(
                                                                                        /\{\{(.+?)\}\}/g,
                                                                                        ''
                                                                                    );
                                                                                    setFieldValue(
                                                                                        `buttons[${index}].url`,
                                                                                        url
                                                                                    );
                                                                                }}
                                                                            />
                                                                            {button.example?.length ? (
                                                                                <Input
                                                                                    value={button.example?.[0]}
                                                                                    disabled={disabledUpdateHsm}
                                                                                    maxLength={2000}
                                                                                    title={getTranslation(
                                                                                        'Add an example for variable'
                                                                                    )}
                                                                                    placeholder={getTranslation(
                                                                                        'Add an example for variable'
                                                                                    )}
                                                                                    addonAfter={
                                                                                        <div
                                                                                            title={getTranslation(
                                                                                                'Remove variable'
                                                                                            )}
                                                                                            style={{
                                                                                                cursor: 'pointer',
                                                                                            }}
                                                                                            onClick={() => {
                                                                                                if (disabledUpdateHsm) {
                                                                                                    return;
                                                                                                }
                                                                                                setFieldValue(
                                                                                                    `buttons[${index}].example`,
                                                                                                    undefined
                                                                                                );
                                                                                                setFieldValue(
                                                                                                    `buttons[${index}].url`,
                                                                                                    button.url?.replace(
                                                                                                        '{{1}}',
                                                                                                        ''
                                                                                                    )
                                                                                                );
                                                                                            }}
                                                                                        >
                                                                                            X
                                                                                        </div>
                                                                                    }
                                                                                    style={{
                                                                                        width: '20%',
                                                                                        margin: '3px 0',
                                                                                    }}
                                                                                    onChange={(ev: any) => {
                                                                                        setFieldValue(
                                                                                            `buttons[${index}].example[0]`,
                                                                                            ev.target.value
                                                                                        );
                                                                                    }}
                                                                                />
                                                                            ) : null}
                                                                        </>
                                                                    ) : null}
                                                                    {isAdminOrDevAdmin &&
                                                                    button.type === TemplateButtonType.FLOW ? (
                                                                        <Select
                                                                            value={button.flowDataId}
                                                                            disabled={disabledUpdateHsm}
                                                                            placeholder={getTranslation(
                                                                                'ID do flow data'
                                                                            )}
                                                                            style={{ width: '40%', margin: '3px 0' }}
                                                                            onChange={(value: any) => {
                                                                                setFieldValue(
                                                                                    `buttons[${index}].flowDataId`,
                                                                                    value
                                                                                );
                                                                            }}
                                                                            children={
                                                                                <>
                                                                                    {workspaceFlowData?.map(
                                                                                        (flowData) => {
                                                                                            const disabled =
                                                                                                flowData.flow
                                                                                                    ?.status !==
                                                                                                'PUBLISHED';
                                                                                            return (
                                                                                                <option
                                                                                                    style={{
                                                                                                        opacity:
                                                                                                            disabled
                                                                                                                ? '0.6'
                                                                                                                : '1',
                                                                                                    }}
                                                                                                    value={flowData.id}
                                                                                                    title={
                                                                                                        flowData.name
                                                                                                    }
                                                                                                    disabled={disabled}
                                                                                                >
                                                                                                    <div
                                                                                                        style={{
                                                                                                            display:
                                                                                                                'flex',
                                                                                                            justifyContent:
                                                                                                                'space-between',
                                                                                                            alignItems:
                                                                                                                'center',
                                                                                                        }}
                                                                                                    >
                                                                                                        <span>
                                                                                                            {
                                                                                                                flowData.name
                                                                                                            }
                                                                                                        </span>
                                                                                                        <TagComponent
                                                                                                            color={
                                                                                                                flowData
                                                                                                                    .flow
                                                                                                                    ?.status ===
                                                                                                                'PUBLISHED'
                                                                                                                    ? 'green'
                                                                                                                    : 'orange'
                                                                                                            }
                                                                                                        >
                                                                                                            {flowData
                                                                                                                .flow
                                                                                                                ?.status ===
                                                                                                            'PUBLISHED'
                                                                                                                ? 'Publicado'
                                                                                                                : 'Não publicado'}
                                                                                                        </TagComponent>
                                                                                                    </div>
                                                                                                </option>
                                                                                            );
                                                                                        }
                                                                                    )}
                                                                                </>
                                                                            }
                                                                        />
                                                                    ) : null}
                                                                    <Button
                                                                        type={'text'}
                                                                        className='antd-span-default-color'
                                                                        children={'X'}
                                                                        disabled={disabledUpdateHsm}
                                                                        onClick={() => {
                                                                            const newButtons = values.buttons || [];
                                                                            newButtons.splice(index, 1);
                                                                            setFieldValue(`buttons`, newButtons);
                                                                            if (newButtons.length === 0) {
                                                                                setFieldValue('footerMessage', '');
                                                                            }
                                                                        }}
                                                                    />
                                                                </LabelWrapper>
                                                            );
                                                        })}
                                                </Wrapper>
                                                <Wrapper flexBox>
                                                    <Button
                                                        className='antd-span-default-color'
                                                        type={'default'}
                                                        style={{
                                                            marginTop: values.buttons?.length ? '10px' : '',
                                                            width: 'max-content',
                                                        }}
                                                        disabled={disableButtonQuick(values.buttons)}
                                                        onClick={() => {
                                                            const newButtons = values.buttons || [];
                                                            newButtons.push({
                                                                type: TemplateButtonType.QUICK_REPLY,
                                                                text: '',
                                                            });
                                                            setFieldValue('buttons', newButtons);
                                                        }}
                                                        children={getTranslation('Add quick reply button')}
                                                    />
                                                    <Button
                                                        className='antd-span-default-color'
                                                        type={'default'}
                                                        style={{
                                                            marginTop: values.buttons?.length ? '10px' : '',
                                                            marginLeft: '8px',
                                                            width: 'max-content',
                                                        }}
                                                        disabled={disableButtonUrl(values.buttons)}
                                                        onClick={() => {
                                                            const newButtons = values.buttons || [];
                                                            newButtons.push({
                                                                type: TemplateButtonType.URL,
                                                                text: '',
                                                                url: 'https://',
                                                            });
                                                            setFieldValue('buttons', newButtons);
                                                        }}
                                                        children={getTranslation('Add URL button')}
                                                    />
                                                    {isAdminOrDevAdmin && (
                                                        <Button
                                                            className='antd-span-default-color'
                                                            type={'default'}
                                                            style={{
                                                                marginTop: values.buttons?.length ? '10px' : '',
                                                                marginLeft: '8px',
                                                                width: 'max-content',
                                                            }}
                                                            disabled={disableButtonFlow(values.buttons)}
                                                            onClick={() => {
                                                                const newButtons = values.buttons || [];
                                                                newButtons.push({
                                                                    type: TemplateButtonType.FLOW,
                                                                    text: '',
                                                                });
                                                                setFieldValue('buttons', newButtons);
                                                                setUrl('');
                                                                setFile(undefined);
                                                                setFieldValue('channels', []);
                                                                setFieldValue('fileUrl', undefined);
                                                                setFieldValue('footerMessage', '');
                                                            }}
                                                            children={getTranslation('Adicionar botão de Flow')}
                                                        />
                                                    )}
                                                </Wrapper>
                                            </Card>
                                        </Wrapper>

                                        {(isAdmin || isDevAdmin) && values.isHsm && !values?._id && (
                                            <Wrapper margin='5px 0'>
                                                <LabelWrapper
                                                    validate={{
                                                        touched,
                                                        errors,
                                                        isSubmitted: submitted,
                                                        fieldName: `category`,
                                                    }}
                                                    label={getTranslation('Category')}
                                                >
                                                    <Select
                                                        style={{ width: '20%' }}
                                                        size='large'
                                                        placeholder={getTranslation('Category')}
                                                        options={[
                                                            {
                                                                label: getTranslation(TemplateCategory.UTILITY),
                                                                value: TemplateCategory.UTILITY,
                                                            },
                                                            {
                                                                label: getTranslation(TemplateCategory.MARKETING),
                                                                value: TemplateCategory.MARKETING,
                                                            },
                                                            {
                                                                label: getTranslation(TemplateCategory.AUTHENTICATION),
                                                                value: TemplateCategory.AUTHENTICATION,
                                                            },
                                                        ]}
                                                        value={values.category}
                                                        onChange={(value) => {
                                                            setFieldValue('category', value);
                                                            values.category = value;
                                                        }}
                                                    />
                                                </LabelWrapper>
                                                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                                    <Switch
                                                        checked={allowTemplateCategoryChange}
                                                        onChange={() =>
                                                            setAllowTemplateCategoryChange(!allowTemplateCategoryChange)
                                                        }
                                                        style={{ margin: '10px 10px 0 0' }}
                                                    />
                                                    {getTranslation('Allow Whatsapp to change template category')}
                                                </div>
                                            </Wrapper>
                                        )}
                                        <Wrapper>
                                            <LabelWrapper
                                                validate={{
                                                    touched,
                                                    errors,
                                                    isSubmitted: submitted,
                                                    fieldName: `tags`,
                                                }}
                                                label={getTranslation('Tags')}
                                            >
                                                <Select
                                                    mode='multiple'
                                                    style={{ width: '100%' }}
                                                    filterOption={(input, option) =>
                                                        (option?.label ?? '')
                                                            .toLowerCase()
                                                            .includes(input.toLowerCase())
                                                    }
                                                    size='large'
                                                    allowClear
                                                    maxTagTextLength={30}
                                                    placeholder={getTranslation('Tags')}
                                                    options={workspaceTags?.map((team) => ({
                                                        label: team.name,
                                                        value: team._id,
                                                    }))}
                                                    value={values.tags}
                                                    onChange={(value) => {
                                                        setFieldValue('tags', value);
                                                        values.tags = value;
                                                    }}
                                                />
                                            </LabelWrapper>
                                        </Wrapper>
                                        {isAnyAdmin && (
                                            <Wrapper>
                                                <LabelWrapper
                                                    validate={{
                                                        touched,
                                                        errors,
                                                        isSubmitted: submitted,
                                                        fieldName: `action`,
                                                    }}
                                                    label={getTranslation('Custom flow')}
                                                >
                                                    <Select
                                                        style={{ width: '100%' }}
                                                        filterOption={(input, option) =>
                                                            (option?.label ?? '')
                                                                .toLowerCase()
                                                                .includes(input.toLowerCase())
                                                        }
                                                        size='large'
                                                        allowClear
                                                        maxTagTextLength={30}
                                                        placeholder={getTranslation('action')}
                                                        options={customFlow?.map((team) => ({
                                                            label: team.name,
                                                            value: team.action,
                                                        }))}
                                                        value={values.action}
                                                        onChange={(value) => {
                                                            setFieldValue('action', value);
                                                            values.action = value;
                                                        }}
                                                    />
                                                </LabelWrapper>
                                            </Wrapper>
                                        )}
                                        <Wrapper margin='15px 35px 0 35px' borderBottom='1px #ddd solid' />
                                        <TemplatePermissions
                                            workspaceId={workspaceId}
                                            template={currentTemplate}
                                            submitted={submitted}
                                            loadingRequest={loadingRequest}
                                            setLoadingRequest={setLoadingRequest}
                                            user={user}
                                            {...formikProps}
                                        />
                                    </Form>
                                </Card>
                            </Spin>

                            {activeModal === InlineStyleType.AI_SUGGESTION && (
                                <TemplateSuggestionsModal
                                    activeModal={activeModal}
                                    onClose={() => setActiveModal(null)}
                                    workspaceId={workspaceId}
                                    template={{
                                        ...currentTemplate,
                                        message: textEditor,
                                    }}
                                    onSelectSuggestion={handleSelectSuggestion}
                                    disabled={disableTextFileInvalidType || disabledUpdateHsm}
                                    withError={modalErrors}
                                    onClearError={() => {
                                        setModalErrors(undefined);
                                        setHasValidationErrors(false);
                                        setHas422Error(false);
                                        setWithError(undefined);
                                    }}
                                    setFieldValue={setFieldValue}
                                    setTextEditor={setTextEditor}
                                />
                            )}

                            {activeModal === InlineStyleType.AI_INSIGHT && (
                                <TemplateInsightsModal
                                    activeModal={activeModal}
                                    onClose={() => setActiveModal(null)}
                                    workspaceId={workspaceId}
                                    template={{
                                        ...currentTemplate,
                                        message: textEditor,
                                    }}
                                />
                            )}
                        </>
                    );
                }}
            />
        </Wrapper>
    );
};

export default i18n(EditTemplate) as FC<EditTemplateProps>;
