import { Button, Col, Form, Modal, Row, Select, Space, Tag } from 'antd';
import { useEffect, useMemo } from 'react';
import { ConversationStatus } from '~/constants/conversation-status';
import { useChannelList } from '~/hooks/use-channel-list';
import { useConversationStatusList } from '~/hooks/use-conversation-status-list';
import { useQueryString } from '~/hooks/use-query-string';
import { normalizeText } from '~/utils/normalize-text';
import { useTags } from '../../hooks/use-tags';
import { useTeams } from '../../hooks/use-teams';
import { useUsers } from '../../hooks/use-users';
import type { AppointmentTableQueryString } from '../../interfaces';
import type { FilterFormValues, FilterModalProps } from './interfaces';

export const FilterModal = ({ isVisible, onClose }: FilterModalProps) => {
  const [form] = Form.useForm<FilterFormValues>();
  const { users, isFetchingUsers, fetchUsers } = useUsers();
  const { teams, isFetchingTeams, fetchTeams } = useTeams();
  const { tags, isFetchingTags, fetchTags } = useTags();
  const channelList = useChannelList();
  const conversationStatusList = useConversationStatusList();
  const { queryStringAsObj, updateQueryString } = useQueryString<AppointmentTableQueryString>();

  const userOptions = useMemo(() => {
    if (!users) {
      return [];
    }

    return users.data
      .map((user) => {
        const label = user.email ? (
          <span>{user.name}</span>
        ) : (
          <Space align='center'>
            <span>{user.name}</span>
            <Tag color='red'>Inativo</Tag>
          </Space>
        );

        return { value: user._id, label, text: user.name };
      })
      .sort((a, b) => a.text.toLowerCase().localeCompare(b.text.toLowerCase()));
  }, [users]);

  const teamOptions = useMemo(() => {
    if (!teams) {
      return [];
    }

    return teams.data
      .map((team) => {
        const label = !team.inactivedAt ? (
          <span>{team.name}</span>
        ) : (
          <Space align='center'>
            <span>{team.name}</span>
            <Tag color='red'>Inativo</Tag>
          </Space>
        );

        return { value: team._id, label, text: team.name };
      })
      .sort((a, b) => a.text.toLowerCase().localeCompare(b.text.toLowerCase()));
  }, [teams]);

  const tagsOptions = useMemo(() => {
    if (!tags) {
      return [];
    }

    return tags.data
      .map((tag) => {
        const label = !tag.inactive ? (
          <span>{tag.name}</span>
        ) : (
          <Space align='center'>
            <span>{tag.name}</span>
            <Tag color='red'>Inativo</Tag>
          </Space>
        );

        return { value: tag.name, label, text: tag.name };
      })
      .sort((a, b) => a.text.toLowerCase().localeCompare(b.text.toLowerCase()));
  }, [tags]);

  const channelOptions = channelList
    .map((channel) => {
      return { value: channel.key, label: channel.name, text: channel.name };
    })
    .sort((a, b) => a.text.toLowerCase().localeCompare(b.text.toLowerCase()));

  const conversationStatusOptions = conversationStatusList
    .map((conversationStatus) => {
      return {
        value: conversationStatus.key,
        label: conversationStatus.name,
        text: conversationStatus.name,
      };
    })
    .sort((a, b) => a.text.toLowerCase().localeCompare(b.text.toLowerCase()));

  const handleOk = () => {
    const values = form.getFieldsValue();
    updateQueryString({
      agentIds: values.agentIds,
      teamIds: values.teamIds,
      tags: values.tags,
      channelId: values.channelId,
      appointmentStatus: values.appointmentStatus,
    });
    onClose();
  };

  const handleClearFilters = () => {
    form.resetFields();
  };

  useEffect(() => {
    if (!isVisible) return;

    form.setFieldsValue({
      agentIds: queryStringAsObj.agentIds ? queryStringAsObj.agentIds.split(',') : undefined,
      teamIds: queryStringAsObj.teamIds ? queryStringAsObj.teamIds.split(',') : undefined,
      tags: queryStringAsObj.tags ? queryStringAsObj.tags.split(',') : undefined,
      channelId: queryStringAsObj.channelId,
      appointmentStatus: queryStringAsObj.appointmentStatus
        ? (queryStringAsObj.appointmentStatus.split(',') as ConversationStatus[])
        : undefined,
    });
  }, [
    form,
    isVisible,
    queryStringAsObj.agentIds,
    queryStringAsObj.appointmentStatus,
    queryStringAsObj.channelId,
    queryStringAsObj.tags,
    queryStringAsObj.teamIds,
  ]);

  useEffect(() => {
    if (!isVisible) return;

    fetchUsers();
    fetchTeams();
    fetchTags();
  }, [fetchTags, fetchTeams, fetchUsers, isVisible]);

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
            <Form.Item name='agentIds' label='Agentes'>
              <Select
                mode='multiple'
                placeholder='Selecione os agentes'
                allowClear
                loading={isFetchingUsers}
                options={userOptions}
                showSearch
                autoClearSearchValue={false}
                filterOption={(search, option) => {
                  return Boolean(normalizeText(option?.text).includes(normalizeText(search)));
                }}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name='teamIds' label='Times'>
              <Select
                mode='multiple'
                placeholder='Selecione os times'
                allowClear
                loading={isFetchingTeams}
                options={teamOptions}
                showSearch
                autoClearSearchValue={false}
                filterOption={(search, option) => {
                  return Boolean(normalizeText(option?.text).includes(normalizeText(search)));
                }}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name='tags' label='Etiquetas'>
              <Select
                mode='tags'
                autoClearSearchValue
                placeholder='Selecione as etiquetas'
                allowClear
                loading={isFetchingTags}
                options={tagsOptions}
                showSearch
                filterOption={(search, option) => {
                  return Boolean(normalizeText(option?.text).includes(normalizeText(search)));
                }}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name='channelId' label='Canal'>
              <Select
                placeholder='Selecione o canal'
                allowClear
                loading={false}
                options={channelOptions}
                showSearch
                autoClearSearchValue={false}
                filterOption={(search, option) => {
                  return Boolean(normalizeText(option?.text).includes(normalizeText(search)));
                }}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name='appointmentStatus' label='Status'>
              <Select
                mode='multiple'
                placeholder='Selecione os status'
                allowClear
                loading={false}
                options={conversationStatusOptions}
                showSearch
                autoClearSearchValue={false}
                filterOption={(search, option) => {
                  return Boolean(normalizeText(option?.text).includes(normalizeText(search)));
                }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};
