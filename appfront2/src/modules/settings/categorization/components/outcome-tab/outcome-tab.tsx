import { useTranslation } from 'react-i18next';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Card, Col, Flex, Form, Input, Row, Spin, Tooltip } from 'antd';
import { Link } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import { hasOnlyWhitespaces } from '~/utils/antd-form-validators';
import { notifySuccess } from '~/utils/notify-success';
import { useConversationOutcomes } from '../../hooks/use-conversation-outcomes';
import { useCreateConversationOutcome } from '../../hooks/use-create-conversation-outcome';
import { OutcomeTable } from '../outcome-table';
import type { OutcomeTabFormValues } from './interfaces';

export const OutcomeTab = () => {
  const [form] = Form.useForm<OutcomeTabFormValues>();
  const { createConversationOutcome, isCreatingConversationOutcome } =
    useCreateConversationOutcome();
  const { conversationOutcomes, isFetchingConversationOutcomes, fetchConversationOutcomes } =
    useConversationOutcomes();

  const { t } = useTranslation();

  const outcomeTabLocaleKeys = localeKeys.settings.categorization.components.outcomeTab;

  const handleSubmit = async (values: OutcomeTabFormValues) => {
    if (isCreatingConversationOutcome) return;

    const removeSpaces = values.name.trim();
    const result = await createConversationOutcome(removeSpaces);

    if (result) {
      form.setFieldsValue({ name: '' });
      notifySuccess({
        description: t(outcomeTabLocaleKeys.notifySuccessOutcome),
        message: t(outcomeTabLocaleKeys.messageSuccess),
      });
      await fetchConversationOutcomes();
    }
  };

  return (
    <Spin spinning={isFetchingConversationOutcomes}>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card
                title={t(outcomeTabLocaleKeys.outcomeTitle)}
                extra={
                  <Tooltip title={t(outcomeTabLocaleKeys.tooltipTitleArticle)}>
                    <Link
                      to='https://botdesigner.tawk.help/article/categorizacao-de-atendimentos'
                      target='_blank'
                    >
                      <InfoCircleOutlined style={{ color: '#1677ff' }} />
                    </Link>
                  </Tooltip>
                }
              >
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <span>{t(outcomeTabLocaleKeys.spanMessageExplanationOutcome)}</span>
                  </Col>
                  <Col span={24}>
                    <span>{t(outcomeTabLocaleKeys.spanMessageExpExampleOutcome)}</span>
                  </Col>
                  <Col span={24}>
                    <Form layout='vertical' onFinish={handleSubmit} form={form}>
                      <Flex vertical>
                        <Form.Item
                          name='name'
                          label={t(outcomeTabLocaleKeys.labelName)}
                          rules={[
                            {
                              required: true,
                              message: t(outcomeTabLocaleKeys.rulesMessage),
                            },
                            hasOnlyWhitespaces(t(outcomeTabLocaleKeys.hasOnlyWhitespaces)),
                          ]}
                        >
                          <Input />
                        </Form.Item>
                        <Button
                          type='primary'
                          htmlType='submit'
                          loading={isCreatingConversationOutcome}
                        >
                          {t(outcomeTabLocaleKeys.buttonAddNewOutcome)}
                        </Button>
                      </Flex>
                    </Form>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col span={24}>
              <Card title={t(outcomeTabLocaleKeys.requiredFieldTitle)}>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <span>{t(outcomeTabLocaleKeys.spanMessageRequiredFiel)}</span>
                  </Col>
                  <Col>
                    <span>{t(outcomeTabLocaleKeys.spanMessageRequiredActivation)}</span>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Col>
        <Col span={16}>
          <OutcomeTable
            conversationOutcomes={conversationOutcomes?.data || []}
            fetchConversationOutcomes={fetchConversationOutcomes}
            isLoading={isCreatingConversationOutcome || isFetchingConversationOutcomes}
          />
        </Col>
      </Row>
    </Spin>
  );
};
