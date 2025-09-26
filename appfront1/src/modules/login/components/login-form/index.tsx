import { LabelWrapper } from '../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import * as Yup from 'yup';
import { Constants } from '../../../../utils/Constants';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import i18n from '../../../i18n/components/i18n';
import { FC, useEffect, useState } from 'react';
import { LoginFormProps } from './props';
import { LoginService } from '../../services/LoginService';
import { LoginMethod } from '../../interfaces/login';
import { timeout } from '../../../../utils/Timer';
import { PrimaryButton } from '../../../../ui-kissbot-v2/common';
import { useFormik } from 'formik-latest';
import { InputSimple } from '../../../../shared/InputSample/InputSimple';
import InputPassword from '../../../../shared/InputPassword/InputPassword';
import { Alert } from 'antd';

interface IForm {
    email: string;
    password?: string;
}

const LoginForm: FC<LoginFormProps & I18nProps> = ({
    getTranslation,
    onSubmit,
    loginErrorMessage,
    onUserDontExists,
}) => {
    const [loginMethod, setLoginMethod] = useState<LoginMethod | undefined>(LoginMethod.bot);
    const [authenticating, setAuthenticating] = useState<boolean>(false);
    const [requireCognitoRegistry, setRequireCognitoRegistry] = useState<boolean>(false);

    const getSavedEmail = () => localStorage.getItem(Constants.LOCAL_STORAGE_MAP.EMAILLOGIN) || '';

    useEffect(() => {
        if (!!loginErrorMessage) {
            setAuthenticating(false);
        }
    }, [loginErrorMessage]);

    useEffect(() => {
        const element = document.getElementById('email-login');
        timeout(() => element?.focus(), 50);
    }, []);

    const getInitialValues = () => {
        const email = getSavedEmail();
        switch (loginMethod) {
            case LoginMethod.bot:
                return { email, password: '' };

            default:
                return { email, password: '' };
        }
    };

    const getValidationSchema = () => {
        switch (loginMethod) {
            case LoginMethod.bot:
                return Yup.object().shape({
                    email: Yup.string().email('Email not valid').required(getTranslation('This field is required')),
                    password: Yup.string().required(getTranslation('This field is required')),
                });

            default:
                return Yup.object().shape({
                    email: Yup.string().email('Email not valid').required(getTranslation('This field is required')),
                });
        }
    };

    const formik = useFormik<IForm>({
        initialValues: getInitialValues(),
        validationSchema: getValidationSchema(),
        onSubmit: (values) => {
            return handleSubmitForm(values);
        },
    });

    const handleSubmitForm = async (form: IForm) => {
        if (!loginMethod) {
            form.email = form.email.toLowerCase().trim();
            if (!form.email) {
                return;
            }
            const response = await LoginService.loginMethod(form.email, (err) => {
                if (err?.error === 'USER_EMPTY_COGNITO_ID') {
                    setRequireCognitoRegistry(true);
                    return setLoginMethod(LoginMethod.bot);
                }

                if (err?.error === 'USER_NOT_EXISTS_METHOD') {
                    onUserDontExists();
                }
            });
            const method = response?.loginMethod;

            if (!method) {
                return;
            }
            return setLoginMethod(method);
        }

        return onSubmit(form, loginMethod, requireCognitoRegistry);
    };

    useEffect(() => {
        if (loginMethod === LoginMethod.bot) {
            const element = document.getElementById('password-login');
            timeout(() => element?.focus(), 0);
        }
    }, [loginMethod]);

    const getButtonLoginMethod = () => {
        switch (loginMethod) {
            case LoginMethod.dasa:
                return (
                    <PrimaryButton
                        loading={authenticating}
                        onClick={() => {
                            if (formik.isValid) {
                                setAuthenticating(true);
                            }
                            formik.submitForm();
                        }}
                        style={{ width: '100%', fontSize: '15px', margin: '15px 0 0 0', background: '#000f40' }}
                    >
                        {getTranslation('Continuar com Dasa')}
                    </PrimaryButton>
                );

            case LoginMethod.bot:
                return (
                    <PrimaryButton
                        loading={authenticating}
                        onClick={() => {
                            if (loginMethod === LoginMethod.bot && !formik.values.password) return;

                            if (formik.isValid) {
                                setAuthenticating(true);
                            }
                            formik.submitForm();
                        }}
                        style={{ width: '100%', fontSize: '15px', margin: '15px 0 0 0' }}
                    >
                        {getTranslation('Login')}
                    </PrimaryButton>
                );

            default:
                return (
                    <PrimaryButton
                        onClick={() => formik.submitForm()}
                        style={{ width: '100%', fontSize: '15px', margin: '15px 0 0 0' }}
                    >
                        {getTranslation('Next')}
                    </PrimaryButton>
                );
        }
    };

    return (
        <>
            {!!loginErrorMessage ? (
                <div className='alert-container'>
                    <Alert
                        message={getTranslation('Invalid email or password')}
                        type='error'
                        showIcon
                        className='custom-alert'
                    />
                </div>
            ) : null}
            <LabelWrapper
                label={getTranslation('Email')}
                validate={{
                    touched: formik.touched,
                    errors: formik.errors,
                    fieldName: 'email',
                    isSubmitted: formik.submitCount > 1,
                }}
            >
                <input style={{ visibility: 'hidden', display: 'none' }} type='password' />
                <InputSimple
                    id='email-login'
                    type='email'
                    name='email'
                    autoComplete='email'
                    autoFocus
                    // onKeyPress={(ev) => {
                    //     if (ev.key === 'Enter') {
                    //         formik.submitForm();
                    //     }
                    // }}
                    onChange={(ev) => {
                        formik.setFieldValue('email', ev.target.value);
                        // if (loginMethod) {
                        //     return setLoginMethod(undefined);
                        // }
                    }}
                />
            </LabelWrapper>
            {loginMethod === LoginMethod.bot && (
                <LabelWrapper
                    label={getTranslation('Password')}
                    validate={{
                        touched: formik.touched,
                        errors: formik.errors,
                        fieldName: 'password',
                        isSubmitted: formik.submitCount > 1,
                    }}
                >
                    <InputPassword
                        id='password-login'
                        type='password'
                        name='password'
                        className={!!loginErrorMessage ? 'error-input' : ''}
                        onKeyPress={(ev) => {
                            if (ev.key === 'Enter') {
                                formik.submitForm();
                                setAuthenticating(true);
                            }
                        }}
                        onChange={(ev) => formik.setFieldValue('password', ev.target.value)}
                    />
                </LabelWrapper>
            )}
            {getButtonLoginMethod()}
        </>
    );
};

export default i18n(LoginForm) as FC<LoginFormProps>;
