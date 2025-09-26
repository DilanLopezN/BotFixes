import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  DescriptionsProps,
  Form,
  Input,
  Row,
  Select,
  Space,
} from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { PageTemplate } from '~/components/page-template';
import { UserRoles } from '~/constants/user-roles';
import { useSelectedWorkspace } from '~/hooks/use-selected-workspace';
import { localeKeys } from '~/i18n';
import { routes } from '~/routes/constants';
import { notifyError } from '~/utils/notify-error';
import { notifySuccess } from '~/utils/notify-success';
import { BodyContainer } from '../styles';
import { useGetPlanUserByWorkspace } from '../use-get-plan-user-by-workspace';
import { UserExistanceVerificationType } from './constants';
import { UserCreateFormValues } from './interfaces';
import { StyledSpace } from './styles';
import { useCreateUser } from './use-create-user';
import { useGetUserByEmail } from './use-get-user-by-email';
import { useUpdateRole } from './use-update-role';

const { Option } = Select;

export const UserCreateForm = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const { featureFlag } = useSelectedWorkspace();
  const { messageUserLimit } = useGetPlanUserByWorkspace();
  const { isCreating, createNewUser } = useCreateUser();
  const { updateUserRole, isUpdating } = useUpdateRole();
  const { data: userByEmail, getUserByEmail } = useGetUserByEmail();
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { userManager } = localeKeys.settings.users;
  const [userExistanceVerification, setUserExistanceVerification] = useState(
    UserExistanceVerificationType.notExist
  );
  const { path: settingsPath, children: settingsChildren } = routes.modules.children.settings;
  const { path: usersPath } = settingsChildren.users;

  const selectedUser = userByEmail?.data[0];
  const isUserExistInAnotherWorkspace =
    userExistanceVerification === UserExistanceVerificationType.existInAnotherWorkspace;

  const handleBack = () => {
    const path = `/${workspaceId}/${settingsPath}/${usersPath}`;
    navigate(path);
  };

  const onFinish = async (values: UserCreateFormValues) => {
    try {
      if (userExistanceVerification === UserExistanceVerificationType.notExist) {
        await createNewUser(values);
      } else if (selectedUser) {
        await updateUserRole(selectedUser, values);
      }

      notifySuccess({
        message: t(userManager.success),
        description: t(userManager.addUserSuccess),
      });

      handleBack();
    } catch (err) {
      notifyError(t(userManager.userCanNotUpdate));
    }
  };

  const checkEmailAvailability = async (email: string) => {
    const paginatedUserByEmail = await getUserByEmail(email);

    if (paginatedUserByEmail) {
      const {
        data: [user],
      } = paginatedUserByEmail;

      if (user) {
        const { roles } = user;
        const isUserExistInSameRole = roles.some((role) => {
          return role.resourceId === workspaceId;
        });

        if (isUserExistInSameRole) {
          setUserExistanceVerification(UserExistanceVerificationType.existInSameWorkspace);
          return false;
        }

        form.setFieldsValue({
          name: user.name,
        });
        setUserExistanceVerification(UserExistanceVerificationType.existInAnotherWorkspace);
        return true;
      }
    }

    if (isUserExistInAnotherWorkspace) {
      form.setFieldsValue({
        name: '',
      });
    }
    setUserExistanceVerification(UserExistanceVerificationType.notExist);
    return true;
  };

  const actionsButton = (
    <Space>
      <Button onClick={handleBack}> {t(userManager.back)}</Button>
      <Button
        htmlType='submit'
        type='primary'
        form='create-user-form'
        loading={isCreating || isUpdating}
      >
        {t(userManager.save)}
      </Button>
    </Space>
  );

  const items: DescriptionsProps['items'] = [
    {
      key: '1',
      label: t(userManager.contractedQuantity),
      children: messageUserLimit.planUserLimit,
    },
    {
      key: '2',
      label: t(userManager.ActiveUsers),
      children: messageUserLimit.userCount,
    },
  ];

  return (
    <PageTemplate actionButtons={actionsButton} title={t(userManager.addUser)}>
      <BodyContainer>
        <Card title={t(userManager.profile)}>
          <StyledSpace size='small' direction='vertical'>
            {messageUserLimit.userCount >= Number(messageUserLimit.planUserLimit) &&
              featureFlag?.showMessageUserLimit && (
                <>
                  <Descriptions column={2} items={items} />
                  <Alert message={t(userManager.userLimitExceeded)} type='error' showIcon />
                </>
              )}
            {userExistanceVerification ===
              UserExistanceVerificationType.existInAnotherWorkspace && (
              <Alert message={t(userManager.errorInviteEmail)} type='warning' showIcon />
            )}
          </StyledSpace>
          <Form form={form} layout='vertical' id='create-user-form' onFinish={onFinish}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Form.Item
                  hasFeedback
                  label={t(userManager.email)}
                  name='email'
                  validateFirst
                  validateDebounce={500}
                  rules={[
                    { required: true, message: t(userManager.enterEmail) },
                    { type: 'email', message: t(userManager.enterEmailValid) },
                    {
                      validator: async (_, value) => {
                        const isEmailAvailable = await checkEmailAvailability(value);
                        if (!isEmailAvailable) {
                          throw Error(t(userManager.errorRepeatedEmail));
                        }
                      },
                    },
                  ]}
                >
                  <Input type='email' placeholder={t(userManager.placeholderEmail)} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={t(userManager.name)}
                  name='name'
                  rules={[
                    {
                      required: true,
                      message: t(userManager.enterName),
                    },
                    {
                      validator: (_, value) => {
                        const isWhitespace = !/\S/.test(value);
                        if (isWhitespace) {
                          return Promise.reject(t(userManager.errorWhitespaceName));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                  validateTrigger='onBlur'
                >
                  <Input
                    disabled={isUserExistInAnotherWorkspace}
                    placeholder={t(userManager.placeholderName)}
                  />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  label={t(userManager.permission)}
                  name='permission'
                  rules={[{ required: true, message: t(userManager.enterPermission) }]}
                >
                  <Select placeholder={t(userManager.placeholderPermission)}>
                    <Option value={UserRoles.WORKSPACE_ADMIN}>{t(userManager.admin)}</Option>
                    <Option value={UserRoles.WORKSPACE_AGENT}>{t(userManager.agent)}</Option>
                    <Option value={UserRoles.WORKSPACE_INACTIVE}>{t(userManager.inactive)}</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Form.Item
                  hasFeedback={!isUserExistInAnotherWorkspace}
                  name='password'
                  label={t(userManager.newPassword)}
                  rules={
                    !isUserExistInAnotherWorkspace
                      ? [
                          { required: true, message: t(userManager.enterNewPassword) },
                          { min: 8, message: t(userManager.passwordMinLength) },
                          { max: 20, message: t(userManager.passwordMaxLength) },
                          {
                            pattern: /[!@#$%^&*()?":{}|<>+]/,
                            message: t(userManager.passwordSpecialCharacters),
                          },
                        ]
                      : undefined
                  }
                >
                  <Input.Password
                    placeholder={t(userManager.placeholderPassword)}
                    disabled={isUserExistInAnotherWorkspace}
                    autoComplete='new-password'
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  hasFeedback={!isUserExistInAnotherWorkspace}
                  name='password-confirmation'
                  label={t(userManager.repeatPassword)}
                  dependencies={['password']}
                  rules={
                    !isUserExistInAnotherWorkspace
                      ? [
                          { required: true, message: t(userManager.placeholderRepeatPassword) },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              return !value || getFieldValue('password') === value
                                ? Promise.resolve()
                                : Promise.reject(t(userManager.passwordsDoNotMatch));
                            },
                          }),
                        ]
                      : undefined
                  }
                >
                  <Input.Password
                    placeholder={t(userManager.repeatPassword)}
                    disabled={isUserExistInAnotherWorkspace}
                    autoComplete='new-password'
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>
      </BodyContainer>
    </PageTemplate>
  );
};
