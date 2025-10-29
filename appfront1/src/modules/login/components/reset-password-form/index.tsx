import { FC, useState } from 'react';
import * as Yup from 'yup';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import i18n from '../../../i18n/components/i18n';
import { InputSimple } from '../../../../shared/InputSample/InputSimple';
import { useFormik } from 'formik-latest';
import { ResetPasswordFormProps } from './props';
import { Constants } from '../../../../utils/Constants';
import { LabelWrapper } from '../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import InputPassword from '../../../../shared/InputPassword/InputPassword';
import InfoErrorsPassword from '../../../../shared/InfoErrorsPassword';
import { PrimaryButton } from '../../../../ui-kissbot-v2/common';
import { UserService } from '../../../settings/service/UserService';
import { resetLoggedUserIntoStore } from '../../../../utils/get-user-from-store';

enum PasswordResetErrorsTokens {
    INVALID_CURRENT_PASSWORD = 'INVALID_CURRENT_PASSWORD',
    LIMIT_EXCEEDED = 'LIMIT_EXCEEDED',
}

interface IChangePasswordForm {
    oldPassword: '';
    password: '';
}

const ResetPasswordForm: FC<ResetPasswordFormProps & I18nProps> = ({ getTranslation, addNotification, onLogout }) => {
    const [requestingChangePassword, setRequestingChangePassword] = useState(false);

    const getValidationSchema = (): Yup.ObjectSchema => {
        return Yup.object().shape({
            oldPassword: Yup.string().required(getTranslation('This field is required')),
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

    const formik = useFormik<IChangePasswordForm>({
        initialValues: {
            oldPassword: '',
            password: '',
        },
        validationSchema: getValidationSchema(),
        onSubmit: (values) => {
            localStorage.removeItem(Constants.LOCAL_STORAGE_MAP.PASSWORD_CHANGED);
            return changePassword(values.oldPassword, values.password);
        },
    });

    const changePassword = async (oldPassword: string, password: string) => {
        setRequestingChangePassword(true);
        let error: any;
        await UserService.updatePassword(
            {
                oldPassword,
                password,
            },
            (err) => (error = err)
        );

        if (!error) {
            resetLoggedUserIntoStore();
            await onLogout();
            window.location.href = '/users/login';
            return;
        }

        setRequestingChangePassword(false);
        if (error.error === PasswordResetErrorsTokens.INVALID_CURRENT_PASSWORD) {
            return addNotification({
                type: 'danger',
                duration: 6000,
                title: getTranslation('Error. Try again'),
                message: getTranslation(error.message),
            });
        } else if (error.error === PasswordResetErrorsTokens.LIMIT_EXCEEDED) {
            return addNotification({
                type: 'danger',
                duration: 8000,
                title: getTranslation('Error. Try again in a few minutes'),
                message: getTranslation('The password was entered incorrectly 5 times. try again in 10 minutes'),
            });
        }

        return addNotification({
            type: 'danger',
            duration: 6000,
            title: getTranslation('Error'),
            message: getTranslation('Error. Please try again later or talk to your supervisor'),
        });
    };

    return (
        <form>
            <LabelWrapper
                label={getTranslation('Current password')}
                validate={{
                    touched: formik.touched,
                    errors: formik.errors,
                    fieldName: 'oldPassword',
                    isSubmitted: formik.submitCount > 1,
                }}
            >
                <InputSimple
                    type='password'
                    name='oldPassword'
                    autoFocus
                    onChange={(ev) => formik.setFieldValue('oldPassword', ev.target.value)}
                />
            </LabelWrapper>
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
                        value={formik.values.password}
                        autoComplete='new-password'
                        name='password'
                        onChange={(ev) => formik.setFieldValue('password', ev.target.value.trim())}
                    />
                </div>
            </LabelWrapper>
            <InfoErrorsPassword errors={getValidationSchema()} fieldName='password' value={formik.values.password} />
            <PrimaryButton
                loading={requestingChangePassword}
                onClick={() => formik.submitForm()}
                style={{ width: '100%', fontSize: '15px', margin: '15px 0 0 0' }}
            >
                {getTranslation('Change')}
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
        </form>
    );
};

export default i18n(ResetPasswordForm) as FC<ResetPasswordFormProps>;
