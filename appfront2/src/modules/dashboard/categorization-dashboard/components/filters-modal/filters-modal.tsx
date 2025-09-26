import { useTranslation } from 'react-i18next';
import { Button, Col, Flex, Form, Modal, Row, Select, Space, Tag } from 'antd';
import type { ModalFooterRender } from 'antd/es/modal/interface';
import { useEffect, useMemo } from 'react';
import { localeKeys } from '~/i18n';
import { useQueryString } from '~/hooks/use-query-string';
import { normalizeText } from '~/utils/normalize-text';
import { useConversationObjectives } from '../../hooks/use-conversation-objectives';
import { useConversationOutcomes } from '../../hooks/use-conversation-outcomes';
import { useTags } from '../../hooks/use-tags';
import { useTeamList } from '../../hooks/use-team-list';
import { useUserList } from '../../hooks/use-user-list';
import type { FinishedConversationsDashboardQueryStrings } from '../../interfaces';
import type { FilterFormValues, FiltersModalProps } from './interfaces';

export const FiltersModal = ({ isVisible, onClose }: FiltersModalProps) => {
  const [form] = Form.useForm();
  const { conversationObjectives, isFetchingConversationObjectives } = useConversationObjectives();
  const { conversationOutcomes, isFetchingConversationOutcomes } = useConversationOutcomes();
  const { tags, isFetchingTags } = useTags();
  const { userList, isLoadingUserList } = useUserList();
  const { teamList, isFetchingTeamList } = useTeamList();
  const { queryStringAsObj, updateQueryString } =
    useQueryString<FinishedConversationsDashboardQueryStrings>();

  const userOptions = useMemo(() => {
    if (!userList) {
      return [];
    }

    return userList.map((user) => {
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

  const conversationOutcomeOptions = useMemo(() => {
    if (!conversationOutcomes) {
      return [];
    }

    return conversationOutcomes.data.map((outcome) => ({
      value: outcome.id,
      name: outcome.name,
      label: (
        <Space>
          <span>{outcome.name}</span>
          {outcome.deletedAt && <Tag color='red'>Inativo</Tag>}
        </Space>
      ),
    }));
  }, [conversationOutcomes]);

  const { t } = useTranslation();

  const filtersModalLocaleKeys =
    localeKeys.dashboard.categorizationDashboard.components.filtersModal;

  const conversationObjectivesOptions = useMemo(() => {
    if (!conversationObjectives) {
      return [];
    }

    return conversationObjectives.data.map((objective) => ({
      value: objective.id,
      name: objective.name,
      label: (
        <Space>
          <span>{objective.name}</span>
          {objective.deletedAt && <Tag color='red'>{t(filtersModalLocaleKeys.tagInactive)}</Tag>}
        </Space>
      ),
    }));
  }, [conversationObjectives, filtersModalLocaleKeys.tagInactive, t]);

  const tagOptions = useMemo(() => {
    if (!tags) {
      return [];
    }

    return tags.data.map((tag) => {
      return { value: tag.name, label: tag.name };
    });
  }, [tags]);

  const handleFinishConversation = (values: FilterFormValues) => {
    updateQueryString(values);
    onClose();
  };

  const handleResetFilters = () => {
    form.resetFields();
  };

  useEffect(() => {
    if (!form) return;

    const userIds = queryStringAsObj.userIds?.split(',');
    const teamIds = queryStringAsObj.teamIds?.split(',');
    const objectiveIds = queryStringAsObj.objectiveIds?.split(',').map(Number);
    const outcomeIds = queryStringAsObj.outcomeIds?.split(',').map(Number);
    const conversationTags = queryStringAsObj.conversationTags?.split(',');

    form.setFieldsValue({ userIds, teamIds, objectiveIds, outcomeIds, conversationTags });
  }, [
    form,
    queryStringAsObj.conversationTags,
    queryStringAsObj.objectiveIds,
    queryStringAsObj.outcomeIds,
    queryStringAsObj.teamIds,
    queryStringAsObj.userIds,
  ]);

  const renderModalFooter: ModalFooterRender = (_originNode, { OkBtn, CancelBtn }) => {
    return (
      <Flex justify='space-between'>
        <Button onClick={handleResetFilters}>{t(filtersModalLocaleKeys.buttonClean)}</Button>
        <Space>
          <CancelBtn />
          <OkBtn />
        </Space>
      </Flex>
    );
  };

  return (
    <Modal
      forceRender
      title={t(filtersModalLocaleKeys.modalTitle)}
      style={{ maxWidth: '490px' }}
      styles={{ body: { height: 360, overflow: 'hidden', overflowY: 'auto' } }}
      open={isVisible}
      maskClosable={false}
      keyboard={false}
      okButtonProps={{
        htmlType: 'submit',
        form: 'categorization-filter-form',
      }}
      okText={t(filtersModalLocaleKeys.okTextFilter)}
      cancelText={t(filtersModalLocaleKeys.cancelText)}
      onCancel={onClose}
      footer={renderModalFooter}
    >
      <Form
        onFinish={handleFinishConversation}
        layout='vertical'
        id='categorization-filter-form'
        form={form}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name='userIds' label={t(filtersModalLocaleKeys.labelAgent)}>
              <Select
                allowClear
                mode='multiple'
                loading={isLoadingUserList}
                options={userOptions}
                placeholder={t(filtersModalLocaleKeys.placeholderAgent)}
                showSearch
                autoClearSearchValue={false}
                filterOption={(search, option) => {
                  return Boolean(normalizeText(option?.label).includes(normalizeText(search)));
                }}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name='teamIds' label={t(filtersModalLocaleKeys.labelTimes)}>
              <Select
                allowClear
                mode='multiple'
                loading={isFetchingTeamList}
                options={teamOptions}
                placeholder={t(filtersModalLocaleKeys.placeholderTimes)}
                showSearch
                autoClearSearchValue={false}
                filterOption={(search, option) => {
                  return Boolean(normalizeText(option?.label).includes(normalizeText(search)));
                }}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name='objectiveIds' label={t(filtersModalLocaleKeys.labelObjective)}>
              <Select
                allowClear
                mode='multiple'
                loading={isFetchingConversationObjectives}
                options={conversationObjectivesOptions}
                placeholder={t(filtersModalLocaleKeys.placeholderObjective)}
                showSearch
                autoClearSearchValue={false}
                filterOption={(search, option) => {
                  return Boolean(normalizeText(option?.name).includes(normalizeText(search)));
                }}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name='outcomeIds' label={t(filtersModalLocaleKeys.labelOutcome)}>
              <Select
                allowClear
                mode='multiple'
                loading={isFetchingConversationOutcomes}
                options={conversationOutcomeOptions}
                placeholder={t(filtersModalLocaleKeys.placeholderOutcome)}
                showSearch
                autoClearSearchValue={false}
                filterOption={(search, option) => {
                  return Boolean(normalizeText(option?.name).includes(normalizeText(search)));
                }}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name='conversationTags' label={t(filtersModalLocaleKeys.labelTags)}>
              <Select
                allowClear
                mode='multiple'
                loading={isFetchingTags}
                options={tagOptions}
                placeholder={t(filtersModalLocaleKeys.placeholderTags)}
                showSearch
                autoClearSearchValue={false}
                filterOption={(search, option) => {
                  return Boolean(normalizeText(option?.label).includes(normalizeText(search)));
                }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};
