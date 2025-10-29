import { InfoCircleOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, InputNumber, Space, Switch, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageTemplate } from '~/components/page-template';
import { localeKeys } from '~/i18n';
import { useCreateDistributionRule } from '../../hooks/use-create-distribution-rule';
import { useFetchDistributionRule } from '../../hooks/use-fetch-distribution-rule';
import { useUpdateDistributionRule } from '../../hooks/use-update-distribution-rule';

export const AutomaticDistributionConversation = () => {
  const { t } = useTranslation();
  const { createDistributionRule, isCreating } = useCreateDistributionRule();
  const { updateDistributionRule, isUpdating } = useUpdateDistributionRule();

  const [form] = Form.useForm();
  const [active, setActive] = useState(false);
  const { data: existingRule, refetch } = useFetchDistributionRule();
  const automaticDistributionListLocaleKeys =
    localeKeys.settings.automaticDistribution.pages.automaticDistributionList;

  const handleActiveChange = async (newActive: boolean) => {
    setActive(newActive);

    if (existingRule) {
      await updateDistributionRule(existingRule.id, {
        active: newActive,
        maxConversationsPerAgent: existingRule.maxConversationsPerAgent,
        checkUserWasOnConversation: existingRule.checkUserWasOnConversation,
        checkTeamWorkingTimeConversation: existingRule.checkTeamWorkingTimeConversation,
      });
      refetch();
    } else if (newActive) {
      const result = await createDistributionRule({
        active: newActive,
        maxConversationsPerAgent: 10,
        checkUserWasOnConversation: false,
        checkTeamWorkingTimeConversation: false,
      });
      if (result) {
        refetch();
      }
    }
  };

  const pageTitle = (
    <Space align='center'>
      <span>{t(automaticDistributionListLocaleKeys.pageTitle)}</span>
      <Switch checked={active} onChange={handleActiveChange} />
      {!active && <Alert message={t(automaticDistributionListLocaleKeys.alertMessage)} />}
      <Tooltip title='Navegar para o artigo'>
        <Link
          to='https://botdesigner.freshdesk.com/support/solutions/articles/69000872739-configurar-a-distribui%C3%A7%C3%A3o-autom%C3%A1tica-de-atendimentos'
          target='_blank'
        >
          <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 16, cursor: 'pointer' }} />
        </Link>
      </Tooltip>
    </Space>
  );

  const handleSubmit = async (values: {
    maxConversationsPerAgent: number;
    checkUserWasOnConversation?: boolean;
    checkTeamWorkingTimeConversation?: boolean;
  }) => {
    let result;
    const maxConversations = values.maxConversationsPerAgent || 10;

    if (existingRule) {
      result = await updateDistributionRule(existingRule.id, {
        active,
        maxConversationsPerAgent: maxConversations,
        checkUserWasOnConversation: values.checkUserWasOnConversation,
        checkTeamWorkingTimeConversation: values.checkTeamWorkingTimeConversation,
      });
    } else {
      result = await createDistributionRule({
        active,
        maxConversationsPerAgent: maxConversations,
        checkUserWasOnConversation: values.checkUserWasOnConversation,
        checkTeamWorkingTimeConversation: values.checkTeamWorkingTimeConversation,
      });
    }

    if (result) {
      refetch();
    }
  };

  useEffect(() => {
    if (existingRule) {
      form.setFieldsValue({
        maxConversationsPerAgent: existingRule.maxConversationsPerAgent,
        checkUserWasOnConversation: existingRule.checkUserWasOnConversation || false,
        checkTeamWorkingTimeConversation: existingRule.checkTeamWorkingTimeConversation || false,
      });
      setActive(existingRule.active);
    } else {
      form.setFieldsValue({
        maxConversationsPerAgent: 10,
        checkUserWasOnConversation: false,
        checkTeamWorkingTimeConversation: false,
      });
      setActive(false);
    }
  }, [existingRule, form]);

  return (
    <PageTemplate
      title={pageTitle}
      actionButtons={
        <Button
          type='primary'
          form='automatic-distribution'
          htmlType='submit'
          disabled={isCreating || isUpdating}
        >
          {t(automaticDistributionListLocaleKeys.saveButton)}
        </Button>
      }
    >
      <Card title={t(automaticDistributionListLocaleKeys.subTitle)}>
        <Form form={form} onFinish={handleSubmit} layout='vertical' id='automatic-distribution'>
          <Form.Item
            label={t(automaticDistributionListLocaleKeys.inputMaxConversation)}
            name='maxConversationsPerAgent'
            rules={[
              { required: true, message: t(automaticDistributionListLocaleKeys.validationMessage) },
            ]}
            tooltip={{
              title: t(automaticDistributionListLocaleKeys.infoTooltipMaxConversation),
              icon: <InfoCircleOutlined style={{ color: '#1677ff', fontSize: 14 }} />,
            }}
          >
            <InputNumber min={1} />
          </Form.Item>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Form.Item
              name='checkUserWasOnConversation'
              valuePropName='checked'
              style={{ margin: 0 }}
            >
              <Switch size='small' />
            </Form.Item>
            <span>{t(automaticDistributionListLocaleKeys.checkUserWasOnConversation)}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Form.Item
              name='checkTeamWorkingTimeConversation'
              valuePropName='checked'
              style={{ margin: 0 }}
            >
              <Switch size='small' />
            </Form.Item>
            <span>{t(automaticDistributionListLocaleKeys.checkTeamWorkingTimeConversation)}</span>
          </div>
        </Form>
      </Card>
    </PageTemplate>
  );
};
