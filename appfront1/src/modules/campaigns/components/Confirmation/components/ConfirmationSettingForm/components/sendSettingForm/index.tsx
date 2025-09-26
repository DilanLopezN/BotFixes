import { FC } from 'react';
import { I18nProps } from '../../../../../../../i18n/interface/i18n.interface';
import i18n from '../../../../../../../i18n/components/i18n';
import { Button, Col, Input, Modal, Row, Select, Switch } from 'antd';
import { Card, Wrapper } from '../../../../../../../../ui-kissbot-v2/common';
import { LabelWrapper } from '../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { ToggleWrapper } from '../../style';
import TextArea from 'antd/lib/input/TextArea';
import { FormikProps } from 'formik-latest';
import { ConfirmationSettingFormDto, RecipientType } from '../../../../../../interfaces/confirmation-setting';
import { Workspace } from '../../../../../../../../model/Workspace';
import { ConfirmationSettingService } from '../../../../../../service/ConfirmationService';
import { EmailSendingSetting } from '../../../../../../service/EmailSendingSettingService/interface';
import { SendSettingActions } from '../send-setting-actions';
import { ExtractResumeType } from '../../../../../../interfaces/send-setting';

export interface SendSettingFormProps {
    selectedWorkspace: Workspace;
    optionsActiveMessage: { value: any; label: string }[];
    optionsTemplate: { value: any; label: string }[];
    optionsTypeSendSetting: { value: any; label: string }[];
    optionsGroupRule: { value: any; label: string }[];
    optionsSendRecipientType: { value: any; label: string }[];
    emailSendingSettings: EmailSendingSetting[];
    formik: FormikProps<ConfirmationSettingFormDto>;
    index: number;
}

