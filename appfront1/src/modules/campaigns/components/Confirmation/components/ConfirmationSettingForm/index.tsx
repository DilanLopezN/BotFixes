import { Button, Col, Divider, Input, Row, Select, Switch } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import { useFormik } from 'formik-latest';
import { FC, useEffect, useState } from 'react';
import { MdAdd } from 'react-icons/md';
import { useHistory, useParams } from 'react-router-dom';
import * as Yup from 'yup';
import { HealthIntegration } from '../../../../../../model/Integrations';
import CardWrapperForm from '../../../../../../shared-v2/CardWrapperForm/CardWrapperForm';
import Header from '../../../../../../shared-v2/Header/Header';
import { LabelWrapper } from '../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { Card, Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { addNotification } from '../../../../../../utils/AddNotification';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { HealthService } from '../../../../../integrations/services/HealthService';
import { TemplateMessage } from '../../../../../liveAgent/components/TemplateMessageList/interface';
import { ScrollView } from '../../../../../settings/components/ScrollView';
import { WorkspaceService } from '../../../../../workspace/services/WorkspaceService';
import { ActiveMessageSetting } from '../../../../interfaces/active-message-setting-dto';
import {
    ConfirmationSettingFormDto,
    RecipientType,
    ScheduleGroupRule,
} from '../../../../interfaces/confirmation-setting';
import { ExtractRule } from '../../../../interfaces/schedule-setting';
import { CreateSendSetting, ExtractResumeType, UpdateSendSetting } from '../../../../interfaces/send-setting';
import { CampaignsService } from '../../../../service/CampaignsService';
import { ConfirmationSettingService } from '../../../../service/ConfirmationService';
import { EmailSendingSettingService } from '../../../../service/EmailSendingSettingService/EmailSendingSettingService';
import { EmailSendingSetting } from '../../../../service/EmailSendingSettingService/interface';
import { SendSettingActions } from './components/send-setting-actions';
import SendSettingForm from './components/sendSettingForm';
import { ConfirmationSettingFormProps } from './props';
import { ToggleWrapper } from './style';

