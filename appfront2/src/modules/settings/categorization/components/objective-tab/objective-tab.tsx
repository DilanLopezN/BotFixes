import { useTranslation } from 'react-i18next';
import { Button, Card, Col, Flex, Form, Input, Row, Spin, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import { hasOnlyWhitespaces } from '~/utils/antd-form-validators';
import { notifySuccess } from '~/utils/notify-success';
import { useConversationObjectives } from '../../hooks/use-conversation-objectives';
import { useCreateConversationObjective } from '../../hooks/use-create-conversation-objective';
import { ObjectiveTable } from '../objective-table';
import type { ObjectiveTabFormValues } from './interfaces';

export const ObjectiveTab = () => {
  const [form] = Form.useForm<ObjectiveTabFormValues>();
  const { createConversationObjective, isCreatingConversationObjective } =
    useCreateConversationObjective();
  const {
    conversationObjectives,
    isFetchingConversationObjectives: isFetchingConversationObjective,
    fetchConversationObjective,
  } = useConversationObjectives();

  const { t } = useTranslation();

  const objectiveTabLocaleKeys = localeKeys.settings.categorization.components.objectiveTab;

  const handleSubmit = async (values: ObjectiveTabFormValues) => {
    if (isCreatingConversationObjective) return;

    const removeSpaces = values.name.trim();
    const result = await createConversationObjective(removeSpaces);

    if (result) {
      form.setFieldsValue({ name: '' });
      notifySuccess({ description: 'Novo objetivo adicionado', message: 'Sucesso' });
      await fetchConversationObjective();
    }
  };

  return (
    <Spin spinning={isFetchingConversationObjective}>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card
                title={t(objectiveTabLocaleKeys.objectiveTitle)}
                extra={
                  <Tooltip title={t(objectiveTabLocaleKeys.tooltipTitleArticle)}>
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
                    <span>{t(objectiveTabLocaleKeys.spanMessageExplanation)}</span>
                  </Col>
                  <Col>
                    <span>{t(objectiveTabLocaleKeys.spanMessageExpExample)}</span>
                  </Col>
                  <Col span={24}>
                    <Form layout='vertical' onFinish={handleSubmit} form={form}>
                      <Flex vertical>
                        <Form.Item
                          name='name'
                          label={t(objectiveTabLocaleKeys.labelName)}
                          rules={[
                            {
                              required: true,
                              message: t(objectiveTabLocaleKeys.rulesMessage),
                            },
                            hasOnlyWhitespaces(t(objectiveTabLocaleKeys.hasOnlyWhitespaces)),
                          ]}
                        >
                          <Input />
                        </Form.Item>
                        <Button
                          type='primary'
                          htmlType='submit'
                          loading={isCreatingConversationObjective}
                          style={{ width: '100%' }}
                        >
                          {t(objectiveTabLocaleKeys.buttonAddNewObjective)}
                        </Button>
                      </Flex>
                    </Form>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col span={24}>
              <Card title={t(objectiveTabLocaleKeys.requiredFieldTitle)}>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <span>{t(objectiveTabLocaleKeys.spanMessageRequiredFiel)}</span>
                  </Col>
                  <Col>
                    <span>{t(objectiveTabLocaleKeys.spanMessageRequiredActivation)}</span>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Col>
        <Col span={16}>
          <ObjectiveTable
            conversationObjectives={conversationObjectives?.data || []}
            isLoading={isCreatingConversationObjective || isFetchingConversationObjective}
            fetchConversationObjective={fetchConversationObjective}
          />
        </Col>
      </Row>
    </Spin>
  );
};
