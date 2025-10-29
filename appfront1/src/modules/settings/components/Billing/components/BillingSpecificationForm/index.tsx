import { FC } from 'react';
import { BillingSpecificationFormProps } from './props';
import I18n from '../../../../../i18n/components/i18n';
import { LabelWrapper } from '../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { InputSimple } from '../../../../../../shared/InputSample/InputSimple';
import { DatePicker, Row, Col, Radio, Typography } from 'antd';
import moment from 'moment';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { CustomCreatableSelect } from '../../../../../../shared/StyledForms/CustomCreatableSelect/CustomCreatableSelect';
import orderBy from 'lodash/orderBy';
import Toggle from '../../../../../../shared/Toggle/Toggle';
import { TextAreaSimple } from '../../../../../../shared/TextAreaSimple/TextAreaSimple';
import { BillingType, WorkspaceChannels } from '../WorkspaceBillingSpecification/interface';
import styled from 'styled-components';
import { Card } from '../../../../../../ui-kissbot-v2/common';
import { ConvertChannelName } from '../WorkspaceBillingSpecification/utils/defaultVariables';
import { useSelector } from 'react-redux';
import { isSystemAdmin } from '../../../../../../utils/UserPermission';

const RadioButton = styled(Radio.Button)<{ selected: boolean }>`
    span {
        color: ${(props) => props.selected && '#fff'};
    }
`;

