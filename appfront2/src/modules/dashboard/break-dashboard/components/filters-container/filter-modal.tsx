import { Button, Col, Form, Modal, Row, Select, Space, Tag } from 'antd';
import { useEffect, useMemo } from 'react';
import { UserRole } from '~/constants/user-roles';
import { useQueryString } from '~/hooks/use-query-string';
import { normalizeText } from '~/utils/normalize-text';
import { useBreaks } from '../../hooks/use-breaks';
import { useTeamList } from '../../hooks/use-team-list';
import { useUserList } from '../../hooks/use-user-list';
import type { BreakDashboardQueryString } from '../../interfaces';
import type { FilterFormValues, FilterModalProps } from './interfaces';

export const FilterModal = ({ isVisible, onClose }: FilterModalProps) => {
  const [form] = Form.useForm<FilterFormValues>();
  const { queryStringAsObj, updateQueryString } = useQueryString<BreakDashboardQueryString>();
  const { teamList, isFetchingTeamList, fetchTeamList } = useTeamList();
  const { userList, isLoadingUserList, fetchUserList } = useUserList();
  const { breaks, isFetchingBreaks, fetchBreaks } = useBreaks();

  const userOptions = useMemo(() => {
    if (!userList) {
      return [];
    }

    return userList
      .filter((user) => {
        return !user.roles.some((role) => role.role === UserRole.WORKSPACE_ADMIN);
      })
      .map((user) => {
        return { value: user._id, label: user.name };
      });
  }, [userList]);

  const teamOptions = useMemo(() => {
    if (!teamList) {
      return [];
    }

    return teamList.data.map((team) => {
      return { value: team._id, label: team.name };
    });
  }, [teamList]);

  const breakOptions = useMemo(() => {
    const opt = { value: -1, label: `Pausa automática`, name: `Pausa automática` };

    const filteredBreaks = breaks
      ? breaks.map((item) => {
          return {
            value: item.id,
            label: (
              <Space>
                <span>{`${item.name} - ${item.durationSeconds / 60} minutos`}</span>
                {!item.enabled && <Tag color='red'>Inativo</Tag>}
              </Space>
            ),
            name: item.name,
          };
        })
      : [];

    return [opt, ...filteredBreaks];
  }, [breaks]);

  const handleOk = () => {
    const values = form.getFieldsValue();
    updateQueryString({
      userId: values.userId,
      teamId: values.teamId,
      breakSettingId: values.breakSettingId,
    });
    onClose();
  };

  const handleClearFilters = () => {
    form.resetFields();
  };

  useEffect(() => {
    if (!isVisible) return;

    form.setFieldsValue({
      userId: queryStringAsObj.userId,
      teamId: queryStringAsObj.teamId,
      breakSettingId: queryStringAsObj.breakSettingId
        ? Number(queryStringAsObj.breakSettingId)
        : undefined,
    });
  }, [
    form,
    isVisible,
    queryStringAsObj.teamId,
    queryStringAsObj.userId,
    queryStringAsObj.breakSettingId,
  ]);

  useEffect(() => {
    fetchTeamList();
    fetchUserList();
    fetchBreaks();
  }, [fetchBreaks, fetchTeamList, fetchUserList]);

  return (
    <Modal
      title='Filtros'
      maskClosable={false}
      keyboard={false}
      closable={false}
      open={isVisible}
      footer={[
        <Button key='clear' onClick={handleClearFilters} style={{ float: 'left' }}>
          Limpar filtros
        </Button>,
        <Button key='cancel' onClick={onClose}>
          Cancelar
        </Button>,
        <Button key='submit' type='primary' onClick={handleOk}>
          Aplicar
        </Button>,
      ]}
    >
      <Form form={form} layout='vertical'>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name='teamId' label='Time'>
              <Select
                placeholder='Selecione um time'
                allowClear
                loading={isFetchingTeamList}
                options={teamOptions}
                showSearch
                autoClearSearchValue={false}
                filterOption={(search, option) => {
                  return Boolean(normalizeText(option?.label).includes(normalizeText(search)));
                }}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name='userId' label='Agente'>
              <Select
                placeholder='Selecione um agente'
                allowClear
                loading={isLoadingUserList}
                options={userOptions}
                showSearch
                autoClearSearchValue={false}
                filterOption={(search, option) => {
                  return Boolean(normalizeText(option?.label).includes(normalizeText(search)));
                }}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name='breakSettingId' label='Pausa'>
              <Select
                placeholder='Selecione uma pausa'
                allowClear
                loading={isFetchingBreaks}
                options={breakOptions}
                showSearch
                autoClearSearchValue={false}
                filterOption={(search, option) => {
                  return Boolean(normalizeText(option?.name).includes(normalizeText(search)));
                }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};
