import {
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Avatar,
  Typography,
  List,
  Badge,
} from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { useForm } from 'antd/es/form/Form';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, Link, generatePath, useLocation } from 'react-router-dom';
import { PageTemplate } from '~/components/page-template';
import { UserRole } from '~/constants/user-roles';
import { useAuth } from '~/hooks/use-auth';
import { localeKeys } from '~/i18n';
import { routes } from '~/routes/constants';
import { notifyError } from '~/utils/notify-error';
import { notifySuccess } from '~/utils/notify-success';
import { isAnySystemAdmin, isWorkspaceAdmin } from '~/utils/permissions';
import { useSelectedWorkspace } from '../../../../hooks/use-selected-workspace';
import { BodyContainer } from '../styles';
import { UserUpdateFormProps, workspaceSubRolesList } from './interfaces';
import { useUserById } from './use-user-by-id';
import { useUserTeams } from './use-user-teams';
import { useUserUpdater } from './use-user-updater';
import { UserUpdatePasswordModal } from './user-update-password-modal/user-update-password-modal';

const { Option } = Select;

const CheckboxGroup = Checkbox.Group;

export const UserUpdateForm = () => {
  const [form] = useForm<UserUpdateFormProps>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { data, isLoading } = useUserById();
  const { data: userTeams, isLoading: isLoadingTeams } = useUserTeams();
  const { isUpdating, updateUser } = useUserUpdater();
  const [showUpdatePasswordModal, setShowUpdatePasswordModal] = useState(false);
  const [shouldSave, setShouldSave] = useState(false);
  const { settings } = routes.modules.children;
  const { path: settingsPath, children: settingsChildren } = settings;
  const { path: usersPath } = settingsChildren.users;
  const { userUpdater } = localeKeys.settings.users;
  const { userTeams: userTeamsTranslations } = userUpdater;
  const { featureFlag } = useSelectedWorkspace();
  const isDocumentUploadEnabled = Boolean(featureFlag?.enableUploadErpDocuments);

  const { user: currentUser } = useAuth();
  const location = useLocation();

  // Verifica se pode editar o email (apenas o próprio email pode ser editado)
  const canEditEmail = currentUser?.email === data?.email;

  const isWorkSpaceAdmin = currentUser ? isWorkspaceAdmin(currentUser, workspaceId) : false;

  const isAdmin = currentUser ? isAnySystemAdmin(currentUser) : false;

  // Verifica se está editando o próprio usuário
  const isEditingSelf = currentUser?.email === data?.email;

  // Pode editar permissões se for admin E não estiver editando a si mesmo
  const canEditPermissions = isAdmin || (isWorkSpaceAdmin && !isEditingSelf);

  const onFinish = async (values: UserUpdateFormProps) => {
    try {
      // Validação adicional no submit para o email
      if (values.email !== data?.email && !canEditEmail) {
        notifyError({
          message: 'Erro de Permissão',
          description: 'Você só pode editar o seu próprio email',
        });
        return;
      }

      if (shouldSave) {
        // Verifica se o email foi alterado
        const emailWasChanged = values.email !== data?.email;

        // Remove o email dos valores se for igual ao email atual
        const updatedValues = { ...values };
        if (!emailWasChanged) {
          delete updatedValues.email;
        }

        await updateUser(updatedValues);

        // Mostra mensagem específica se o email foi alterado
        if (emailWasChanged) {
          notifySuccess({
            message: 'Sucesso',
            description:
              'Para concluir a troca de e-mail, por gentileza, confirme a solicitação através do e-mail que foi enviado para você.',
          });
        } else {
          notifySuccess({
            message: 'Sucesso',
            description: 'Usuário editado com sucesso',
          });
        }
      }
      setShouldSave(false);
    } catch (err) {
      notifyError(err);
    }
  };

  const handleBackToList = () => {
    const state = location.state as { queryStrings?: string } | undefined;
    const queryString = state?.queryStrings;
    const path = `/${workspaceId}/${settingsPath}/${usersPath}`;
    navigate(path + queryString, { replace: true });
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
      erpUsername: data?.erpUsername,
      permission: workspaceRole?.role,
      subRoles: workspaceSubRoles?.map((role) => role.role) || [],
    });
  }, [data?.email, data?.name, data?.roles, form, workspaceId, data?.erpUsername, currentUser]);

  const actionsButton = (
    <Space>
      <Button onClick={handleBackToList} disabled={isUpdating}>
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
                <Col span={!isDocumentUploadEnabled ? 7 : 6}>
                  <Form.Item
                    label={t(userUpdater.email)}
                    name='email'
                    rules={[
                      {
                        required: true,
                        message: 'Email é obrigatório',
                      },
                      {
                        type: 'email',
                        message: 'Formato de email inválido',
                      },
                    ]}
                  >
                    <Input
                      type='email'
                      placeholder={t(userUpdater.email)}
                      onChange={() => setShouldSave(true)}
                      disabled={!canEditEmail}
                    />
                  </Form.Item>
                </Col>

                <Col span={6}>
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
                {isDocumentUploadEnabled && (
                  <Col span={6}>
                    <Form.Item
                      label={t(userUpdater.erpUsername)}
                      name='erpUsername'
                      rules={[
                        {
                          message: t(userUpdater.erpUsername),
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
                      <Input
                        placeholder={t(userUpdater.erpUsername)}
                        onChange={() => setShouldSave(true)}
                      />
                    </Form.Item>
                  </Col>
                )}
                <Col span={!isDocumentUploadEnabled ? 7 : 6}>
                  <Form.Item
                    label={t(userUpdater.permission)}
                    name='permission'
                    rules={[{ message: t(userUpdater.enterPermission) }]}
                  >
                    <Select
                      placeholder={t(userUpdater.selectPermission)}
                      disabled={!canEditPermissions}
                      onChange={() => setShouldSave(true)}
                    >
                      <Option value={UserRole.WORKSPACE_ADMIN}>{t(userUpdater.admin)}</Option>
                      <Option value={UserRole.WORKSPACE_AGENT}>{t(userUpdater.agent)}</Option>
                      <Option value={UserRole.WORKSPACE_INACTIVE}>{t(userUpdater.inactive)}</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item label={t(userUpdater.subRoles)} name='subRoles'>
                    <CheckboxGroup
                      disabled={!canEditPermissions}
                      onChange={() => setShouldSave(true)}
                    >
                      <Checkbox value={UserRole.DASHBOARD_ADMIN}>
                        {t(userUpdater.dashboard_admin)}
                      </Checkbox>
                    </CheckboxGroup>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>

          <Card
            title={
              <Space>
                <TeamOutlined />
                <span>{t(userTeamsTranslations.title)}</span>
                {userTeams && userTeams.length > 0 && (
                  <Badge count={userTeams.length} style={{ backgroundColor: '#52c41a' }} />
                )}
              </Space>
            }
            style={{ marginTop: 16 }}
            extra={
              <Link to={generatePath('/:workspaceId/settings/teams', { workspaceId })}>
                <Button size='small' type='primary' ghost>
                  {t(userTeamsTranslations.manageTeams)}
                </Button>
              </Link>
            }
          >
            <Spin spinning={isLoadingTeams}>
              {userTeams && userTeams.length > 0 ? (
                <List
                  dataSource={[...userTeams].sort((a, b) => {
                    const aInactive = Boolean(a.inactivatedAt || a.inactivedAt);
                    const bInactive = Boolean(b.inactivatedAt || b.inactivedAt);

                    if (aInactive === bInactive) return 0;
                    return aInactive ? 1 : -1;
                  })}
                  renderItem={(team, index) => {
                    const isInactive = Boolean(team.inactivatedAt || team.inactivedAt);
                    const statusColor = isInactive ? 'orange' : 'green';
                    const statusText = isInactive
                      ? t(userTeamsTranslations.inactiveTeam)
                      : t(userTeamsTranslations.activeTeam);

                    return (
                      <List.Item style={{ padding: '8px 0' }}>
                        <List.Item.Meta
                          avatar={
                            <Avatar
                              style={{
                                backgroundColor: '#1677ff',
                                color: 'white',
                                opacity: isInactive ? 0.7 : 1,
                              }}
                              icon={<TeamOutlined />}
                            />
                          }
                          title={
                            <Space align='center' style={{ width: '100%' }}>
                              <Typography.Text
                                strong
                                style={{
                                  fontSize: '14px',
                                  opacity: isInactive ? 0.7 : 1,
                                }}
                              >
                                {team.name}
                              </Typography.Text>
                              <Tag
                                color={statusColor}
                                style={{
                                  margin: 0,
                                  fontSize: '11px',
                                  padding: '2px 6px',
                                  lineHeight: '16px',
                                }}
                              >
                                {statusText}
                              </Tag>
                            </Space>
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
              ) : (
                !isLoadingTeams && (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
                    <TeamOutlined
                      style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.3 }}
                    />
                    <div>{t(userTeamsTranslations.noTeams)}</div>
                    <Typography.Text type='secondary' style={{ fontSize: '12px' }}>
                      {t(userTeamsTranslations.noTeamsHelp)}
                    </Typography.Text>
                  </div>
                )
              )}
            </Spin>
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
