import { Form, Formik } from 'formik';
import { FC, useEffect, useState } from 'react';
import { GrFormClose } from 'react-icons/gr';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import * as Yup from 'yup';
import { LabelWrapper } from '../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { StyledFormikField } from '../../../../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import { PrimaryButton, Wrapper } from '../../../../../../../../ui-kissbot-v2/common';
import { ColorType } from '../../../../../../../../ui-kissbot-v2/theme';
import { timeout } from '../../../../../../../../utils/Timer';
import { validatePhoneNumber } from '../../../../../../../../utils/validatePhoneNumber';
import I18n from '../../../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../../../i18n/interface/i18n.interface';
import { LiveAgentService } from '../../../../../../service/LiveAgent.service';
import { CreateContactProps } from './props';

const CreateContactForm: FC<CreateContactProps & I18nProps> = ({
    onCreate,
    onClose,
    getTranslation,
    initial,
    workspaceId,
    notification,
    onContactSelected,
    onContactInfo,
}) => {
    const [submitted, setSubmitted] = useState(false);
    const [validatedNumber, setvalidatedNumber] = useState<any>(undefined);
    const [enteredNumber, setEnteredNumber] = useState<string>('');
    const [loadingValidation, setLoadingValidation] = useState<boolean>(false);
    const [validPhoneNumber, setValidPhoneNumber] = useState(false);
    const [phonePersonalized, setPhonePersonalized] = useState(false);
    const [ddi, setDdi] = useState<string>('55');

    const getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            name: Yup.string().min(2).required(getTranslation('This field is required')),
            email: Yup.string().email(),
        });
    };

    useEffect(() => {
        if (validPhoneNumber) {
            validateCurrentNumber();
        }
    }, [validPhoneNumber, enteredNumber]);

    const onFormatPhone = () => {
        let formatPhone = enteredNumber;

        if (phonePersonalized && enteredNumber.startsWith('5508')) {
            formatPhone = enteredNumber.slice(2);
        } else {
            formatPhone = enteredNumber.slice(ddi.length);
        }
        return formatPhone;
    }

    const validateCurrentNumber = async () => {
        setLoadingValidation(true);

        let error: any;

        let formatPhone = onFormatPhone();

        const response = await LiveAgentService.checkPhoneStatus(formatPhone, ddi, workspaceId, undefined, (err) => {
            error = err;
        });

        if (error) {
            return notification({
                title: getTranslation('Warning'),
                message: `${getTranslation('No channels available to validate the number')}.`,
                type: 'warning',
            });
        }

        if (response) {
            const conversations = response?.conversationByChannel
                ?.filter((curr) => !!curr?.conversation)
                .map((conv) => {
                    if (!conv.conversation.activities) conv.conversation.activities = [];
                    return conv.conversation;
                });
            const validated = {
                contact: response?.contact,
                conversations: conversations,
                validateNumber: {
                    isValid: true,
                    phoneId: enteredNumber,
                },
            };
            setvalidatedNumber(validated);
        }
        setLoadingValidation(false);
    };

    const displayExistingContact = () => {
        if (validatedNumber?.contact?._id) {
            onContactSelected(validatedNumber.contact._id);
            return onContactInfo();
        }

        if (validatedNumber?.conversations?.length) {
            const member = validatedNumber.conversations[0].members?.find(
                (member) => member.type === 'user' && member.contactId
            );

            if (member?.contactId) {
                onContactSelected(member.contactId);
                return onContactInfo();
            }
        }

        return notification({
            title: getTranslation('Warning'),
            message: `${getTranslation('Não foi possível visualizar o contato')}.`,
            type: 'warning',
        });
    };

    const statusPhone = () => {
        if (validatedNumber?.contact || validatedNumber?.conversations?.length) {
            return {
                component: (
                    <span
                        className={`mdi mdi-24px mdi-account-box`}
                        title={getTranslation('Contact already exists, see contact')}
                    />
                ),
                text: (
                    <div style={{ cursor: 'default', background: 'none', color: '#2e67bf' }}>
                        {getTranslation(`Contact already exists, `)}
                        <span
                            style={{ textDecoration: 'underline', cursor: 'pointer' }}
                            onClick={displayExistingContact}
                        >
                            {getTranslation(`see contact`)}
                        </span>
                    </div>
                ),
                color: '#2e67bf',
            };
        } else if (validatedNumber?.validateNumber && validatedNumber?.validateNumber.isValid) {
            // timeout(() => {
            //     const element = document.getElementById('contact-name');
            //     element?.focus();
            // }, 200);

            return {
                component: <span className={`mdi mdi-24px mdi-check`} title={getTranslation('Valid number')} />,
                text: getTranslation('Valid number'),
                color: '#0c880c',
            };
        }

        return {
            component: <div></div>,
            text: `${getTranslation('Example')}: 55 (47) 12345-6789`,
            color: '#777',
        };
    };

    const canCreateContact = () => {
        if (!validatedNumber) {
            return false;
        }
        if (validatedNumber && validatedNumber.validateNumber && validatedNumber.validateNumber.isValid) {
            if (validatedNumber.contact || validatedNumber.conversations?.length) {
                return false;
            }

            if (validatedNumber.validateNumber && validatedNumber.validateNumber.isValid) {
                return true;
            }
        }
        return false;
    };

    const permissionToCreateContact = canCreateContact();

    const handleOnCreate = (values: any) => {
        onCreate({
            ...values,
            phone: onFormatPhone(),
            whatsapp: validatedNumber.validateNumber.phoneId,
            ddi: ddi,
        });
    };
    return (
        <Formik
            initialValues={{ ...(initial || {}) } as any}
            onSubmit={() => {}}
            validationSchema={getValidationSchema()}
            render={({ values, submitForm, validateForm, touched, errors }) => {
                const submit = () => {
                    setSubmitted(true);
                    validateForm().then((validatedValues: any) => {
                        if (validatedValues.isCanceled) return submit();
                        submitForm();

                        if (Object.keys(validatedValues).length === 0) return handleOnCreate(values);
                    });
                };

                const phoneStatus = statusPhone();

                return (
                    <Form>
                        <Wrapper>
                            <LabelWrapper label={getTranslation('Cell phone')}>
                                <Wrapper position='relative'>
                                    <PhoneInput
                                        key={phonePersonalized ? 'personalized' : ''}
                                        enableSearch
                                        inputClass='input-phone-number'
                                        value={enteredNumber}
                                        masks={{
                                            br: ['(..) ..... ....'],
                                            ar: ['. ... ... ....'],
                                            py: ['(...) ... ...'],
                                        }}
                                        prefix={phonePersonalized ? '' : '+'}
                                        inputProps={{ autoFocus: true }}
                                        disableDropdown={validPhoneNumber}
                                        countryCodeEditable={false}
                                        inputStyle={{ width: '100%', height: '42px' }}
                                        enableTerritories
                                        country={'br'}
                                        isValid={(inputNumber, country: any, countries) => {
                                            setDdi(country.countryCode)
                                            return validatePhoneNumber({
                                                countries,
                                                country,
                                                inputNumber,
                                                phonePersonalized,
                                                setPhonePersonalized,
                                                setValidPhoneNumber,
                                            });
                                        }}
                                        onChange={(value: string) => setEnteredNumber(value)}
                                    />
                                    {enteredNumber?.length && enteredNumber.length > 2 ? (
                                        <GrFormClose
                                            onClick={() => {
                                                setvalidatedNumber(undefined);
                                                setEnteredNumber('55');
                                                setDdi('55')
                                                const elements = document.getElementsByClassName('input-phone-number');
                                                if (elements.length) {
                                                    const input = elements[0] as HTMLInputElement;
                                                    input.focus();
                                                }
                                            }}
                                            style={{
                                                position: 'absolute',
                                                cursor: 'pointer',
                                                right: '30px',
                                                top: '10px',

                                                fontSize: '20px',
                                            }}
                                        />
                                    ) : null}

                                    {loadingValidation ? (
                                        <Wrapper right='5px' top='10px' position='absolute'>
                                            <img
                                                alt='Ícone de carregamento em andamento'
                                                src='assets/img/loading-2.gif'
                                                style={{
                                                    height: '23px',
                                                }}
                                            />
                                        </Wrapper>
                                    ) : validatedNumber ? (
                                        <Wrapper right='5px' cursor={'default'} top='2px' position='absolute'>
                                            {phoneStatus.component}
                                        </Wrapper>
                                    ) : null}
                                </Wrapper>
                            </LabelWrapper>
                            <Wrapper
                                flexBox
                                justifyContent={validatedNumber ? 'flex-end' : 'flex-start'}
                                margin='2px'
                                color={validatedNumber ? phoneStatus.color : '#777'}
                                fontSize='12px'
                            >
                                {validatedNumber
                                    ? phoneStatus.text
                                    : `${getTranslation('Example')}: 55 (47) 12345-6789`}
                            </Wrapper>
                            <>
                                <LabelWrapper
                                    validate={{
                                        touched,
                                        errors,
                                        isSubmitted: submitted,
                                        fieldName: `name`,
                                    }}
                                    label={getTranslation('Name')}
                                >
                                    <StyledFormikField
                                        className='form-control form-control-sm'
                                        name='name'
                                        // id='contact-name'
                                        disabled={!permissionToCreateContact}
                                        placeholder={getTranslation('Enter a name')}
                                        // autoFocus
                                    />
                                </LabelWrapper>
                                <LabelWrapper
                                    validate={{
                                        touched,
                                        errors,
                                        isSubmitted: submitted,
                                        fieldName: `email`,
                                    }}
                                    label='Email (opcional)'
                                >
                                    <StyledFormikField
                                        className='form-control form-control-sm'
                                        name='email'
                                        disabled={!permissionToCreateContact}
                                        placeholder={getTranslation('Enter a email')}
                                    />
                                </LabelWrapper>
                            </>
                        </Wrapper>
                        <Wrapper flexBox margin='20px 0' cursor='pointer' justifyContent='space-between'>
                            <PrimaryButton width='70px' colorType={ColorType.text} onClick={onClose}>
                                {getTranslation('Cancel')}
                            </PrimaryButton>
                            {permissionToCreateContact && (
                                <PrimaryButton disabled={!values.name} width='70px' onClick={submit}>
                                    {getTranslation('Create')}
                                </PrimaryButton>
                            )}
                        </Wrapper>
                    </Form>
                );
            }}
        />
    );
};

export default I18n(CreateContactForm) as FC<CreateContactProps>;