const SendSettingForm: FC<SendSettingFormProps & I18nProps> = (props) => {
    const {
        getTranslation,
        selectedWorkspace,
        optionsActiveMessage,
        optionsTemplate,
        optionsTypeSendSetting,
        optionsGroupRule,
        optionsSendRecipientType,
        emailSendingSettings,
        formik,
        index,
    } = props;

    const deleteSendSetting = async (id: number) => {
        await ConfirmationSettingService.deleteSendSettingByIdAndWorkspaceId(selectedWorkspace._id, id).then(() => {
            let newSendSettings = formik.values.sendSettings;
            newSendSettings?.splice(index, 1);
            formik.setFieldValue('sendSettings', newSendSettings);
        });
    };

    const sanitizeText = (text: string) => {
        if (!text) return '';

        let newText = text.replaceAll(' ', '_');
        newText = newText.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        newText = newText.replace(/[[\]{}.,?!/=+*\\|:;@#$%&()'"`~´^]/g, '_');
        newText = newText.toLocaleLowerCase();

        return newText;
    };

    return (
        <Card
            margin='0 0 15px 0'
            header={
                <SendSettingActions
                    type={formik.values.sendSettings?.[index].type as ExtractResumeType}
                    formik={formik}
                    selectedWorkspace={selectedWorkspace}
                    title='Configuração de envio'
                    children={
                        <Button
                            onClick={() => {
                                if (formik.values.sendSettings?.[index]?.id) {
                                    Modal.confirm({
                                        title: getTranslation('Excluir configuração'),
                                        content: getTranslation(
                                            'Excluir configuração de envio? Esta ação não pode ser desfeita!'
                                        ),
                                        okText: getTranslation('Ok'),
                                        onOk: () => deleteSendSetting(formik.values.sendSettings?.[index]?.id!),
                                        okButtonProps: { className: 'antd-span-default-color' },
                                        cancelText: getTranslation('Cancel'),
                                        onCancel: () => {},
                                        cancelButtonProps: { className: 'antd-span-default-color' },
                                    });
                                    return;
                                }
                                let newSendSettings = formik.values.sendSettings;
                                newSendSettings?.splice(index, 1);
                                formik.setFieldValue('sendSettings', newSendSettings);
                            }}
                            className='antd-span-default-color'
                            size='small'
                            type='default'
                        >
                            {getTranslation('Excluir configuração')}
                        </Button>
                    }
                />
            }
        >
            <Row gutter={[16, 16]}>
                <Col span={6}>
                    <LabelWrapper label={getTranslation('Active message')}>
                        <Select
                            value={formik.values.sendSettings?.[index]?.apiToken}
                            style={{ width: '100%' }}
                            options={optionsActiveMessage}
                            onChange={(value) => {
                                formik.setFieldValue(`sendSettings[${index}].apiToken`, value);
                            }}
                        />
                    </LabelWrapper>
                </Col>
                <Col span={6}>
                    <LabelWrapper label='Template'>
                        <Select
                            value={formik.values.sendSettings?.[index]?.templateId}
                            style={{ width: '100%' }}
                            options={optionsTemplate}
                            onChange={(value) => {
                                formik.setFieldValue(`sendSettings[${index}].templateId`, value);
                            }}
                        />
                    </LabelWrapper>
                </Col>
                <Col span={6}>
                    <LabelWrapper label='Tipo de envio'>
                        <Select
                            value={formik.values.sendSettings?.[index]?.type}
                            style={{ width: '100%' }}
                            options={optionsTypeSendSetting}
                            onChange={(value) => {
                                formik.setFieldValue(`sendSettings[${index}].type`, value);
                            }}
                        />
                    </LabelWrapper>
                </Col>
                <Col span={4}>
                    <LabelWrapper label=' '>
                        <ToggleWrapper>
                            <Switch
                                checked={formik.values.sendSettings?.[index]?.active}
                                onChange={() => {
                                    formik.setFieldValue(
                                        `sendSettings[${index}].active`,
                                        !formik.values.sendSettings?.[index]?.active
                                    );
                                }}
                            />
                            <Wrapper margin='0 0 0 15px'>{getTranslation('Active')}</Wrapper>
                        </ToggleWrapper>
                    </LabelWrapper>
                </Col>
            </Row>
            <Row gutter={[16, 16]}>
                <Col span={6}>
                    <LabelWrapper label={getTranslation('Shipping time before appointment date (Hours)')}>
                        <Input
                            type='number'
                            value={formik.values.sendSettings?.[index]?.hoursBeforeScheduleDate}
                            onChange={(event) => {
                                formik.setFieldValue(
                                    `sendSettings[${index}].hoursBeforeScheduleDate`,
                                    event.target.value
                                );
                            }}
                        />
                    </LabelWrapper>
                </Col>
                <Col span={6}>
                    <LabelWrapper
                        validate={{
                            errors: formik.errors,
                            fieldName: `sendSettings[${index}].groupRule`,
                            isSubmitted: formik.submitCount > 0,
                            touched: true,
                        }}
                        label={getTranslation('Group rule')}
                    >
                        <Select
                            value={String(formik.values.sendSettings?.[index]?.groupRule!)}
                            style={{ width: '100%' }}
                            options={optionsGroupRule}
                            onChange={(value) => {
                                formik.setFieldValue(`sendSettings[${index}].groupRule`, value);
                            }}
                        />
                    </LabelWrapper>
                </Col>
                <Col span={6}>
                    <LabelWrapper label=' '>
                        <ToggleWrapper>
                            <Switch
                                checked={formik.values.sendSettings?.[index]?.retryInvalid}
                                onChange={() => {
                                    formik.setFieldValue(
                                        `sendSettings[${index}].retryInvalid`,
                                        !formik.values.sendSettings?.[index]?.retryInvalid
                                    );
                                }}
                            />
                            <Wrapper margin='0 0 0 15px'>{getTranslation('Invalid repeat')}</Wrapper>
                        </ToggleWrapper>
                    </LabelWrapper>
                </Col>
                <Col span={6}>
                    <LabelWrapper label=' '>
                        <ToggleWrapper>
                            <Switch
                                checked={formik.values.sendSettings?.[index]?.sendAction}
                                onChange={() => {
                                    formik.setFieldValue(
                                        `sendSettings[${index}].sendAction`,
                                        !formik.values.sendSettings?.[index]?.sendAction
                                    );
                                }}
                            />
                            <Wrapper margin='0 0 0 15px'>{getTranslation('Enviar com fluxo personalizado')}</Wrapper>
                        </ToggleWrapper>
                    </LabelWrapper>
                </Col>
            </Row>
            <Row gutter={[16, 16]}>
                <Col span={6}>
                    <LabelWrapper
                        validate={{
                            errors: formik.errors,
                            fieldName: `sendSettings[${index}].sendRecipientType`,
                            isSubmitted: formik.submitCount > 0,
                            touched: true,
                        }}
                        label={getTranslation('Tipo de envio')}
                    >
                        <Select
                            value={String(formik.values.sendSettings?.[index]?.sendRecipientType)}
                            style={{ width: '100%' }}
                            options={optionsSendRecipientType}
                            onChange={(value) => {
                                formik.setFieldValue(`sendSettings[${index}].sendRecipientType`, value);
                            }}
                        />
                    </LabelWrapper>
                </Col>
                <Col span={8}>
                    <LabelWrapper
                        validate={{
                            errors: formik.errors,
                            fieldName: `sendSettings[${index}].sendingGroupType`,
                            isSubmitted: formik.submitCount > 0,
                            touched: true,
                        }}
                        label={getTranslation('Tipo do grupo de envio')}
                    >
                        <Input
                            value={formik.values.sendSettings?.[index]?.sendingGroupType}
                            onChange={(event) => {
                                formik.setFieldValue(
                                    `sendSettings[${index}].sendingGroupType`,
                                    sanitizeText(event.target.value)
                                );
                            }}
                        />
                    </LabelWrapper>
                </Col>
                {formik.values.sendSettings?.[index]?.sendRecipientType === RecipientType.email && (
                    <Col span={8}>
                        <LabelWrapper
                            validate={{
                                errors: formik.errors,
                                fieldName: `sendSettings[${index}].emailSendingSettingId`,
                                isSubmitted: formik.submitCount > 0,
                                touched: true,
                            }}
                            label={getTranslation('Configuração de envio de E-mail')}
                        >
                            <Select
                                value={Number(formik.values.sendSettings?.[index]?.emailSendingSettingId)}
                                style={{ width: '100%' }}
                                options={emailSendingSettings?.map((emailStg) => ({
                                    label: emailStg.settingName,
                                    value: emailStg.id,
                                }))}
                                onChange={(value) => {
                                    formik.setFieldValue(`sendSettings[${index}].emailSendingSettingId`, value);
                                }}
                            />
                        </LabelWrapper>
                    </Col>
                )}
                <Col span={8}>
                    <LabelWrapper label=' '>
                        <ToggleWrapper>
                            <Switch
                                checked={formik.values.sendSettings?.[index]?.resendMsgNoMatch}
                                onChange={() => {
                                    formik.setFieldValue(
                                        `sendSettings[${index}].resendMsgNoMatch`,
                                        !formik.values.sendSettings?.[index]?.resendMsgNoMatch
                                    );
                                }}
                            />
                            <Wrapper margin='0 0 0 15px'>
                                {getTranslation('Reenviar mensagem quando não houver correspondência')}
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
                            value={formik.values.sendSettings?.[index]?.erpParams}
                            onChange={(event) => {
                                formik.setFieldValue(`sendSettings[${index}].erpParams`, event.target.value);
                            }}
                        />
                    </LabelWrapper>
                </Col>
            </Row>
        </Card>
    );
};

export default i18n(SendSettingForm) as FC<SendSettingFormProps>;
