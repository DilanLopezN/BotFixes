import { Alert, Form, Input, Modal, Typography } from 'antd';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import { notifyError } from '~/utils/notify-error';
import { notifySuccess } from '~/utils/notify-success';
import { ModalUpdateUserFormValues, UserUpdatePasswordModalProps } from './interfaces';
import { StyledSpace } from './styles';
import { useUpateUserPassword } from './use-update-user-password/use-update-user-password';

const { Text } = Typography;

export const UserUpdatePasswordModal = (props: UserUpdatePasswordModalProps) => {
  const { visible, onClose, userData } = props;
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const { updatePassword, isUpdating } = useUpateUserPassword();
  const { userUpdatePassword } = localeKeys.settings.users.userUpdater;
  const passwordExpirationDate = dayjs(userData?.passwordExpires);
  const currentDateTime = dayjs();
  const daysUntilExpiration = passwordExpirationDate.diff(currentDateTime, 'day');
  const expiredPassword = daysUntilExpiration < 0;
  const formattedExpirationDate = passwordExpirationDate.format(
    'MMMM [de] YYYY [às] HH:mm [horas]'
  );
  const warningMessage = expiredPassword
    ? t(userUpdatePassword.passwordExpiredMessage)
    : `${t(userUpdatePassword.passwordExpiryIn)} ${formattedExpirationDate}`;
  const alertType = expiredPassword ? 'error' : 'info';

  const handleClose = () => {
    if (isUpdating) return;

    onClose();
    form.resetFields();
  };

  const handleSubmit = async (values: ModalUpdateUserFormValues) => {
    try {
      await updatePassword(values);
      notifySuccess({
        message: t(userUpdatePassword.success),
        description: t(userUpdatePassword.successUpdatePassword),
      });
      handleClose();
    } catch (err) {
      notifyError(err);
    }
  };

  return (
    <Modal
      maskClosable={false}
      keyboard={false}
      open={visible}
      title={t(userUpdatePassword.passwordExpiryWarning)}
      onCancel={handleClose}
      okText={t(userUpdatePassword.save)}
      cancelText={t(userUpdatePassword.cancel)}
      okButtonProps={{
        htmlType: 'submit',
        form: 'update-user-form',
        loading: isUpdating,
      }}
      cancelButtonProps={{
        disabled: isUpdating,
      }}
    >
      <Form
        id='update-user-form'
        layout='vertical'
        form={form}
        onFinish={handleSubmit}
        initialValues={{
          password: undefined,
          passwordConfirmation: undefined,
        }}
      >
        <StyledSpace direction='vertical' size='small'>
          <Alert message={warningMessage} type={alertType} showIcon />
          <Text type='secondary'>{t(userUpdatePassword.passwordChangeEvery60Days)}</Text>
        </StyledSpace>
        <Form.Item
          hasFeedback
          name='password'
          label={t(userUpdatePassword.newPassword)}
          rules={[
            { required: true, message: t(userUpdatePassword.passwordPlaceholder) },
            { min: 8, message: t(userUpdatePassword.passwordMinLength) },
            { max: 20, message: t(userUpdatePassword.passwordMaxLength) },
            { pattern: /[@#$%^&*()_+!]/, message: t(userUpdatePassword.passwordSpecialCharacters) },
          ]}
        >
          <Input.Password placeholder={t(userUpdatePassword.enterPassword)} />
        </Form.Item>
        <Form.Item
          hasFeedback
          name='passwordConfirmation'
          label={t(userUpdatePassword.confirmPassword)}
          dependencies={['password']}
          rules={[
            {
              required: true,
              message: t(userUpdatePassword.confirmPasswordPrompt),
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(t(userUpdatePassword.passwordsDoNotMatch)));
              },
            }),
          ]}
        >
          <Input.Password placeholder={t(userUpdatePassword.repeatPassword)} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
