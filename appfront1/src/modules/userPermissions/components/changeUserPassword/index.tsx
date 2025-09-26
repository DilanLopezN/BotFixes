import { useFormik } from 'formik-latest';
import { FC } from 'react';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import i18n from '../../../i18n/components/i18n';
import { ChangeUserPasswordProps } from './props';
import * as Yup from 'yup';
import { LabelWrapper } from '../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { Modal } from '../../../../shared/Modal/Modal';
import { ModalPosition } from '../../../../shared/Modal/ModalProps';
import { ColorType } from '../../../../ui-kissbot-v2/theme';
import { ActionsArea, Content, PasswordInfo } from './styles';
import InputPassword from '../../../../shared/InputPassword/InputPassword';
import InfoErrorsPassword from '../../../../shared/InfoErrorsPassword';
import moment from 'moment';
import { WorkspaceUserService } from '../../../settings/service/WorkspaceUserService';
import { Button } from 'antd';
import PasswordExpire from '../password-expire';
interface IChangePasswordForm {
    password: '';
}

const ChangeUserPassword: FC<ChangeUserPasswordProps & I18nProps> = ({
    getTranslation,
    onClose,
    user,
    visible,
    workspaceId,
    addNotification,
    setUser,
}) => {
    const passwordExpired = (user?.passwordExpires ?? 0) < moment().valueOf();
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

    const formik = useFormik<IChangePasswordForm>({
        initialValues: {
            password: '',
        },
        validationSchema: getValidationSchema(),
        onSubmit: (values) => {
            changePassword(values.password);
        },
    });

    const changePassword = async (password: string) => {
        let error: any;
        await WorkspaceUserService.updatePassword(
            {
                password,
            },
            user._id as string,
            workspaceId,
            (err) => (error = err)
        );

        if (!!error) {
            if (error.error === 'INVALID_EQUAL_PASSWORD') {
                return addNotification({
                    type: 'warning',
                    duration: 3000,
                    title: getTranslation('Error. Try again'),
                    message: getTranslation(error.message),
                });
            } else if (error.error === 'MISSING_AUTHORIZATION') {
                return addNotification({
                    type: 'warning',
                    duration: 3000,
                    title: getTranslation('Error'),
                    message: getTranslation('Not enough permission to take action'),
                });
            }
            return addNotification({
                type: 'warning',
                duration: 3000,
                title: getTranslation('Error. Try again'),
                message: getTranslation('Error. Try again'),
            });
        }

        addNotification({
            title: getTranslation('Success'),
            message: getTranslation('User updated successfully'),
            type: 'success',
            duration: 3000,
        });
        return onClose();
    };

    return (
        <Modal
            width='390px'
            height='auto'
            className='confirmationModal'
            isOpened={visible}
            position={ModalPosition.center}
            onClickOutside={onClose}
        >
            <Content>
                <div style={{ margin: '10px 0 0 0', display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ margin: '5px 0 0 0' }}>
                        {!passwordExpired ? (
                            <PasswordInfo>
                                <div style={{ color: '#a7a6a6', fontSize: '13px' }}>
                                    {`${getTranslation('Password expires in')} ${moment(user.passwordExpires).format(
                                        `DD/MM [${getTranslation('at')}] HH:MM`
                                    )}`}
                                </div>
                            </PasswordInfo>
                        ) : (
                            <div style={{ margin: '0 0 15px 0' }}>
                                <div
                                    title={getTranslation('Password change will be requested on next login')}
                                    style={{ color: '#ce1e1e' }}
                                >
                                    {getTranslation('Expired password')}
                                </div>
                            </div>
                        )}
                    </div>
                    <PasswordExpire
                        workspaceId={workspaceId}
                        addNotification={addNotification}
                        user={user}
                        onUserUpdated={(user) => setUser(user)}
                    />
                </div>
                <LabelWrapper
                    label={getTranslation('New password')}
                    validate={{
                        touched: formik.touched,
                        errors: formik.errors,
                        fieldName: 'password',
                        isSubmitted: formik.submitCount > 1,
                    }}
                >
                    <InputPassword
                        value={formik.values.password}
                        name='password'
                        onChange={(ev) => formik.setFieldValue('password', ev.target.value.trim())}
                    />
                </LabelWrapper>
                <div style={{ margin: '10px 0' }}>
                    <InfoErrorsPassword
                        errors={getValidationSchema()}
                        fieldName='password'
                        value={formik.values.password}
                    />
                </div>
                <ActionsArea>
                    <Button className='antd-span-default-color' type='primary' ghost onClick={onClose}>
                        {getTranslation('Cancel')}
                    </Button>
                    <Button className='antd-span-default-color' type='primary' onClick={() => formik.handleSubmit()}>
                        {getTranslation('Change')}
                    </Button>
                </ActionsArea>
            </Content>
        </Modal>
    );
};

export default i18n(ChangeUserPassword) as FC<ChangeUserPasswordProps>;