const BillingSpecificationForm: FC<BillingSpecificationFormProps & I18nProps> = (props) => {
    const { getTranslation, formik, accounts, setup, channelFormik } = props;
    const { loggedUser } = useSelector((state: any) => state.loginReducer);
    const notAdmin = !isSystemAdmin(loggedUser);

    const getChannel = (channelId) => {
        let index = channelFormik.values.findIndex((element) => element.channelId === channelId);
        let channel = channelFormik.values.find((element) => element.channelId === channelId);

        if (index < 0) {
            let newValue = channelFormik.values;
            const newChannel = {
                workspaceId: '',
                channelId: channelId,
                conversationLimit: 0,
                conversationExcededPrice: 0,
                messageLimit: 0,
                messageExcededPrice: 0,
            };
            newValue.push(newChannel);
            index = newValue.length - 1;
            channel = newChannel;
            channelFormik.setValues(newValue);
        }

        return (
            <Card
                key={`${channel.channelId}`}
                header={ConvertChannelName[channel.channelId] || channelId}
                margin='0 0 20px 0'
            >
                <Row gutter={16}>
                    <Col span={6}>
                        <LabelWrapper label={getTranslation(`Channel service limit`)}>
                            <InputSimple
                                disabled={notAdmin}
                                type={'number'}
                                min={0}
                                max={1000000}
                                value={channel.conversationLimit}
                                onChange={(event) => {
                                    const value = parseFloat(event.target.value) || 0;
                                    const newChannel = { ...channel, conversationLimit: value };
                                    let newValue = channelFormik.values;
                                    newValue.splice(index, 1, newChannel);
                                    channelFormik.setValues(newValue);
                                }}
                            />
                        </LabelWrapper>
                    </Col>
                    <Col span={6}>
                        <LabelWrapper label={getTranslation(`planConversationExceedPrice`)}>
                            <InputSimple
                                disabled={notAdmin}
                                type={'number'}
                                min={0}
                                max={1000000}
                                value={channel.conversationExcededPrice}
                                onChange={(event) => {
                                    const value = parseFloat(event.target.value) || 0;
                                    const newChannel = { ...channel, conversationExcededPrice: value };
                                    let newValue = channelFormik.values;
                                    newValue.splice(index, 1, newChannel);
                                    channelFormik.setValues(newValue);
                                }}
                            />
                        </LabelWrapper>
                    </Col>
                    <Col span={6}>
                        <LabelWrapper label={getTranslation(`Channel message limit`)}>
                            <InputSimple
                                disabled={notAdmin}
                                type={'number'}
                                min={0}
                                max={1000000}
                                value={channel.messageLimit}
                                onChange={(event) => {
                                    const value = parseFloat(event.target.value) || 0;
                                    const newChannel = { ...channel, messageLimit: value };
                                    let newValue = channelFormik.values;
                                    newValue.splice(index, 1, newChannel);
                                    channelFormik.setValues(newValue);
                                }}
                            />
                        </LabelWrapper>
                    </Col>
                    <Col span={6}>
                        <LabelWrapper label={getTranslation(`planExceededMessagePrice`)}>
                            <InputSimple
                                disabled={notAdmin}
                                type={'number'}
                                min={0}
                                max={1000000}
                                value={channel.messageExcededPrice}
                                onChange={(event) => {
                                    const value = parseFloat(event.target.value) || 0;
                                    const newChannel = { ...channel, messageExcededPrice: value };
                                    let newValue = channelFormik.values;
                                    newValue.splice(index, 1, newChannel);
                                    channelFormik.setValues(newValue);
                                }}
                            />
                        </LabelWrapper>
                    </Col>
                </Row>
            </Card>
        );
    };

    return (
        <>
            <Row gutter={16}>
                <Col span={20}>
                    <LabelWrapper
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: 'plan',
                        }}
                        label={getTranslation(`plan`)}
                    >
                        <InputSimple
                            disabled={notAdmin}
                            autoFocus={setup ? false : true}
                            value={formik.values.plan}
                            placeholder={getTranslation(`plan`)}
                            onChange={(event) => {
                                formik.setFieldValue(`plan`, event.target.value);
                            }}
                        />
                    </LabelWrapper>
                </Col>
                <Col span={4}>
                    <LabelWrapper
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: 'active',
                        }}
                        label=' '
                    >
                        <Toggle
                            disabled={notAdmin}
                            tabIndex='52'
                            label={getTranslation('Active')}
                            checked={formik.values.active}
                            onChange={() => {
                                formik.setFieldValue('active', !formik.values.active);
                            }}
                        />
                    </LabelWrapper>
                </Col>
            </Row>
            <Row>
                <LabelWrapper
                    validate={{
                        touched: formik.touched,
                        errors: formik.errors,
                        isSubmitted: formik.isSubmitting,
                        fieldName: 'invoiceDescription',
                    }}                    
                    tooltip={getTranslation('invoiceDescription-msg')}
                    label={getTranslation(`invoiceDescription`)}
                >
                    <InputSimple
                        disabled={notAdmin}
                        value={formik.values.invoiceDescription}
                        placeholder={getTranslation(`invoiceDescription`)}
                        onChange={(event) => {
                            formik.setFieldValue(`invoiceDescription`, event.target.value);
                        }}
                    />
                </LabelWrapper>
            </Row>
            <Row>
                <LabelWrapper
                    validate={{
                        touched: formik.touched,
                        errors: formik.errors,
                        isSubmitted: formik.isSubmitting,
                        fieldName: 'paymentDescription',
                    }}
                    tooltip={getTranslation('paymentDescription-msg')}
                    label={getTranslation(`paymentDescription`)}
                >
                    <InputSimple
                        disabled={notAdmin}
                        value={formik.values.paymentDescription}
                        placeholder={getTranslation(`paymentDescription`)}
                        onChange={(event) => {
                            formik.setFieldValue(`paymentDescription`, event.target.value);
                        }}
                    />
                </LabelWrapper>
            </Row>
            <Row gutter={16}>
                <Col span={6}>
                    <LabelWrapper
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: `startAt`,
                        }}
                        label={getTranslation(`startAt`)}
                    >
                        <DatePicker
                            disabled={notAdmin}
                            style={{ width: '100%' }}
                            size='large'
                            format={'DD/MM/YY'}
                            value={moment(Number(formik.values.startAt))}
                            onChange={(date) => {
                                formik.setFieldValue(`startAt`, date?.valueOf());
                            }}
                        />
                    </LabelWrapper>
                </Col>
                <Col span={6}>
                    <LabelWrapper
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: `dueDate`,
                        }}
                        label={getTranslation(`dueDate`)}
                    >
                        <InputSimple
                            disabled={notAdmin}
                            type={'number'}
                            min={1}
                            max={31}
                            value={formik.values.dueDate}
                            onChange={(event) => {
                                formik.setFieldValue(`dueDate`, parseFloat(event.target.value));
                            }}
                        />
                    </LabelWrapper>
                </Col>
                {!setup && (
                    <Col span={setup ? 12 : 6}>
                        <LabelWrapper
                            validate={{
                                touched: formik.touched,
                                errors: formik.errors,
                                isSubmitted: formik.isSubmitting,
                                fieldName: `accountId`,
                            }}
                            label={getTranslation(`accountId`)}
                        >
                            <CustomCreatableSelect
                                disabled={notAdmin}
                                options={
                                    orderBy(accounts, 'company')?.map((account) => {
                                        return { value: account.id, label: account.company };
                                    }) || []
                                }
                                placeholder=''
                                value={{
                                    label:
                                        accounts?.find((element) => element.id === formik.values.accountId)?.company ||
                                        '',
                                    value: formik.values.accountId,
                                }}
                                onChange={(event) => {
                                    if (event?.__isNew__ || event === null) {
                                        return formik.setFieldValue(`accountId`, '');
                                    }

                                    formik.setFieldValue(`accountId`, parseFloat(event.value));
                                }}
                            />
                        </LabelWrapper>
                    </Col>
                )}
                <Col span={6}>
                    <LabelWrapper
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: 'segment',
                        }}
                        label={getTranslation(`Segment`)}
                    >
                        <InputSimple
                            disabled={notAdmin}
                            value={formik.values.segment}
                            placeholder={getTranslation(`Segment`)}
                            onChange={(event) => {
                                formik.setFieldValue(`segment`, event.target.value);
                            }}
                        />
                    </LabelWrapper>
                </Col>
            </Row>
            <Row gutter={16}>
                <Col span={6}>
                    <LabelWrapper
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: `planPrice`,
                        }}
                        label={getTranslation(`planPrice`)}
                    >
                        <InputSimple
                            disabled={notAdmin}
                            type={'number'}
                            min={0}
                            max={1000000}
                            value={formik.values.planPrice}
                            onChange={(event) => {
                                formik.setFieldValue(`planPrice`, parseFloat(event.target.value));
                            }}
                        />
                    </LabelWrapper>
                </Col>
                <Col span={6}>
                    <LabelWrapper
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: `planUserLimit`,
                        }}
                        label={getTranslation(`planUserLimit`)}
                    >
                        <InputSimple
                            disabled={notAdmin}
                            type={'number'}
                            min={0}
                            max={1000000}
                            value={formik.values.planUserLimit}
                            onChange={(event) => {
                                formik.setFieldValue(`planUserLimit`, parseFloat(event.target.value));
                            }}
                        />
                    </LabelWrapper>
                </Col>
                <Col span={6}>
                    <LabelWrapper
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: `planUserExceedPrice`,
                        }}
                        label={getTranslation(`planUserExceedPrice`)}
                    >
                        <InputSimple
                            disabled={notAdmin}
                            type={'number'}
                            min={0}
                            max={1000000}
                            value={formik.values.planUserExceedPrice}
                            onChange={(event) => {
                                formik.setFieldValue(`planUserExceedPrice`, parseFloat(event.target.value));
                            }}
                        />
                    </LabelWrapper>
                </Col>
                <Col span={6}>
                    <LabelWrapper
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: 'hasIntegration',
                        }}
                        label=' '
                    >
                        <Toggle
                            disabled={notAdmin}
                            tabIndex='52'
                            label={getTranslation('Has integration')}
                            checked={formik.values.hasIntegration}
                            onChange={() => {
                                formik.setFieldValue('hasIntegration', !formik.values.hasIntegration);
                            }}
                        />
                    </LabelWrapper>
                </Col>
            </Row>
            <Row>
                <LabelWrapper
                    validate={{
                        touched: formik.touched,
                        errors: formik.errors,
                        isSubmitted: formik.isSubmitting,
                        fieldName: 'observations',
                    }}
                    label={getTranslation(`Observations`)}
                >
                    <TextAreaSimple
                        disabled={notAdmin}
                        value={formik.values.observations}
                        style={{ height: 'auto' }}
                        rows={5}
                        placeholder={getTranslation(`Observations`)}
                        onChange={(event) => {
                            formik.setFieldValue(`observations`, event.target.value);
                        }}
                    />
                </LabelWrapper>
            </Row>
            {!setup && formik?.values?.account ? (
                <Row>
                    <Typography.Text code>{`Conta vinculada: ${formik?.values?.account?.company}`}</Typography.Text>
                    <Typography.Text copyable code>{`CNPJ: ${formik?.values?.account?.registrationId}`}</Typography.Text>
                </Row>
            ) : null}
            <Row>
                <LabelWrapper
                    validate={{
                        touched: formik.touched,
                        errors: formik.errors,
                        isSubmitted: formik.isSubmitting,
                        fieldName: 'billingType',
                    }}
                    label={getTranslation('Billing type')}
                >
                    <Radio.Group
                        value={formik?.values?.billingType || BillingType.global}
                        buttonStyle={'solid'}
                        onChange={(event) => {
                            formik.setFieldValue(`billingType`, event.target.value);
                        }}
                    >
                        <RadioButton
                            selected={
                                !formik?.values?.billingType || formik?.values?.billingType === BillingType.global
                            }
                            value={BillingType.global}
                        >
                            {getTranslation('Global')}
                        </RadioButton>
                        <RadioButton
                            selected={formik?.values?.billingType === BillingType.channel}
                            value={BillingType.channel}
                        >
                            {getTranslation('Channel')}
                        </RadioButton>
                    </Radio.Group>
                </LabelWrapper>
            </Row>
            {!formik?.values?.billingType || formik?.values?.billingType === BillingType.global ? (
                <div style={{ marginTop: '20px' }}>
                    <Card header={getTranslation('Global')} margin='0 0 20px 0'>
                        <Row gutter={16}>
                            <Col span={6}>
                                <LabelWrapper
                                    validate={{
                                        touched: formik.touched,
                                        errors: formik.errors,
                                        isSubmitted: formik.isSubmitting,
                                        fieldName: `planConversationLimit`,
                                    }}
                                    label={getTranslation(`planConversationLimit`)}
                                >
                                    <InputSimple
                                        disabled={notAdmin}
                                        type={'number'}
                                        min={0}
                                        max={1000000}
                                        value={formik.values.planConversationLimit}
                                        onChange={(event) => {
                                            formik.setFieldValue(
                                                `planConversationLimit`,
                                                parseFloat(event.target.value)
                                            );
                                        }}
                                    />
                                </LabelWrapper>
                            </Col>
                            <Col span={6}>
                                <LabelWrapper
                                    validate={{
                                        touched: formik.touched,
                                        errors: formik.errors,
                                        isSubmitted: formik.isSubmitting,
                                        fieldName: `planConversationExceedPrice`,
                                    }}
                                    label={getTranslation(`planConversationExceedPrice`)}
                                >
                                    <InputSimple
                                        disabled={notAdmin}
                                        type={'number'}
                                        min={0}
                                        max={1000000}
                                        value={formik.values.planConversationExceedPrice}
                                        onChange={(event) => {
                                            formik.setFieldValue(
                                                `planConversationExceedPrice`,
                                                parseFloat(event.target.value)
                                            );
                                        }}
                                    />
                                </LabelWrapper>
                            </Col>
                            <Col span={6}>
                                <LabelWrapper
                                    validate={{
                                        touched: formik.touched,
                                        errors: formik.errors,
                                        isSubmitted: formik.isSubmitting,
                                        fieldName: `planMessageLimit`,
                                    }}
                                    label={getTranslation(`planMessageLimit`)}
                                >
                                    <InputSimple
                                        disabled={notAdmin}
                                        type={'number'}
                                        min={0}
                                        max={1000000}
                                        value={formik.values.planMessageLimit}
                                        onChange={(event) => {
                                            formik.setFieldValue(`planMessageLimit`, parseFloat(event.target.value));
                                        }}
                                    />
                                </LabelWrapper>
                            </Col>
                            <Col span={6}>
                                <LabelWrapper
                                    validate={{
                                        touched: formik.touched,
                                        errors: formik.errors,
                                        isSubmitted: formik.isSubmitting,
                                        fieldName: `planExceededMessagePrice`,
                                    }}
                                    label={getTranslation(`planExceededMessagePrice`)}
                                >
                                    <InputSimple
                                        disabled={notAdmin}
                                        type={'number'}
                                        min={0}
                                        max={1000000}
                                        value={formik.values.planExceededMessagePrice}
                                        onChange={(event) => {
                                            formik.setFieldValue(
                                                `planExceededMessagePrice`,
                                                parseFloat(event.target.value)
                                            );
                                        }}
                                    />
                                </LabelWrapper>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={6}>
                                <LabelWrapper
                                    validate={{
                                        touched: formik.touched,
                                        errors: formik.errors,
                                        isSubmitted: formik.isSubmitting,
                                        fieldName: `planHsmMessageLimit`,
                                    }}
                                    label={getTranslation(`planHsmMessageLimit`)}
                                >
                                    <InputSimple
                                        disabled={notAdmin}
                                        type={'number'}
                                        min={0}
                                        max={1000000}
                                        value={formik.values.planHsmMessageLimit}
                                        onChange={(event) => {
                                            formik.setFieldValue(`planHsmMessageLimit`, parseFloat(event.target.value));
                                        }}
                                    />
                                </LabelWrapper>
                            </Col>
                            <Col span={6}>
                                <LabelWrapper
                                    validate={{
                                        touched: formik.touched,
                                        errors: formik.errors,
                                        isSubmitted: formik.isSubmitting,
                                        fieldName: `planHsmExceedMessagePrice`,
                                    }}
                                    label={getTranslation(`planHsmExceedMessagePrice`)}
                                >
                                    <InputSimple
                                        disabled={notAdmin}
                                        type={'number'}
                                        min={0}
                                        max={1000000}
                                        value={formik.values.planHsmExceedMessagePrice}
                                        onChange={(event) => {
                                            formik.setFieldValue(
                                                `planHsmExceedMessagePrice`,
                                                parseFloat(event.target.value)
                                            );
                                        }}
                                    />
                                </LabelWrapper>
                            </Col>
                        </Row>
                    </Card>
                </div>
            ) : (
                <div style={{ marginTop: '20px' }}>
                    {Object.keys(WorkspaceChannels).map((channel) => {
                        return getChannel(WorkspaceChannels[channel]);
                    })}
                </div>
            )}
        </>
    );
};

export default I18n(BillingSpecificationForm) as FC<BillingSpecificationFormProps>;