export const defaultConfirmationSetting: ConfirmationSettingFormDto = {
    schedule: {
        name: '',
        active: true,
        integrationId: '',
        getScheduleInterval: 1,
        extractAt: 0,
        extractRule: ExtractRule.DEFAULT,
        useSpecialityOnExamMessage: false,
        enableSendRetry: false,
        enableResendNotAnswered: false,
        sendOnlyPrincipalExam: false,
        omitAppointmentTypeName: false,
        omitExtractGuidance: false,
        fridayJoinWeekendMonday: false,
        useIsFirstComeFirstServedAsTime: false,
        useOrganizationUnitOnGroupDescription: false,
        checkScheduleChanges: false,
        omitTimeOnGroupDescription: false,
        useSendFullDay: false,
        externalExtract: false,
        buildDescriptionWithAddress: false,
    },
    confirmation: {
        active: true,
        apiToken: '',
        templateId: '',
        retryInvalid: false,
        resendMsgNoMatch: false,
        erpParams: '',
        sendRecipientType: RecipientType.whatsapp,
        sendingGroupType: 'principal',
    },
    reminder: {
        active: true,
        apiToken: '',
        templateId: '',
        retryInvalid: false,
        sendBeforeScheduleDate: 1,
        erpParams: '',
        sendRecipientType: RecipientType.whatsapp,
        sendingGroupType: 'principal',
    },
    sendSettings: [
        {
            active: true,
            apiToken: '',
            templateId: '',
            retryInvalid: false,
            resendMsgNoMatch: false,
            hoursBeforeScheduleDate: 1,
            erpParams: '',
            type: ExtractResumeType.nps,
            groupRule: ScheduleGroupRule.allOfRange,
            sendAction: false,
            sendRecipientType: RecipientType.whatsapp,
            sendingGroupType: 'principal',
        },
    ],
};
const ConfirmationSettingForm: FC<ConfirmationSettingFormProps & I18nProps> = (props) => {
    const { getTranslation, selectedWorkspace, setCreateConfirmationSetting } = props;

    const params: any = useParams();
    const history = useHistory();
    const [currentConfirmationForm, setCurrentConfirmationForm] =
        useState<ConfirmationSettingFormDto>(defaultConfirmationSetting);
    const [activeMessages, setActiveMessages] = useState<ActiveMessageSetting[]>([]);
    const [templates, setTemplates] = useState<TemplateMessage[]>([]);
    const [integrations, setIntegrations] = useState<HealthIntegration[]>([]);
    const [emailSendingSettings, setEmailSendingSettings] = useState<EmailSendingSetting[]>([]);
    const [loading, setLoading] = useState(false);

    const getValidationSchema = (): Yup.ObjectSchema => {
        return Yup.object().shape({
            schedule: Yup.object({
                name: Yup.string().required(getTranslation('This field is required')),
                integrationId: Yup.string().required(getTranslation('This field is required')),
            }),
        });
    };

    const formik = useFormik({
        initialValues: currentConfirmationForm,
        enableReinitialize: true,
        validationSchema: getValidationSchema(),
        onSubmit: () => {
            formik.setSubmitting(true);
            formik.validateForm().then((validatedValues: any) => {
                if (validatedValues.isCanceled) {
                    return formik.handleSubmit();
                }

                if (Object.keys(validatedValues).length === 0) {
                    save(formik.values);
                }
            });
        },
    });

    const save = (values: ConfirmationSettingFormDto) => {
        if (values.schedule.id) {
            updateConfirmationSettings(values);
            return;
        }

        createConfirmationAndSchedule(values);
    };

    const createConfirmationAndSchedule = async (values: ConfirmationSettingFormDto) => {
        let error;

        const newSendSettings: CreateSendSetting[] =
            values?.sendSettings?.map((sendSett) => {
                return {
                    active: sendSett.active,
                    apiToken: sendSett.apiToken,
                    templateId: sendSett.templateId,
                    type: sendSett.type,
                    erpParams: sendSett.erpParams,
                    groupRule: sendSett.groupRule,
                    retryInvalid: sendSett.retryInvalid,
                    resendMsgNoMatch: sendSett.resendMsgNoMatch,
                    hoursBeforeScheduleDate: sendSett.hoursBeforeScheduleDate,
                    sendAction: sendSett.sendAction,
                    sendRecipientType: sendSett.sendRecipientType,
                    emailSendingSettingId: sendSett.emailSendingSettingId,
                    sendingGroupType: sendSett.sendingGroupType,
                };
            }) || [];

        const response = await ConfirmationSettingService.createConfirmationSetting(
            selectedWorkspace._id,
            {
                schedule: {
                    getScheduleInterval: Number(values.schedule.getScheduleInterval),
                    integrationId: values.schedule.integrationId,
                    name: values.schedule.name,
                    active: values.schedule.active,
                    extractAt: values.schedule.extractAt,
                    extractRule: values.schedule.extractRule,
                    useSpecialityOnExamMessage: values.schedule.useSpecialityOnExamMessage,
                    sendOnlyPrincipalExam: values.schedule.sendOnlyPrincipalExam,
                    enableSendRetry: values.schedule.enableSendRetry,
                    enableResendNotAnswered: values.schedule.enableResendNotAnswered,
                    omitAppointmentTypeName: values.schedule.omitAppointmentTypeName,
                    omitExtractGuidance: values.schedule.omitExtractGuidance,
                    fridayJoinWeekendMonday: values.schedule.fridayJoinWeekendMonday,
                    useIsFirstComeFirstServedAsTime: values.schedule.useIsFirstComeFirstServedAsTime,
                    useOrganizationUnitOnGroupDescription: values.schedule.useOrganizationUnitOnGroupDescription,
                    checkScheduleChanges: values.schedule.checkScheduleChanges,
                    omitTimeOnGroupDescription: values.schedule.omitTimeOnGroupDescription,
                    timeResendNotAnswered: values.schedule.timeResendNotAnswered,
                    useSendFullDay: values.schedule.useSendFullDay,
                    externalExtract: values.schedule.externalExtract,
                    buildDescriptionWithAddress: values.schedule.buildDescriptionWithAddress,
                },
                confirmation: {
                    active: !!values.confirmation.active,
                    apiToken: values.confirmation.apiToken,
                    templateId: values.confirmation.templateId,
                    retryInvalid: values.confirmation.retryInvalid,
                    sendWhatsBeforeScheduleDate: Number(values.confirmation.sendWhatsBeforeScheduleDate),
                    erpParams: values.confirmation?.erpParams,
                    groupRule: values.confirmation?.groupRule,
                    resendMsgNoMatch: values.confirmation.resendMsgNoMatch,
                    sendRecipientType: values?.confirmation?.sendRecipientType,
                    emailSendingSettingId: values?.confirmation?.emailSendingSettingId,
                    sendingGroupType: values?.confirmation?.sendingGroupType,
                },
                reminder: {
                    active: !!values.reminder?.active,
                    apiToken: values.reminder?.apiToken!,
                    sendBeforeScheduleDate: Number(values.reminder?.sendBeforeScheduleDate!),
                    templateId: values.reminder?.templateId!,
                    retryInvalid: values.reminder?.retryInvalid,
                    erpParams: values.reminder?.erpParams,
                    groupRule: values.reminder?.groupRule,
                    sendAction: values.reminder?.sendAction,
                    sendRecipientType: values?.reminder?.sendRecipientType,
                    emailSendingSettingId: values?.reminder?.emailSendingSettingId,
                    sendingGroupType: values?.reminder?.sendingGroupType,
                },
                sendSettings: newSendSettings,
            },
            (err) => {
                error = err;
            }
        );

        if (!error && response) {
            formik.setValues({
                ...formik.values,
                confirmation: { ...formik.values.confirmation, id: response?.confirmation?.id },
                schedule: { ...formik.values.schedule, id: response?.schedule?.id },
                reminder: {
                    ...(formik.values.reminder || response.reminder),
                    id: response?.reminder?.id,
                },
                sendSettings: [...(response?.sendSettings || formik.values?.sendSettings)],
            });
            return addNotification({
                type: 'success',
                title: getTranslation('Success'),
                message: getTranslation('Configurações da confirmação salva com sucesso'),
            });
        }

        return addNotification({
            type: 'warning',
            title: getTranslation('Error'),
            message: getTranslation('Erro ao salvar configurações da confirmação'),
        });
    };

    const updateConfirmationSettings = async (values: ConfirmationSettingFormDto) => {
        let error;

        const newSendSettings: UpdateSendSetting[] =
            values?.sendSettings?.map((sendSett) => {
                return {
                    active: sendSett.active,
                    apiToken: sendSett.apiToken,
                    templateId: sendSett.templateId,
                    type: sendSett.type,
                    erpParams: sendSett.erpParams,
                    groupRule: sendSett.groupRule,
                    retryInvalid: sendSett.retryInvalid,
                    resendMsgNoMatch: sendSett.resendMsgNoMatch,
                    hoursBeforeScheduleDate: sendSett.hoursBeforeScheduleDate,
                    scheduleSettingId: values.schedule.id!,
                    sendAction: sendSett.sendAction,
                    sendRecipientType: sendSett.sendRecipientType,
                    emailSendingSettingId: sendSett.emailSendingSettingId,
                    sendingGroupType: sendSett.sendingGroupType,
                    id: sendSett.id!,
                    workspaceId: selectedWorkspace._id,
                };
            }) || [];
        const response = await ConfirmationSettingService.updateConfirmationSetting(
            selectedWorkspace._id,
            values.schedule.id!,
            {
                schedule: {
                    getScheduleInterval: Number(values.schedule.getScheduleInterval),
                    integrationId: values.schedule.integrationId,
                    active: values.schedule.active,
                    name: values.schedule.name,
                    id: values.schedule.id!,
                    workspaceId: selectedWorkspace._id,
                    extractAt: values.schedule.extractAt,
                    extractRule: values.schedule.extractRule,
                    useSpecialityOnExamMessage: values.schedule.useSpecialityOnExamMessage,
                    sendOnlyPrincipalExam: values.schedule.sendOnlyPrincipalExam,
                    enableSendRetry: values.schedule.enableSendRetry,
                    enableResendNotAnswered: values.schedule.enableResendNotAnswered,
                    omitAppointmentTypeName: values.schedule.omitAppointmentTypeName,
                    omitExtractGuidance: values.schedule.omitExtractGuidance,
                    fridayJoinWeekendMonday: values.schedule.fridayJoinWeekendMonday,
                    useIsFirstComeFirstServedAsTime: values.schedule.useIsFirstComeFirstServedAsTime,
                    useOrganizationUnitOnGroupDescription: values.schedule.useOrganizationUnitOnGroupDescription,
                    checkScheduleChanges: values.schedule.checkScheduleChanges,
                    omitTimeOnGroupDescription: values.schedule.omitTimeOnGroupDescription,
                    timeResendNotAnswered: values.schedule.timeResendNotAnswered,
                    useSendFullDay: values.schedule.useSendFullDay,
                    externalExtract: values.schedule.externalExtract,
                    buildDescriptionWithAddress: values.schedule.buildDescriptionWithAddress,
                },
                confirmation: {
                    apiToken: values.confirmation.apiToken,
                    templateId: values.confirmation.templateId,
                    active: values.confirmation.active,
                    id: values.confirmation.id!,
                    scheduleSettingId: values.confirmation.scheduleSettingId!,
                    sendWhatsBeforeScheduleDate: Number(values.confirmation.sendWhatsBeforeScheduleDate),
                    retryInvalid: values.confirmation?.retryInvalid,
                    erpParams: values.confirmation?.erpParams,
                    groupRule: values.confirmation?.groupRule,
                    resendMsgNoMatch: values?.confirmation?.resendMsgNoMatch,
                    sendRecipientType: values?.confirmation?.sendRecipientType,
                    emailSendingSettingId: values?.confirmation?.emailSendingSettingId,
                    sendingGroupType: values?.confirmation?.sendingGroupType,
                    workspaceId: selectedWorkspace._id,
                },
                reminder: {
                    active: !!values.reminder?.active,
                    apiToken: values.reminder?.apiToken!,
                    scheduleSettingId: values.reminder?.scheduleSettingId!,
                    sendBeforeScheduleDate: Number(values.reminder?.sendBeforeScheduleDate!),
                    retryInvalid: values.reminder?.retryInvalid,
                    templateId: values.reminder?.templateId!,
                    erpParams: values.reminder?.erpParams,
                    groupRule: values.reminder?.groupRule,
                    sendAction: values.reminder?.sendAction,
                    sendRecipientType: values?.reminder?.sendRecipientType,
                    emailSendingSettingId: values?.reminder?.emailSendingSettingId,
                    sendingGroupType: values?.reminder?.sendingGroupType,
                    id: values.reminder?.id!,
                    workspaceId: selectedWorkspace._id,
                },
                sendSettings: newSendSettings,
            },
            (err) => {
                error = err;
            }
        );

        if (!error && response) {
            return addNotification({
                type: 'success',
                title: getTranslation('Success'),
                message: getTranslation('Configurações da confirmação salva com sucesso'),
            });
        }

        return addNotification({
            type: 'warning',
            title: getTranslation('Error'),
            message: getTranslation('Erro ao salvar configurações da confirmação'),
        });
    };

    const getConfirmationSetting = async (scheduleSettingId: number) => {
        if (!selectedWorkspace._id) {
            return;
        }
        setLoading(true);

        const response = await ConfirmationSettingService.getScheduleSettingAndViculedSettings(
            selectedWorkspace._id,
            scheduleSettingId
        );

        if (response) {
            setCurrentConfirmationForm({
                schedule: {
                    name: response.name || '',
                    active: response.active,
                    getScheduleInterval: response.getScheduleInterval || 0,
                    integrationId: response.integrationId,
                    id: response.id,
                    apiKey: response.apiKey,
                    extractRule: response.extractRule,
                    extractAt: response.extractAt,
                    useSpecialityOnExamMessage: response.useSpecialityOnExamMessage,
                    sendOnlyPrincipalExam: response.sendOnlyPrincipalExam,
                    enableSendRetry: response.enableSendRetry,
                    enableResendNotAnswered: response.enableResendNotAnswered,
                    omitAppointmentTypeName: response.omitAppointmentTypeName,
                    omitExtractGuidance: response.omitExtractGuidance,
                    fridayJoinWeekendMonday: response.fridayJoinWeekendMonday,
                    useIsFirstComeFirstServedAsTime: response.useIsFirstComeFirstServedAsTime,
                    useOrganizationUnitOnGroupDescription: response.useOrganizationUnitOnGroupDescription,
                    checkScheduleChanges: response.checkScheduleChanges,
                    omitTimeOnGroupDescription: response.omitTimeOnGroupDescription,
                    timeResendNotAnswered: response.timeResendNotAnswered,
                    useSendFullDay: response.useSendFullDay,
                    externalExtract: response.externalExtract,
                    buildDescriptionWithAddress: response.buildDescriptionWithAddress,
                },
                confirmation: {
                    active: response.confirmationSettings.active,
                    apiToken: response.confirmationSettings.apiToken,
                    templateId: response.confirmationSettings.templateId,
                    id: response.confirmationSettings.id,
                    scheduleSettingId: Number(response.confirmationSettings.scheduleSettingId),
                    sendWhatsBeforeScheduleDate: response.confirmationSettings.sendWhatsBeforeScheduleDate,
                    retryInvalid: response.confirmationSettings.retryInvalid,
                    erpParams: response.confirmationSettings?.erpParams,
                    groupRule: response.confirmationSettings?.groupRule || ScheduleGroupRule.firstOfRange,
                    resendMsgNoMatch: response.confirmationSettings?.resendMsgNoMatch,
                    sendRecipientType: response.confirmationSettings?.sendRecipientType,
                    emailSendingSettingId: response.confirmationSettings?.emailSendingSettingId,
                    sendingGroupType: response.confirmationSettings?.sendingGroupType,
                },
                reminder: {
                    active: response.reminderSettings?.active,
                    apiToken: response.reminderSettings?.apiToken,
                    templateId: response.reminderSettings?.templateId,
                    id: response.reminderSettings?.id,
                    scheduleSettingId: Number(response.reminderSettings?.scheduleSettingId),
                    sendBeforeScheduleDate: response.reminderSettings?.sendBeforeScheduleDate,
                    retryInvalid: response.reminderSettings?.retryInvalid,
                    erpParams: response.reminderSettings?.erpParams,
                    groupRule: response.reminderSettings?.groupRule || ScheduleGroupRule.firstOfRange,
                    sendAction: response.reminderSettings?.sendAction,
                    sendRecipientType: response.reminderSettings?.sendRecipientType,
                    emailSendingSettingId: response.reminderSettings?.emailSendingSettingId,
                    sendingGroupType: response.reminderSettings?.sendingGroupType,
                },
                sendSettings: response.sendSettings,
            });
        }
        setLoading(false);
    };

    const getIntegrationList = async () => {
        if (!selectedWorkspace._id) {
            return;
        }

        const response = await HealthService.getHealthIntegrations(selectedWorkspace._id);

        setIntegrations(response.data || []);
    };

    const getActiveMessageList = async () => {
        if (!selectedWorkspace._id) {
            return;
        }

        const response = await CampaignsService.getActiveMessages(selectedWorkspace._id);

        setActiveMessages(response || []);
    };

    const getTemplateList = async () => {
        if (!selectedWorkspace._id) {
            return;
        }
        const query = {
            skip: 0,
            limit: 250,
            filter: { isHsm: true, active: true },
        };

        const response = await WorkspaceService.getTemplates(query, selectedWorkspace._id);

        setTemplates(response.data || []);
    };

    const getEmailSendingSettings = async () => {
        if (!selectedWorkspace._id) {
            return;
        }

        const response = await EmailSendingSettingService.listEmailSendingSetting(selectedWorkspace._id);

        setEmailSendingSettings(response || []);
    };

    useEffect(() => {
        const scheduleSettingId = params?.scheduleSettingId;
        if (scheduleSettingId) {
            getConfirmationSetting(Number(scheduleSettingId));
        }
        getActiveMessageList();
        getTemplateList();
        getIntegrationList();
        getEmailSendingSettings();
    }, []);

    const optionsActiveMessage = (objective: ExtractResumeType) => {
        if (!activeMessages.length) {
            return [];
        }

        return activeMessages
            .filter(
                (actMessage) =>
                    !!actMessage.enabled &&
                    (actMessage?.objective === null || String(actMessage.objective) === objective)
            )
            ?.map((currAct, index) => ({
                label: currAct?.settingName || `${getTranslation('Active message')} ${index + 1}`,
                value: currAct.apiToken,
            }));
    };

    const optionsTemplate = () => {
        if (!templates.length) {
            return [];
        }

        return templates.map((template, index) => ({
            label: template?.name,
            value: template._id,
        }));
    };

    const optionsIntegrations = () => {
        if (!integrations.length) {
            return [];
        }

        return integrations.map((integration, index) => ({
            label: integration.name,
            value: integration._id,
        }));
    };

    const optionsGroupRule = () => {
        return [
            {
                label: 'Primeiro do alcance',
                value: ScheduleGroupRule.firstOfRange,
            },
            {
                label: 'Todos do alcance',
                value: ScheduleGroupRule.allOfRange,
            },
        ];
    };

    const optionsSendRecipientType = () => {
        return [
            {
                label: 'Whatsapp',
                value: RecipientType.whatsapp,
            },
            {
                label: 'E-mail',
                value: RecipientType.email,
            },
        ];
    };

    const optionsExtractRule = () => {
        return [
            {
                label: 'Regra Padrão',
                value: ExtractRule.DEFAULT,
            },
            {
                label: 'Regra Diária',
                value: ExtractRule.DAILY,
            },
            {
                label: 'Regra Diária V2',
                value: ExtractRule.DAILYV2,
            },
            {
                label: 'Regra por hora',
                value: ExtractRule.HOURLY,
            },
        ];
    };

    const optionsTypeSendSetting = () => {
        return [
            {
                label: 'Confirmação',
                value: ExtractResumeType.confirmation,
            },
            {
                label: 'Lembrete',
                value: ExtractResumeType.reminder,
            },
            {
                label: 'Link pesquisa de satisfação',
                value: ExtractResumeType.nps,
            },
            {
                label: 'Laudo médico',
                value: ExtractResumeType.medical_report,
            },
            {
                label: 'Notificação de agendamento',
                value: ExtractResumeType.schedule_notification,
            },
            {
                label: 'Resgate de agendamento perdido',
                value: ExtractResumeType.recover_lost_schedule,
            },
            {
                label: 'NPS',
                value: ExtractResumeType.nps_score,
            },
            {
                label: 'Solicitação de documentos',
                value: ExtractResumeType.documents_request,
            },
            {
                label: 'Marketing ativo',
                value: ExtractResumeType.active_mkt,
            },
        ];
    };

    const sanitizeText = (text: string) => {
        if (!text) return '';

        let newText = text.replaceAll(' ', '_');
        newText = newText.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        newText = newText.replace(/[[\]{}.,?!/=+*\\|:;@#$%&()'"`~´^]/g, '_');
        newText = newText.toLocaleLowerCase();

        return newText;
    };

    const onCancel = () => {
        setCreateConfirmationSetting?.(false);
        history.replace(`/campaigns/confirmation-settings`);
    };

    return (
        <>
            <Header
                title={`${getTranslation(formik.values.schedule.id ? 'Edit' : 'Register')} ${getTranslation(
                    'automatic sending'
                ).toLowerCase()}`}
                buttonBack={{ visible: true, onClick: onCancel }}
                buttonSave={{
                    visible: true,
                    loading: loading,
                    onClick: () => {
                        formik.submitForm();
                    },
                }}
            />
            <ScrollView id='content-confirmation-setting-form'>
                <CardWrapperForm
                    title={getTranslation('Automatic sending')}
                    childrenHeader
                    loading={loading}
                    children={
                        <>
                            <Card margin='0 0 15px 0' header={getTranslation('Scheduling Settings')}>
                                <Row gutter={[16, 16]}>
                                    <Col span={12}>
                                        <LabelWrapper
                                            validate={{
                                                errors: formik.errors,
                                                fieldName: 'schedule.name',
                                                isSubmitted: formik.submitCount > 0,
                                                touched: true,
                                            }}
                                            label={getTranslation('Schedule configuration name')}
                                        >
                                            <Input
                                                value={formik.values.schedule.name}
                                                maxLength={100}
                                                onChange={(event) => {
                                                    formik.setFieldValue('schedule.name', event.target.value);
                                                }}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={8}>
                                        <LabelWrapper
                                            validate={{
                                                errors: formik.errors,
                                                fieldName: 'schedule.extractRule',
                                                isSubmitted: formik.submitCount > 0,
                                                touched: true,
                                            }}
                                            label={getTranslation('Extract rule')}
                                        >
                                            <Select
                                                value={formik.values.schedule.extractRule}
                                                style={{ width: '100%' }}
                                                options={optionsExtractRule()}
                                                onChange={(value) => {
                                                    formik.setFieldValue('schedule.extractRule', value);
                                                }}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={4}>
                                        <LabelWrapper label=' '>
                                            <ToggleWrapper>
                                                <Switch
                                                    checked={formik.values.schedule.active}
                                                    onChange={() => {
                                                        formik.setFieldValue(
                                                            'schedule.active',
                                                            !formik.values.schedule.active
                                                        );
                                                    }}
                                                />
                                                <Wrapper margin='0 0 0 15px'>{getTranslation('Active')}</Wrapper>
                                            </ToggleWrapper>
                                        </LabelWrapper>
                                    </Col>
                                </Row>

                                <Row gutter={[16, 16]}>
                                    <Col span={8}>
                                        <LabelWrapper
                                            validate={{
                                                errors: formik.errors,
                                                fieldName: 'schedule.integrationId',
                                                isSubmitted: formik.submitCount > 0,
                                                touched: true,
                                            }}
                                            label={getTranslation('Integration')}
                                        >
                                            <Select
                                                value={formik.values.schedule.integrationId}
                                                style={{ width: '100%' }}
                                                options={optionsIntegrations()}
                                                onChange={(value) => {
                                                    formik.setFieldValue('schedule.integrationId', value);
                                                }}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={8}>
                                        <LabelWrapper label={getTranslation('Schedule search interval (Minutes)')}>
                                            <Input
                                                type='number'
                                                value={formik.values.schedule.getScheduleInterval}
                                                onChange={(event) => {
                                                    formik.setFieldValue(
                                                        'schedule.getScheduleInterval',
                                                        event.target.value
                                                    );
                                                }}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={8}>
                                        <LabelWrapper label={getTranslation('Extract at (Minutes)')}>
                                            <Input
                                                type='number'
                                                value={formik.values.schedule.extractAt}
                                                onChange={(event) => {
                                                    formik.setFieldValue('schedule.extractAt', event.target.value);
                                                }}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                </Row>
                                <Row style={{ alignItems: 'center' }} gutter={[16, 16]}>
                                    <Col span={8}>
                                        <LabelWrapper label=' '>
                                            <ToggleWrapper>
                                                <Switch
                                                    checked={formik.values.schedule.externalExtract}
                                                    onChange={() => {
                                                        formik.setFieldValue(
                                                            'schedule.externalExtract',
                                                            !formik.values.schedule.externalExtract
                                                        );
                                                    }}
                                                />
                                                <Wrapper margin='0 0 0 15px'>
                                                    {getTranslation('Envio por extração externa')}
                                                </Wrapper>
                                            </ToggleWrapper>
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={8}>
                                        <LabelWrapper label=' '>
                                            <ToggleWrapper>
                                                <Switch
                                                    checked={formik.values.schedule.buildDescriptionWithAddress}
                                                    onChange={() => {
                                                        formik.setFieldValue(
                                                            'schedule.buildDescriptionWithAddress',
                                                            !formik.values.schedule.buildDescriptionWithAddress
                                                        );
                                                    }}
                                                />
                                                <Wrapper margin='0 0 0 15px'>
                                                    {getTranslation(
                                                        'Concatenar endereços dos agendamentos na descrição'
                                                    )}
                                                </Wrapper>
                                            </ToggleWrapper>
                                        </LabelWrapper>
                                    </Col>
                                </Row>

                                <Divider
                                    children={getTranslation(
                                        'Configurações de reenvio de mensagem para confirmação quando não respondido'
                                    )}
                                    orientation='left'
                                    orientationMargin={20}
                                    style={{ marginBottom: -10, fontSize: 14, fontWeight: 'bold' }}
                                />
                                <Row style={{ alignItems: 'center' }} gutter={[16, 16]}>
                                    <Col span={8}>
                                        <LabelWrapper label=' '>
                                            <ToggleWrapper>
                                                <Switch
                                                    checked={formik.values.schedule.enableResendNotAnswered}
                                                    onChange={() => {
                                                        formik.setFieldValue(
                                                            'schedule.enableResendNotAnswered',
                                                            !formik.values.schedule.enableResendNotAnswered
                                                        );
                                                    }}
                                                />
                                                <Wrapper margin='0 0 0 15px'>
                                                    {getTranslation(
                                                        'Enable resending of the message for those who did not respond'
                                                    )}
                                                </Wrapper>
                                            </ToggleWrapper>
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={8}>
                                        <LabelWrapper label=' '>
                                            <ToggleWrapper>
                                                <Switch
                                                    checked={formik.values.schedule.checkScheduleChanges}
                                                    onChange={() => {
                                                        formik.setFieldValue(
                                                            'schedule.checkScheduleChanges',
                                                            !formik.values.schedule.checkScheduleChanges
                                                        );
                                                    }}
                                                />
                                                <Wrapper margin='0 0 0 15px'>
                                                    {getTranslation(
                                                        'Check if there have been changes to the schedule when resending a message'
                                                    )}
                                                </Wrapper>
                                            </ToggleWrapper>
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={8}>
                                        <LabelWrapper
                                            tooltip={getTranslation('Campo válido apenas se o reenvio estiver ativo')}
                                            tooltipStyle={{ rightDirection: true }}
                                            label={getTranslation(
                                                'Tempo sem resposta para que seja reenviada a mensagem (Hora)'
                                            )}
                                        >
                                            <Input
                                                type='number'
                                                value={formik.values.schedule.timeResendNotAnswered}
                                                min={0}
                                                onChange={(event) => {
                                                    formik.setFieldValue(
                                                        'schedule.timeResendNotAnswered',
                                                        event.target.value
                                                    );
                                                }}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                </Row>
                                <Divider
                                    children={getTranslation('Personalization Settings')}
                                    orientation='left'
                                    orientationMargin={20}
                                    style={{ marginBottom: -10, fontSize: 14, fontWeight: 'bold' }}
                                />

                                <Row style={{ alignItems: 'center' }} gutter={[16, 16]}>
                                    <Col span={6}>
                                        <LabelWrapper label=' '>
                                            <ToggleWrapper>
                                                <Switch
                                                    checked={formik.values.schedule.useSpecialityOnExamMessage}
                                                    onChange={() => {
                                                        formik.setFieldValue(
                                                            'schedule.useSpecialityOnExamMessage',
                                                            !formik.values.schedule.useSpecialityOnExamMessage
                                                        );
                                                    }}
                                                />
                                                <Wrapper margin='0 0 0 15px'>
                                                    {getTranslation('Use specialty in exam message')}
                                                </Wrapper>
                                            </ToggleWrapper>
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={6}>
                                        <LabelWrapper label=' '>
                                            <ToggleWrapper>
                                                <Switch
                                                    checked={formik.values.schedule.sendOnlyPrincipalExam}
                                                    onChange={() => {
                                                        formik.setFieldValue(
                                                            'schedule.sendOnlyPrincipalExam',
                                                            !formik.values.schedule.sendOnlyPrincipalExam
                                                        );
                                                    }}
                                                />
                                                <Wrapper margin='0 0 0 15px'>
                                                    {getTranslation('Send Only Principal Exam')}
                                                </Wrapper>
                                            </ToggleWrapper>
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={6}>
                                        <LabelWrapper label=' '>
                                            <ToggleWrapper>
                                                <Switch
                                                    checked={formik.values.schedule.enableSendRetry}
                                                    onChange={() => {
                                                        formik.setFieldValue(
                                                            'schedule.enableSendRetry',
                                                            !formik.values.schedule.enableSendRetry
                                                        );
                                                    }}
                                                />
                                                <Wrapper margin='0 0 0 15px'>
                                                    {getTranslation('Enable confirmation resend')}
                                                </Wrapper>
                                            </ToggleWrapper>
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={6}>
                                        <LabelWrapper label=' '>
                                            <ToggleWrapper>
                                                <Switch
                                                    checked={formik.values.schedule.omitAppointmentTypeName}
                                                    onChange={() => {
                                                        formik.setFieldValue(
                                                            'schedule.omitAppointmentTypeName',
                                                            !formik.values.schedule.omitAppointmentTypeName
                                                        );
                                                    }}
                                                />
                                                <Wrapper margin='0 0 0 15px'>
                                                    {getTranslation('Omit appointment type in description')}
                                                </Wrapper>
                                            </ToggleWrapper>
                                        </LabelWrapper>
                                    </Col>
                                </Row>
                                <Row style={{ alignItems: 'center' }} gutter={[16, 16]}>
                                    <Col span={6}>
                                        <LabelWrapper label=' '>
                                            <ToggleWrapper>
                                                <Switch
                                                    checked={formik.values.schedule.omitExtractGuidance}
                                                    onChange={() => {
                                                        formik.setFieldValue(
                                                            'schedule.omitExtractGuidance',
                                                            !formik.values.schedule.omitExtractGuidance
                                                        );
                                                    }}
                                                />
                                                <Wrapper margin='0 0 0 15px'>
                                                    {getTranslation('Omit extraction orientation')}
                                                </Wrapper>
                                            </ToggleWrapper>
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={6}>
                                        <LabelWrapper label=' '>
                                            <ToggleWrapper>
                                                <Switch
                                                    checked={formik.values.schedule.fridayJoinWeekendMonday}
                                                    onChange={() => {
                                                        formik.setFieldValue(
                                                            'schedule.fridayJoinWeekendMonday',
                                                            !formik.values.schedule.fridayJoinWeekendMonday
                                                        );
                                                    }}
                                                />
                                                <Wrapper margin='0 0 0 15px'>
                                                    {getTranslation('Send on Friday, weekend and Monday')}
                                                </Wrapper>
                                            </ToggleWrapper>
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={6}>
                                        <LabelWrapper label=' '>
                                            <ToggleWrapper>
                                                <Switch
                                                    checked={formik.values.schedule.omitTimeOnGroupDescription}
                                                    onChange={() => {
                                                        formik.setFieldValue(
                                                            'schedule.omitTimeOnGroupDescription',
                                                            !formik.values.schedule.omitTimeOnGroupDescription
                                                        );
                                                    }}
                                                />
                                                <Wrapper margin='0 0 0 15px'>
                                                    {getTranslation('Omit time in group description')}
                                                </Wrapper>
                                            </ToggleWrapper>
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={6}>
                                        <LabelWrapper label=' '>
                                            <ToggleWrapper>
                                                <Switch
                                                    checked={formik.values.schedule.useSendFullDay}
                                                    onChange={() => {
                                                        formik.setFieldValue(
                                                            'schedule.useSendFullDay',
                                                            !formik.values.schedule.useSendFullDay
                                                        );
                                                    }}
                                                />
                                                <Wrapper margin='0 0 0 15px'>
                                                    {getTranslation('Fazer envio durante todo o período do dia (24h)')}
                                                </Wrapper>
                                            </ToggleWrapper>
                                        </LabelWrapper>
                                    </Col>
                                </Row>
                                <Row style={{ alignItems: 'center' }} gutter={[16, 16]}>
                                    <Col span={6}>
                                        <LabelWrapper label=' '>
                                            <ToggleWrapper>
                                                <Switch
                                                    checked={formik.values.schedule.useIsFirstComeFirstServedAsTime}
                                                    onChange={() => {
                                                        formik.setFieldValue(
                                                            'schedule.useIsFirstComeFirstServedAsTime',
                                                            !formik.values.schedule.useIsFirstComeFirstServedAsTime
                                                        );
                                                    }}
                                                />
                                                <Wrapper margin='0 0 0 15px'>
                                                    {getTranslation(
                                                        'Activating this option will make the system handle times in order of arrival.'
                                                    )}
                                                </Wrapper>
                                            </ToggleWrapper>
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={6}>
                                        <LabelWrapper label=' '>
                                            <ToggleWrapper>
                                                <Switch
                                                    checked={
                                                        formik.values.schedule?.useOrganizationUnitOnGroupDescription
                                                    }
                                                    onChange={() => {
                                                        formik.setFieldValue(
                                                            'schedule.useOrganizationUnitOnGroupDescription',
                                                            !formik.values.schedule
                                                                ?.useOrganizationUnitOnGroupDescription
                                                        );
                                                    }}
                                                />
                                                <Wrapper margin='0 0 0 15px'>
                                                    {getTranslation('Use organization name in group description')}
                                                </Wrapper>
                                            </ToggleWrapper>
                                        </LabelWrapper>
                                    </Col>
                                </Row>
                                {formik.values.schedule.apiKey && (
                                    <Row>
                                        <Wrapper
                                            margin='10px 0 5px 0'
                                            width='100%'
                                            flexBox
                                        >{`ApiKey: ${formik.values.schedule.apiKey}`}</Wrapper>
                                    </Row>
                                )}
                            </Card>
                            <Card
                                margin='0 0 15px 0'
                                header={
                                    <SendSettingActions
                                        type={ExtractResumeType.confirmation}
                                        formik={formik}
                                        selectedWorkspace={selectedWorkspace}
                                        title='Confirmation Settings'
                                    />
                                }
                            >
                                <Row gutter={[16, 16]}>
                                    <Col span={8}>
                                        <LabelWrapper label={getTranslation('Active message')}>
                                            <Select
                                                value={formik.values.confirmation?.apiToken}
                                                style={{ width: '100%' }}
                                                options={optionsActiveMessage(ExtractResumeType.confirmation)}
                                                onChange={(value) => {
                                                    formik.setFieldValue('confirmation.apiToken', value);
                                                }}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={8}>
                                        <LabelWrapper label='Template'>
                                            <Select
                                                value={formik.values.confirmation?.templateId}
                                                style={{ width: '100%' }}
                                                options={optionsTemplate()}
                                                onChange={(value) => {
                                                    formik.setFieldValue('confirmation.templateId', value);
                                                }}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={8}>
                                        <LabelWrapper label=' '>
                                            <ToggleWrapper>
                                                <Switch
                                                    checked={formik.values.confirmation.active}
                                                    onChange={() => {
                                                        formik.setFieldValue(
                                                            'confirmation.active',
                                                            !formik.values.confirmation.active
                                                        );
                                                    }}
                                                />
                                                <Wrapper margin='0 0 0 15px'>{getTranslation('Active')}</Wrapper>
                                            </ToggleWrapper>
                                        </LabelWrapper>
                                    </Col>
                                </Row>
                                <Row gutter={[16, 16]}>
                                    <Col span={8}>
                                        <LabelWrapper
                                            label={getTranslation('Shipping time before appointment date (Hours)')}
                                        >
                                            <Input
                                                type='number'
                                                value={formik.values.confirmation.sendWhatsBeforeScheduleDate}
                                                onChange={(event) => {
                                                    formik.setFieldValue(
                                                        'confirmation.sendWhatsBeforeScheduleDate',
                                                        event.target.value
                                                    );
                                                }}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={8}>
                                        <LabelWrapper
                                            validate={{
                                                errors: formik.errors,
                                                fieldName: 'confirmation.groupRule',
                                                isSubmitted: formik.submitCount > 0,
                                                touched: true,
                                            }}
                                            label={getTranslation('Group rule')}
                                        >
                                            <Select
                                                value={formik.values.confirmation.groupRule}
                                                style={{ width: '100%' }}
                                                options={optionsGroupRule()}
                                                onChange={(value) => {
                                                    formik.setFieldValue('confirmation.groupRule', value);
                                                }}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={6}>
                                        <LabelWrapper label=' '>
                                            <ToggleWrapper>
                                                <Switch
                                                    checked={formik.values.confirmation.retryInvalid}
                                                    onChange={() => {
                                                        formik.setFieldValue(
                                                            'confirmation.retryInvalid',
                                                            !formik.values.confirmation.retryInvalid
                                                        );
                                                    }}
                                                />
                                                <Wrapper margin='0 0 0 15px'>
                                                    {getTranslation('Invalid repeat')}
                                                </Wrapper>
                                            </ToggleWrapper>
                                        </LabelWrapper>
                                    </Col>
                                </Row>
                                <Row gutter={[16, 16]}>
                                    <Col span={8}>
                                        <LabelWrapper
                                            validate={{
                                                errors: formik.errors,
                                                fieldName: 'confirmation.sendRecipientType',
                                                isSubmitted: formik.submitCount > 0,
                                                touched: true,
                                            }}
                                            label={getTranslation('Tipo de envio')}
                                        >
                                            <Select
                                                value={String(formik.values.confirmation.sendRecipientType!)}
                                                style={{ width: '100%' }}
                                                options={optionsSendRecipientType()}
                                                onChange={(value) => {
                                                    formik.setFieldValue('confirmation.sendRecipientType', value);
                                                }}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={8}>
                                        <LabelWrapper
                                            validate={{
                                                errors: formik.errors,
                                                fieldName: 'confirmation.sendingGroupType',
                                                isSubmitted: formik.submitCount > 0,
                                                touched: true,
                                            }}
                                            label={getTranslation('Tipo do grupo de envio')}
                                        >
                                            <Input
                                                value={formik.values.confirmation.sendingGroupType}
                                                onChange={(event) => {
                                                    formik.setFieldValue(
                                                        'confirmation.sendingGroupType',
                                                        sanitizeText(event.target.value)
                                                    );
                                                }}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                    {formik.values.confirmation.sendRecipientType === RecipientType.email && (
                                        <Col span={8}>
                                            <LabelWrapper
                                                validate={{
                                                    errors: formik.errors,
                                                    fieldName: 'confirmation.emailSendingSettingId',
                                                    isSubmitted: formik.submitCount > 0,
                                                    touched: true,
                                                }}
                                                label={getTranslation('Configuração de envio de E-mail')}
                                            >
                                                <Select
                                                    value={Number(formik.values.confirmation.emailSendingSettingId)}
                                                    style={{ width: '100%' }}
                                                    options={emailSendingSettings?.map((emailStg) => ({
                                                        label: emailStg.settingName,
                                                        value: emailStg.id,
                                                    }))}
                                                    onChange={(value) => {
                                                        formik.setFieldValue(
                                                            'confirmation.emailSendingSettingId',
                                                            value
                                                        );
                                                    }}
                                                />
                                            </LabelWrapper>
                                        </Col>
                                    )}
                                    <Col span={8}>
                                        <LabelWrapper label=' '>
                                            <ToggleWrapper>
                                                <Switch
                                                    checked={formik.values.confirmation?.resendMsgNoMatch}
                                                    onChange={() => {
                                                        formik.setFieldValue(
                                                            `confirmation.resendMsgNoMatch`,
                                                            !formik.values.confirmation?.resendMsgNoMatch
                                                        );
                                                    }}
                                                />
                                                <Wrapper margin='0 0 0 15px'>
                                                    {getTranslation(
                                                        'Reenviar mensagem quando não houver correspondência'
                                                    )}
                                                </Wrapper>
                                            </ToggleWrapper>
                                        </LabelWrapper>
                                    </Col>
                                </Row>
                                <Row gutter={[16, 16]}>
                                    <Col style={{ width: '100%' }}>
                                        <LabelWrapper label={getTranslation('Parameters for ERP')}>
                                            <TextArea
                                                rows={5}
                                                value={formik.values.confirmation?.erpParams}
                                                onChange={(event) => {
                                                    formik.setFieldValue('confirmation.erpParams', event.target.value);
                                                }}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                </Row>
                            </Card>
                            <Card
                                margin='0 0 15px 0'
                                header={
                                    <SendSettingActions
                                        type={ExtractResumeType.reminder}
                                        formik={formik}
                                        selectedWorkspace={selectedWorkspace}
                                        title='Reminder Settings'
                                    />
                                }
                            >
                                <Row gutter={[16, 16]}>
                                    <Col span={8}>
                                        <LabelWrapper label={getTranslation('Active message')}>
                                            <Select
                                                value={formik.values.reminder?.apiToken}
                                                style={{ width: '100%' }}
                                                options={optionsActiveMessage(ExtractResumeType.reminder)}
                                                onChange={(value) => {
                                                    formik.setFieldValue('reminder.apiToken', value);
                                                }}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={8}>
                                        <LabelWrapper label='Template'>
                                            <Select
                                                value={formik.values.reminder?.templateId}
                                                style={{ width: '100%' }}
                                                options={optionsTemplate()}
                                                onChange={(value) => {
                                                    formik.setFieldValue('reminder.templateId', value);
                                                }}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={8}>
                                        <LabelWrapper label=' '>
                                            <ToggleWrapper>
                                                <Switch
                                                    checked={formik.values.reminder?.active}
                                                    onChange={() => {
                                                        formik.setFieldValue(
                                                            'reminder.active',
                                                            !formik.values.reminder?.active
                                                        );
                                                    }}
                                                />
                                                <Wrapper margin='0 0 0 15px'>{getTranslation('Active')}</Wrapper>
                                            </ToggleWrapper>
                                        </LabelWrapper>
                                    </Col>
                                </Row>
                                <Row gutter={[16, 16]}>
                                    <Col span={8}>
                                        <LabelWrapper
                                            label={getTranslation('Shipping time before appointment date (Hours)')}
                                        >
                                            <Input
                                                type='number'
                                                value={formik.values.reminder?.sendBeforeScheduleDate}
                                                onChange={(event) => {
                                                    formik.setFieldValue(
                                                        'reminder.sendBeforeScheduleDate',
                                                        event.target.value
                                                    );
                                                }}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={8}>
                                        <LabelWrapper
                                            validate={{
                                                errors: formik.errors,
                                                fieldName: 'reminder.groupRule',
                                                isSubmitted: formik.submitCount > 0,
                                                touched: true,
                                            }}
                                            label={getTranslation('Group rule')}
                                        >
                                            <Select
                                                value={String(formik.values.reminder.groupRule!)}
                                                style={{ width: '100%' }}
                                                options={optionsGroupRule()}
                                                onChange={(value) => {
                                                    formik.setFieldValue('reminder.groupRule', value);
                                                }}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={6}>
                                        <LabelWrapper label=' '>
                                            <ToggleWrapper>
                                                <Switch
                                                    checked={formik.values.reminder?.retryInvalid}
                                                    onChange={() => {
                                                        formik.setFieldValue(
                                                            'reminder.retryInvalid',
                                                            !formik.values.reminder?.retryInvalid
                                                        );
                                                    }}
                                                />
                                                <Wrapper margin='0 0 0 15px'>
                                                    {getTranslation('Invalid repeat')}
                                                </Wrapper>
                                            </ToggleWrapper>
                                        </LabelWrapper>
                                    </Col>
                                </Row>
                                <Row gutter={[16, 16]}>
                                    <Col span={8}>
                                        <LabelWrapper
                                            validate={{
                                                errors: formik.errors,
                                                fieldName: 'reminder.sendRecipientType',
                                                isSubmitted: formik.submitCount > 0,
                                                touched: true,
                                            }}
                                            label={getTranslation('Tipo de envio')}
                                        >
                                            <Select
                                                value={String(formik.values.reminder.sendRecipientType!)}
                                                style={{ width: '100%' }}
                                                options={optionsSendRecipientType()}
                                                onChange={(value) => {
                                                    formik.setFieldValue('reminder.sendRecipientType', value);
                                                }}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={8}>
                                        <LabelWrapper
                                            validate={{
                                                errors: formik.errors,
                                                fieldName: 'reminder.sendingGroupType',
                                                isSubmitted: formik.submitCount > 0,
                                                touched: true,
                                            }}
                                            label={getTranslation('Tipo do grupo de envio')}
                                        >
                                            <Input
                                                value={formik.values.reminder.sendingGroupType}
                                                onChange={(event) => {
                                                    formik.setFieldValue(
                                                        'reminder.sendingGroupType',
                                                        sanitizeText(event.target.value)
                                                    );
                                                }}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                    {formik.values.reminder.sendRecipientType === RecipientType.email && (
                                        <Col span={8}>
                                            <LabelWrapper
                                                validate={{
                                                    errors: formik.errors,
                                                    fieldName: 'reminder.emailSendingSettingId',
                                                    isSubmitted: formik.submitCount > 0,
                                                    touched: true,
                                                }}
                                                label={getTranslation('Configuração de envio de E-mail')}
                                            >
                                                <Select
                                                    value={Number(formik.values.reminder.emailSendingSettingId)}
                                                    style={{ width: '100%' }}
                                                    options={emailSendingSettings?.map((emailStg) => ({
                                                        label: emailStg.settingName,
                                                        value: emailStg.id,
                                                    }))}
                                                    onChange={(value) => {
                                                        formik.setFieldValue('reminder.emailSendingSettingId', value);
                                                    }}
                                                />
                                            </LabelWrapper>
                                        </Col>
                                    )}
                                    <Col span={8}>
                                        <LabelWrapper label=' '>
                                            <ToggleWrapper>
                                                <Switch
                                                    checked={formik.values.reminder?.sendAction}
                                                    onChange={() => {
                                                        formik.setFieldValue(
                                                            'reminder.sendAction',
                                                            !formik.values.reminder?.sendAction
                                                        );
                                                    }}
                                                />
                                                <Wrapper margin='0 0 0 15px'>
                                                    {getTranslation('Enviar com fluxo personalizado')}
                                                </Wrapper>
                                            </ToggleWrapper>
                                        </LabelWrapper>
                                    </Col>
                                </Row>
                                <Row gutter={[16, 16]}>
                                    <Col style={{ width: '100%' }}>
                                        <LabelWrapper label={getTranslation('Parameters for ERP')}>
                                            <TextArea
                                                rows={5}
                                                value={formik.values.reminder?.erpParams}
                                                onChange={(event) => {
                                                    formik.setFieldValue('reminder.erpParams', event.target.value);
                                                }}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                </Row>
                            </Card>
                            <Divider children={<b>Lista de configurações de envio</b>} orientation='left' />
                            {formik.values.sendSettings?.map((sendSetting, index) => {
                                return (
                                    <SendSettingForm
                                        selectedWorkspace={selectedWorkspace}
                                        formik={formik}
                                        index={index}
                                        optionsActiveMessage={optionsActiveMessage(sendSetting.type)}
                                        optionsGroupRule={optionsGroupRule()}
                                        optionsTemplate={optionsTemplate()}
                                        optionsTypeSendSetting={optionsTypeSendSetting()}
                                        optionsSendRecipientType={optionsSendRecipientType()}
                                        emailSendingSettings={emailSendingSettings}
                                    />
                                );
                            })}
                            <Row style={{ justifyContent: 'center' }}>
                                <Button
                                    style={{ display: 'flex', alignItems: 'center' }}
                                    icon={<MdAdd />}
                                    type='default'
                                    className='antd-span-default-color'
                                    children={getTranslation('Adicionar nova configuração de envio')}
                                    onClick={() => {
                                        const newSendSettings = formik.values.sendSettings || [];
                                        newSendSettings?.push({
                                            active: true,
                                            apiToken: '',
                                            templateId: '',
                                            type: ExtractResumeType.confirmation,
                                            scheduleSettingId: formik.values.schedule.id,
                                            groupRule: ScheduleGroupRule.allOfRange,
                                            sendRecipientType: RecipientType.whatsapp,
                                            sendingGroupType: 'principal',
                                        });
                                        formik.setFieldValue('sendSettings', newSendSettings);
                                    }}
                                />
                            </Row>
                        </>
                    }
                />
            </ScrollView>
        </>
    );
};

export default i18n(ConfirmationSettingForm) as FC<ConfirmationSettingFormProps>;
