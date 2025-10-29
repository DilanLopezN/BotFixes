import { Card, Col, Form, Row, Select, Space, Tag } from 'antd';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import { useConversationObjectives } from '~/modules/dashboard/categorization-dashboard/hooks/use-conversation-objectives';
import { useConversationOutcomes } from '~/modules/dashboard/categorization-dashboard/hooks/use-conversation-outcomes';
import { normalizeText } from '~/utils/normalize-text';

export const RemiCategorizationSection = () => {
  const { t } = useTranslation();
  const { remiForm: remiKeys, categorizationSection: categorizationKeys } =
    localeKeys.settings.remi.components;
  const { conversationObjectives, isFetchingConversationObjectives } = useConversationObjectives();
  const { conversationOutcomes, isFetchingConversationOutcomes } = useConversationOutcomes();

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
          {objective.deletedAt && <Tag color='red'>{t(remiKeys.inactiveTag)}</Tag>}
        </Space>
      ),
    }));
  }, [conversationObjectives, remiKeys.inactiveTag, t]);

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
          {outcome.deletedAt && <Tag color='red'>{t(remiKeys.inactiveTag)}</Tag>}
        </Space>
      ),
    }));
  }, [conversationOutcomes, remiKeys.inactiveTag, t]);

  return (
    <Card title={t(categorizationKeys.title)} bordered={false}>
      <p style={{ marginTop: 0, marginBottom: 24 }}>{t(categorizationKeys.description)}</p>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name='objectiveId'
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const outcomeId = getFieldValue('outcomeId');
                  if (!value && outcomeId) {
                    return Promise.reject(new Error(t(remiKeys.requiredIfOtherPresent)));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
            label={t(categorizationKeys.objectiveLabel)}
          >
            <Select
              allowClear
              loading={isFetchingConversationObjectives}
              options={conversationObjectivesOptions}
              placeholder={t(categorizationKeys.objectivePlaceholder)}
              showSearch
              filterOption={(search, option) => {
                return Boolean(normalizeText(option?.name).includes(normalizeText(search)));
              }}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name='outcomeId'
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const objectiveId = getFieldValue('objectiveId');
                  if (!value && objectiveId) {
                    return Promise.reject(new Error(t(remiKeys.requiredIfOtherPresent)));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
            label={t(categorizationKeys.outcomeLabel)}
          >
            <Select
              allowClear
              loading={isFetchingConversationOutcomes}
              options={conversationOutcomeOptions}
              placeholder={t(categorizationKeys.outcomePlaceholder)}
              showSearch
              filterOption={(search, option) => {
                return Boolean(normalizeText(option?.name).includes(normalizeText(search)));
              }}
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
};
