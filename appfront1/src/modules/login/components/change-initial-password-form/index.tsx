import { FC, useEffect, useState } from 'react';
import * as Yup from 'yup';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import i18n from '../../../i18n/components/i18n';
import { useFormik } from 'formik-latest';
import { LabelWrapper } from '../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import InputPassword from '../../../../shared/InputPassword/InputPassword';
import InfoErrorsPassword from '../../../../shared/InfoErrorsPassword';
import { PrimaryButton } from '../../../../ui-kissbot-v2/common';
import { ChangeInitialPasswordFormProps } from './props';
import { timeout } from '../../../../utils/Timer';

interface IChangePasswordForm {
    password: '';
}

const ChangeInitialPasswordForm: FC<ChangeInitialPasswordFormProps & I18nProps> = ({
    getTranslation,
    onChange,
    onLogout,
    loginErrorMessage,
}) => {
    const [authenticating, setAuthenticating] = useState<boolean>(false);

    useEffect(() => {
        if (!!loginErrorMessage) {
            setAuthenticating(false);
        }
    }, [loginErrorMessage]);

    const getValidationSchema = (): Yup.ObjectSchema => {
        return Yup.object().shape({
            password: Yup.string()
                .required(getTranslation('This field is required'))
                .min(8, getTranslation('At least 8 characters'))
                .max(20, getTranslation('Maximum 20 characters'))
                .matches(
                    /^(?=.*[!@#$%^&*()--__+.?=]){1,}.{0,}$/,
                    getTranslation('Your password must contain at least one special character')
                ),
        });
    };

    useEffect(() => {
        const element = document.getElementById('password-initial');
        timeout(() => element?.focus(), 50);
    }, []);

    const formik = useFormik<IChangePasswordForm>({
        initialValues: {
            password: '',
        },
        validationSchema: getValidationSchema(),
        onSubmit: (values) => {
            setAuthenticating(true);
            return onChange(values.password);
        },
    });

    return (
        <>
            <LabelWrapper
                label={getTranslation('New password')}
                validate={{
                    touched: formik.touched,
                    errors: formik.errors,
                    fieldName: 'password',
                    isSubmitted: formik.submitCount > 1,
                }}
            >
                <div style={{ margin: '0 0 10px 0' }}>
                    <InputPassword
                        id='password-initial'
                        autoFocus
                        autoComplete='new-password'
                        name='password'
                        onChange={(ev) => formik.setFieldValue('password', ev.target.value)}
                    />
                </div>
            </LabelWrapper>
            <InfoErrorsPassword
                omitKeyErrors={['required']}
                errors={getValidationSchema()}
                fieldName='password'
                value={formik.values.password}
            />
            <PrimaryButton
                loading={authenticating}
                onClick={() => formik.submitForm()}
                style={{ width: '100%', fontSize: '15px', margin: '15px 0 0 0' }}
            >
                {getTranslation('Continue')}
            </PrimaryButton>
            <div
                title={getTranslation('Logout')}
                style={{
                    margin: '15px 5px 0 0',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    color: '#1890ff',
                    textDecoration: 'none',
                    cursor: 'pointer',
                }}
                onClick={onLogout}
            >
                {getTranslation('Logout')}
            </div>
        </>
    );
};

export default i18n(ChangeInitialPasswordForm) as FC<ChangeInitialPasswordFormProps>;
