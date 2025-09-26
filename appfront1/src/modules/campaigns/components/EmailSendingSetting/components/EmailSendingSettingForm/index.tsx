import { FC, useEffect, useState } from 'react';
import { EmailSendingSettingFormProps } from './props';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import i18n from '../../../../../i18n/components/i18n';
import Header from '../../../../../../shared-v2/Header/Header';
import { Alert, Col, Input, Modal, Row, Select, Switch } from 'antd';
import { Card, Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { ScrollView } from '../../../../../settings/components/ScrollView';
import { LabelWrapper } from '../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { ToggleWrapper } from './style';
import { useFormik } from 'formik-latest';
import { addNotification } from '../../../../../../utils/AddNotification';
import CardWrapperForm from '../../../../../../shared-v2/CardWrapperForm/CardWrapperForm';
import { useHistory, useParams } from 'react-router-dom';
import * as Yup from 'yup';
import { EmailSendingSettingService } from '../../../../service/EmailSendingSettingService/EmailSendingSettingService';
import { EmailSendingSetting, EmailType } from '../../../../service/EmailSendingSettingService/interface';
import TemplateEmailVariables from './components/TemplateVariables';

const { confirm } = Modal;

export const defaultEmailSendingSetting: EmailSendingSetting = {
    enabled: true,
    createdAt: '',
    settingName: '',
    templateId: '',
    versionId: '',
    emailType: EmailType.simple,
    workspaceId: '',
};
const EmailSendingSettingForm: FC<EmailSendingSettingFormProps & I18nProps> = (props) => {
    const { getTranslation, selectedWorkspace } = props;
    const history = useHistory();
    const params: any = useParams();

    const [currentEmailSendingSettingForm, setCurrentEmailSendingSettingForm] =
        useState<EmailSendingSetting>(defaultEmailSendingSetting);
    const [templates, setTemplates] = useState<any[]>([]);
    const [currentTemplate, setCurrentTemplate] = useState<any>(undefined);
    const [loading, setLoading] = useState(false);
    const [loadingCurrTemplate, setLoadingCurrTemplate] = useState(true);

    const getValidationSchema = (): Yup.ObjectSchema => {
        return Yup.object().shape({
            settingName: Yup.string().required(getTranslation('This field is required')),
            templateId: Yup.string().required(getTranslation('This field is required')),
            versionId: Yup.string().required(getTranslation('This field is required')),
            emailType: Yup.string().required(getTranslation('This field is required')),
        });
    };

    const formik = useFormik({
        initialValues: currentEmailSendingSettingForm,
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

    const save = (values: EmailSendingSetting) => {
        if (values.id) {
            updateEmailSendingSettings(values);
            return;
        }

        createEmailSendingSetting(values);
    };

    const createEmailSendingSetting = async (values: EmailSendingSetting) => {
        let error;

        const response = await EmailSendingSettingService.createEmailSendingSetting(
            selectedWorkspace._id,
            {
                enabled: values.enabled,
                settingName: values.settingName,
                templateId: values.templateId,
                versionId: values.versionId,
                emailType: values.emailType,
                templateVariables: values.templateVariables,
            },
            (err) => {
                error = err;
            }
        );

        if (!error && response) {
            formik.setValues({
                ...formik.values,
                id: response?.id,
            });
            return addNotification({
                type: 'success',
                title: getTranslation('Success'),
                message: getTranslation('Configurações de envio de E-mail salva com sucesso'),
            });
        }

        return addNotification({
            type: 'warning',
            title: getTranslation('Error'),
            message: getTranslation('Erro ao salvar configurações de envio de E-mail'),
        });
    };

    const updateEmailSendingSettings = async (values: EmailSendingSetting) => {
        let error;

        const response = await EmailSendingSettingService.updateEmailSendingSetting(
            selectedWorkspace._id,
            values.id!,
            {
                enabled: values.enabled,
                settingName: values.settingName,
                templateId: values.templateId,
                versionId: values.versionId,
                emailType: values.emailType,
                templateVariables: values.templateVariables,
            },
            (err) => {
                error = err;
            }
        );

        if (!error && response) {
            return addNotification({
                type: 'success',
                title: getTranslation('Success'),
                message: getTranslation('Configurações de envio de E-mail salva com sucesso'),
            });
        }

        return addNotification({
            type: 'warning',
            title: getTranslation('Error'),
            message: getTranslation('Erro ao salvar configurações de envio de E-mail'),
        });
    };

    const showDeleteConfirm = () => {
        confirm({
          title: getTranslation('Tem certeza de que deseja excluir esta configuração?'),
          okText: getTranslation('Yes'),
          okType: 'danger',
          cancelText: getTranslation('No'),
          cancelButtonProps: {
            className: 'antd-span-default-color',
          },
          okButtonProps: {
            className: 'antd-span-default-color',
          },
          onOk() {
            deleteEmailSendingSetting();
          },
          onCancel() {},
        });
      };

    const deleteEmailSendingSetting = async () => {
        const response = await EmailSendingSettingService.deleteEmailSendingSetting(
            selectedWorkspace._id,
            formik.values.id!
        );

        if (!!response?.ok) {
            onCancel()
            return addNotification({
                type: 'success',
                title: getTranslation('Success'),
                message: getTranslation('Configurações de envio de E-mail excluida com sucesso'),
            });
        }

        addNotification({
            type: 'warning',
            title: getTranslation('Error'),
            message: getTranslation('Erro ao excluir configurações de envio de E-mail'),
        });
    };

    const getEmailSendingSetting = async (emailSendingSettingId: number) => {
        if (!selectedWorkspace._id) {
            return;
        }
        setLoading(true);

        const response = await EmailSendingSettingService.getEmailSendingSettingById(
            selectedWorkspace._id,
            emailSendingSettingId
        );

        if (response) {
            formik.setFieldValue('templateId', response.templateId);
            await getCurrentTemplate();
            setCurrentEmailSendingSettingForm(response);
        }
        setLoading(false);
    };

    const getTemplateList = async () => {
        if (!selectedWorkspace._id) {
            return;
        }

        const response = await EmailSendingSettingService.getTemplatesSendGrid();

        setTemplates(response || []);
    };

    const getCurrentTemplate = async () => {
        if (!selectedWorkspace._id || !formik.values.templateId) {
            return;
        }
        setLoadingCurrTemplate(true);
        const response = await EmailSendingSettingService.getTemplateSendGridById(formik.values.templateId);

        setLoadingCurrTemplate(false);
        setCurrentTemplate(response);
    };

    useEffect(() => {
        getTemplateList();

        const emailSendingSettingId = params?.emailSendingSettingId;
        if (emailSendingSettingId) {
            getEmailSendingSetting(Number(emailSendingSettingId));
        } else {
            setLoadingCurrTemplate(false);
        }
    }, []);

    useEffect(() => {
        if (currentTemplate?.id !== formik.values.templateId) {
            getCurrentTemplate();
        }
    }, [formik.values.templateId]);

    const optionsTemplate = () => {
        if (!templates.length) {
            return [];
        }

        return templates.map((template) => ({
            label: template?.name,
            value: template.id,
        }));
    };

    const optionsEmailType = () => {
        return [
            {
                label: 'Simples',
                value: EmailType.simple,
            },
            {
                label: 'Convite',
                value: EmailType.invite,
            },
        ];
    };

    const optionsTemplateVersion = () => {
        if (!templates.length || !formik.values?.templateId) {
            return [];
        }

        interface OptioSelect {
            label: string;
            options: { label: string; value: any }[];
        }
        const activeVersion: OptioSelect = { label: getTranslation('Ativo'), options: [] };
        const inactiveVersions: OptioSelect = { label: getTranslation('Inativo'), options: [] };
        templates
            .find((currTemplate) => currTemplate.id === formik.values.templateId)
            ?.versions?.forEach((version) => {
                if (version.active > 0) {
                    activeVersion.options.push({
                        label: version?.name,
                        value: version.id,
                    });
                } else {
                    inactiveVersions.options.push({
                        label: version?.name,
                        value: version.id,
                    });
                }
            });

        const options: OptioSelect[] = [activeVersion];

        if (!!inactiveVersions.options.length) {
            options.push(inactiveVersions);
        }
        return options;
    };

    const getInfoAlert = () => {
        if (!loadingCurrTemplate && currentTemplate && formik.values.versionId) {
            const version = currentTemplate.versions?.find((version) => version.id === formik.values.versionId);

            if (version && version.active == 0) {
                return (
                    <Alert
                        style={{ marginBottom: '10px' }}
                        message={getTranslation(
                            'A versão do template selecionada para esta configuração de envio de E-mail está desativada!'
                        )}
                        type='warning'
                        showIcon
                    />
                );
            }
        }
    };

    const onCancel = () => {
        history.push(`/campaigns/email-sending-settings`);
    };

    return (
        <>
            <Header
                title={`${getTranslation(formik.values.id ? 'Edit' : 'Register')} ${getTranslation(
                    'configuração de envio de E-mail'
                ).toLowerCase()}`}
                buttonBack={{ visible: true, onClick: onCancel }}
                buttonSave={{
                    visible: true,
                    loading: loading,
                    onClick: () => {
                        formik.submitForm();
                    },
                }}
                buttonDelete={{
                    visible: !!formik.values?.id,
                    loading,
                    onClick: () => showDeleteConfirm()
                }}
            />
            <ScrollView id='content-email-sending-setting-form'>
                <CardWrapperForm
                    title={getTranslation('Configuração de envio de E-mail')}
                    childrenHeader
                    loading={loading}
                    children={
                        <>
                            <Card
                                margin='0 0 15px 0'
                                header={`${getTranslation('Configuração de envio')} ${
                                    formik.initialValues?.settingName
                                }`}
                            >
                                {getInfoAlert()}
                                <Row gutter={[16, 16]}>
                                    <Col span={16}>
                                        <LabelWrapper
                                            validate={{
                                                errors: formik.errors,
                                                fieldName: 'settingName',
                                                isSubmitted: formik.submitCount > 0,
                                                touched: true,
                                            }}
                                            label={getTranslation('Nome da configuração de envio')}
                                        >
                                            <Input
                                                value={formik.values.settingName}
                                                maxLength={100}
                                                onChange={(event) => {
                                                    formik.setFieldValue('settingName', event.target.value);
                                                }}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={4}>
                                        <LabelWrapper label=' '>
                                            <ToggleWrapper>
                                                <Switch
                                                    checked={formik.values.enabled}
                                                    onChange={() => {
                                                        formik.setFieldValue('enabled', !formik.values.enabled);
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
                                                fieldName: 'templateId',
                                                isSubmitted: formik.submitCount > 0,
                                                touched: true,
                                            }}
                                            label={getTranslation('Template SendGrid')}
                                        >
                                            <Select
                                                value={formik.values.templateId}
                                                style={{ width: '100%' }}
                                                options={optionsTemplate()}
                                                onChange={(value) => {
                                                    formik.setFieldValue('templateId', value);
                                                    const version = templates.find((temp) => temp.id === value)
                                                        ?.versions?.[0];
                                                    if (version?.id) {
                                                        formik.setFieldValue('versionId', version.id);
                                                    } else {
                                                        formik.setFieldValue('versionId', undefined);
                                                    }
                                                    formik.setFieldValue('templateVariables', undefined);
                                                }}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={8}>
                                        <LabelWrapper
                                            validate={{
                                                errors: formik.errors,
                                                fieldName: 'versionId',
                                                isSubmitted: formik.submitCount > 0,
                                                touched: true,
                                            }}
                                            label={getTranslation('Versão do template')}
                                        >
                                            <Select
                                                value={formik.values.versionId}
                                                style={{ width: '100%' }}
                                                options={optionsTemplateVersion()}
                                                onChange={(value) => {
                                                    formik.setFieldValue('versionId', value);
                                                    formik.setFieldValue('templateVariables', undefined);
                                                }}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={8}>
                                        <LabelWrapper
                                            validate={{
                                                errors: formik.errors,
                                                fieldName: 'emailType',
                                                isSubmitted: formik.submitCount > 0,
                                                touched: true,
                                            }}
                                            label={getTranslation('Tipo de envio do e-mail')}
                                        >
                                            <Select
                                                value={formik.values.emailType}
                                                style={{ width: '100%' }}
                                                options={optionsEmailType()}
                                                onChange={(value) => {
                                                    formik.setFieldValue('emailType', value);
                                                }}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                </Row>

                                <TemplateEmailVariables
                                    formik={formik}
                                    loading={loadingCurrTemplate}
                                    template={currentTemplate}
                                />
                            </Card>
                        </>
                    }
                />
            </ScrollView>
        </>
    );
};

export default i18n(EmailSendingSettingForm) as FC<EmailSendingSettingFormProps>;
