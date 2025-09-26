import { useFormik } from 'formik-latest';
import { FC, useState } from 'react';
import { Card, PrimaryButton, Wrapper } from '../../../../ui-kissbot-v2/common';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { SetupFormProps } from './props';
import * as Yup from 'yup';
import CustomerForm from '../CustomerForm';
import { CustomersService } from '../../service/BillingService';
import moment from 'moment';
import { LabelWrapper } from '../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { InputSimple } from '../../../../shared/InputSample/InputSimple';
import { CreateInitialSetup } from '../../page/Customers/interfaces';
import BillingSpecificationForm from '../../../settings/components/Billing/components/BillingSpecificationForm';
import { defaultChannelSpecification } from '../../../settings/components/Billing/components/WorkspaceBillingSpecification/utils/defaultVariables';

const SetupForm: FC<SetupFormProps & I18nProps> = ({ getTranslation, addNotification }) => {
    const [withError, setWithError] = useState<any>(undefined);
    const [disable, setDisable] = useState(false);

    const emptySetup = {
        workspaceName: '',
        legalName: '',
        registrationId: '',
        taxRegistrationType: '',
        state: '',
        postalCode: '',
        phoneNumber: '',
        ibge: '',
        districtOrCounty: '',
        countryCode: '55',
        company: '',
        city: '',
        addressLine1: '',
        addressLine2: '',
        addressLine3: '',
        email: '',
        website: '',
        gatewayClientId: '',
        plan: '',
        invoiceDescription: 'Nota referente aos serviços prestados no mês: {{MES}}. Quantidade de atendimento: {{QTD_ATENDIMENTOS}}.',
        paymentDescription: 'Cobrança referente aos serviços prestados no mês: {{MES}}.',
        dueDate: 15,
        planPrice: '',
        planMessageLimit: '',
        planExceededMessagePrice: '',
        planHsmMessageLimit: '',
        planHsmExceedMessagePrice: '',
        planUserLimit: '',
        planUserExceedPrice: '',
        startAt: moment().valueOf(),
        planConversationExceedPrice: '',
        planConversationLimit: '',
    };

    const getValidationSchema = (): Yup.ObjectSchema => {
        return Yup.object().shape({
            workspaceName: Yup.string().required('This field is required'),
            legalName: Yup.string().required('This field is required'),
            registrationId: Yup.string().required('This field is required'),
            state: Yup.string().required('This field is required'),
            postalCode: Yup.string().required('This field is required'),
            phoneNumber: Yup.string().required('This field is required'),
            ibge: Yup.string().required('This field is required'),
            districtOrCounty: Yup.string().required('This field is required'),
            countryCode: Yup.string().required('This field is required'),
            company: Yup.string().required('This field is required'),
            city: Yup.string().required('This field is required'),
            addressLine1: Yup.string().required('This field is required'),
            addressLine2: Yup.string().required('This field is required'),
            addressLine3: Yup.string(),
            email: Yup.string().email().required('This field is required'),
            website: Yup.string().url().nullable(),
            vinculeToWorkspaceIds: Yup.array().of(Yup.string()),
            plan: Yup.string(),
            dueDate: Yup.number().required('This field is required'),
            planPrice: Yup.number().required('This field is required'),
            planMessageLimit: Yup.number().required('This field is required'),
            planExceededMessagePrice: Yup.number().required('This field is required'),
            planHsmMessageLimit: Yup.number().required('This field is required'),
            planHsmExceedMessagePrice: Yup.number().required('This field is required'),
            planUserLimit: Yup.number().required('This field is required'),
            planUserExceedPrice: Yup.number().required('This field is required'),
            startAt: Yup.number().required('This field is required'),
            planConversationExceedPrice: Yup.number().required('This field is required'),
            planConversationLimit: Yup.number().required('This field is required'),
        });
    };

    const formik = useFormik({
        validationSchema: getValidationSchema(),
        initialValues: { ...emptySetup },
        onSubmit: () => {
            formik.setSubmitting(true);
            formik.validateForm().then((validatedValues: any) => {
                if (validatedValues.isCanceled) {
                    return formik.handleSubmit();
                }

                if (Object.keys(validatedValues).length === 0) {
                    createSetup(formik.values);

                    if (!withError) {
                        formik.resetForm();
                    }
                }
            });
        },
    });

    const channelFormik = useFormik({
        enableReinitialize: true,
        initialValues: defaultChannelSpecification(),
        onSubmit: () => {},
    });

    const createSetup = async (values) => {
        setDisable(true);
        const workspaceName = values.workspaceName.charAt(0).toUpperCase() + values.workspaceName.substr(1);
        const initialSetup: CreateInitialSetup = {
            workspaceName: workspaceName,
            accountData: {
                addressLine1: values.addressLine1,
                addressLine2: values.addressLine2,
                city: values.city,
                company: values.company,
                countryCode: values.countryCode,
                districtOrCounty: values.districtOrCounty,
                ibge: values.ibge,
                legalName: values.legalName,
                phoneNumber: values.phoneNumber,
                postalCode: values.postalCode,
                registrationId: values.registrationId,
                state: values.state,
                taxRegistrationType: values.taxRegistrationType,
                addressLine3: values.addressLine3,
                email: values.email,
                gatewayClientId: values.gatewayClientId,
                website: values.website,
            },
            billingSpecificationData: {
                dueDate: values.dueDate,
                name: workspaceName,
                invoiceDescription: values.invoiceDescription,
                paymentDescription: values.paymentDescription,
                plan: values.plan,
                planExceededMessagePrice: values.planExceededMessagePrice,
                planHsmExceedMessagePrice: values.planHsmExceedMessagePrice,
                planHsmMessageLimit: values.planHsmMessageLimit,
                planMessageLimit: values.planMessageLimit,
                planPrice: values.planPrice,
                planUserExceedPrice: values.planUserExceedPrice,
                planUserLimit: values.planUserLimit,
                startAt: values.startAt,
                planConversationExceedPrice: values.planConversationExceedPrice,
                planConversationLimit: values.planConversationLimit,
                active: values?.active,
                hasIntegration: values?.hasIntegration,
                segment: values?.segment,
                observations: values?.observations,
                billingType: values?.billingType,
            },
        };

        const response = await CustomersService.createInitialSetup(initialSetup, (err) => {
            setWithError(err);
        });

        if (response && !withError) {
            setDisable(false);
            addNotification({
                type: 'success',
                duration: 3000,
                title: getTranslation('Success'),
                message: getTranslation('Setup successfully created'),
            });
            return formik.resetForm();
        }
        setDisable(false);
    };

    const getCnpj = async (value) => {
        const originalValue = value;
        value = value.replace(/\D/g, '');

        if (value.length === 14) {
            const responseAsaas = await CustomersService.getCNPJAsaas(value);

            let ibge;
            try {
                ibge = await getCep(responseAsaas?.postalCode, true);
            } catch (e) {}

            return formik.setValues({
                ...formik.values,
                registrationId: originalValue,
                legalName: responseAsaas.legalName,
                addressLine1: responseAsaas.addressLine1,
                postalCode: responseAsaas.postalCode,
                addressLine2: responseAsaas.addressLine2,
                addressLine3: responseAsaas.addressLine3,
                city: responseAsaas.city,
                company: responseAsaas.company,
                districtOrCounty: responseAsaas.districtOrCounty,
                email: responseAsaas.email,
                phoneNumber: responseAsaas.phoneNumber,
                state: responseAsaas.state,
                gatewayClientId: responseAsaas?.gatewayClientId || '',
                ibge: ibge || '',
            });
        }
    };

    const getCep = async (value, ibge?) => {
        const originalValue = value;
        value = value.replace(/\D/g, '');

        if (value.length === 8) {
            const cep = Number(value);
            const response = await CustomersService.getCep(cep);

            if (!response.data) return;

            if (response.data.erro) {
                return addNotification({
                    title: getTranslation('Error'),
                    message: getTranslation('Postal code invalid'),
                    type: 'warning',
                    duration: 3000,
                });
            }

            if (ibge) {
                return response.data.ibge;
            }

            return formik.setValues({
                ...formik.values,
                postalCode: originalValue,
                addressLine1: response.data.logradouro,
                city: response.data.localidade,
                districtOrCounty: response.data.bairro,
                state: response.data.uf,
                ibge: response.data.ibge,
            });
        }
    };

    return (
        <>
            <form style={{ minWidth: '800px', margin: '0 auto', width: '70%' }}>
                <Wrapper flexBox justifyContent='flex-end' margin='30px 0 20px 0'>
                    <PrimaryButton disabled={disable} onClick={() => formik.submitForm()}>
                        {getTranslation('Create setup')}
                    </PrimaryButton>
                </Wrapper>
                {disable && (
                    <img
                        alt='loading'
                        src={'/assets/img/loading.gif'}
                        style={{
                            height: '70px',
                            padding: '0 10px',
                            width: '100px',
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                        }}
                    />
                )}
                <Card
                    disabled={disable}
                    header={getTranslation('Setup creation')}
                    styleHeader={{
                        height: '45px',
                        bgColor: '#f2f2f2',
                        padding: '10px',
                        color: '#555',
                        fontSize: 'large',
                        fontWeight: 'normal',
                        textTransform: 'normal',
                    }}
                >
                    <Wrapper margin='0 0 20px 0'>
                        <LabelWrapper
                            validate={{
                                touched: formik.touched,
                                errors: formik.errors,
                                isSubmitted: formik.isSubmitting,
                                fieldName: 'workspaceName',
                            }}
                            label={getTranslation(`Workspace name`)}
                        >
                            <InputSimple
                                autoFocus
                                value={formik.values.workspaceName}
                                placeholder={getTranslation(`Workspace name`)}
                                onChange={(event) => {
                                    formik.setFieldValue(`workspaceName`, event.target.value);
                                }}
                            />
                        </LabelWrapper>
                    </Wrapper>

                    <CustomerForm
                        formik={formik}
                        getCep={(value) => getCep(value)}
                        getCnpj={(value) => getCnpj(value)}
                        setup={true}
                    />
                    <Wrapper margin='20px 0 0 0'>
                        <Card header={getTranslation('Workspace billing specification')}>
                            <BillingSpecificationForm formik={formik} setup={true} channelFormik={channelFormik} />
                        </Card>
                    </Wrapper>
                </Card>
            </form>
        </>
    );
};

export default i18n(SetupForm) as FC<SetupFormProps>;
