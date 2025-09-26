import { Button, Card, Checkbox, Col, Form, Input, Row, Select, Space, Spin } from 'antd';
import { useForm } from 'antd/es/form/Form';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { PageTemplate } from '~/components/page-template';
import { UserRoles } from '~/constants/user-roles';
import { localeKeys } from '~/i18n';
import { routes } from '~/routes/constants';
import { notifyError } from '~/utils/notify-error';
import { notifySuccess } from '~/utils/notify-success';
import { BodyContainer } from '../styles';
import { UserUpdateFormProps, workspaceSubRolesList } from './interfaces';
import { useUserById } from './use-user-by-id';
import { useUserUpdater } from './use-user-updater';
import { UserUpdatePasswordModal } from './user-update-password-modal/user-update-password-modal';

const { Option } = Select;

const CheckboxGroup = Checkbox.Group;

export const UserUpdateForm = () => {
  const [form] = useForm();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { data, isLoading } = useUserById();
  const { isUpdating, updateUser } = useUserUpdater();
  const [showUpdatePasswordModal, setShowUpdatePasswordModal] = useState(false);
  const [shouldSave, setShouldSave] = useState(false);
  const { settings } = routes.modules.children;
  const { path: settingsPath, children: settingsChildren } = settings;
  const { path: usersPath } = settingsChildren.users;
  const { userUpdater } = localeKeys.settings.users;

  const onFinish = async (values: UserUpdateFormProps) => {
    try {
      if (shouldSave) {
        await updateUser(values);
      }
      setShouldSave(false);
      notifySuccess({ message: 'Sucesso', description: 'Usuário editado com sucesso' });
    } catch (err) {
      notifyError(err);
    }
  };

  const handleCancel = () => {
    const path = `/${workspaceId}/${settingsPath}/${usersPath}`;
    navigate(path);
  };

  const handlePasswordByUser = () => {
    setShowUpdatePasswordModal(true);
  };

  useEffect(() => {
    const workspaceRole = data?.roles?.find((role) => role.resourceId === workspaceId);
    const workspaceSubRoles = data?.roles?.filter((role) => {
      if (Object.keys(workspaceSubRolesList).includes(role.role)) {
        return role.resourceId === workspaceId;
      }
      return false;
    });

    form.setFieldsValue({
      name: data?.name,
      email: data?.email,
      permission: workspaceRole?.role,
      subRoles: workspaceSubRoles?.map((role) => role.role) || [],
    });
  }, [data?.email, data?.name, data?.roles, form, workspaceId]);

  const actionsButton = (
    <Space>
      <Button onClick={handleCancel} disabled={isUpdating}>
        {t(userUpdater.back)}
      </Button>
      <Button onClick={handlePasswordByUser} disabled={isLoading || isUpdating}>
        {t(userUpdater.changePassword)}
      </Button>
      <Button
        disabled={isLoading || (!isLoading && !shouldSave)}
        htmlType='submit'
        type='primary'
        form='create-user-form'
        loading={isUpdating}
      >
        {t(userUpdater.save)}
      </Button>
    </Space>
  );

  return (
    <PageTemplate actionButtons={actionsButton} title={t(userUpdater.editUser)}>
      <Spin spinning={isLoading}>
        <BodyContainer>
          <Card title={t(userUpdater.profile)}>
            <Form form={form} layout='vertical' id='create-user-form' onFinish={onFinish}>
              <Row gutter={[16, 16]}>
                <Col span={7}>
                  <Form.Item label={t(userUpdater.email)} name='email'>
                    <Input disabled type='email' placeholder={t(userUpdater.email)} />
                  </Form.Item>
                </Col>
                <Col span={10}>
                  <Form.Item
                    label={t(userUpdater.name)}
                    name='name'
                    rules={[
                      {
                        message: t(userUpdater.enterName),
                      },
                      {
                        validator: (_, value) => {
                          const isWhitespace = !/\S/.test(value);
                          if (isWhitespace) {
                            return Promise.reject(t(userUpdater.errorWhitespaceName));
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input placeholder={t(userUpdater.name)} onChange={() => setShouldSave(true)} />
                  </Form.Item>
                </Col>
                <Col span={7}>
                  <Form.Item
                    label={t(userUpdater.permission)}
                    name='permission'
                    rules={[{ message: t(userUpdater.enterPermission) }]}
                  >
                    <Select
                      onChange={() => setShouldSave(true)}
                      placeholder={t(userUpdater.selectPermission)}
                    >
                      <Option value={UserRoles.WORKSPACE_ADMIN}>{t(userUpdater.admin)}</Option>
                      <Option value={UserRoles.WORKSPACE_AGENT}>{t(userUpdater.agent)}</Option>
                      <Option value={UserRoles.WORKSPACE_INACTIVE}>
                        {t(userUpdater.inactive)}
                      </Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item label={t(userUpdater.subRoles)} name='subRoles'>
                    <CheckboxGroup onChange={() => setShouldSave(true)}>
                      <Checkbox value={UserRoles.DASHBOARD_ADMIN}>
                        {t(userUpdater.dashboard_admin)}
                      </Checkbox>
                    </CheckboxGroup>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
        </BodyContainer>
      </Spin>
      <UserUpdatePasswordModal
        onClose={() => setShowUpdatePasswordModal(false)}
        visible={showUpdatePasswordModal}
        userData={data}
      />
    </PageTemplate>
  );
};
