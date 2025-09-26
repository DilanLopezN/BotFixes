import { Button, Card, Form, Input, message, Select, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { generatePath, Link, useNavigate, useParams } from 'react-router-dom';
import { PageTemplate } from '~/components/page-template';
import { localeKeys } from '~/i18n';
import { routes } from '~/routes';
import { useBotsList } from '../../hooks/use-bots-list';
import { useCreateTrainingEntry } from '../../hooks/use-create-training-entry';
import { TrainingFormValues } from '../../interfaces';
import { createNewFormId } from './constants';

const { TextArea } = Input;

export const CreateTrainer = () => {
  const { t } = useTranslation();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm<TrainingFormValues>();
  const { data, isLoading: isBotList } = useBotsList();
  const { createEntry, isLoading: isCreating } = useCreateTrainingEntry();

  const { children: trainingModules } = routes.modules.children.trainerBot;
  const { createTrainer: createTrainerLocaleKeys } = localeKeys.trainerBot.training.pages;

  const handleFormSubmit = async (values: TrainingFormValues) => {
    try {
      if (values.content.length > 1000) {
        message.error(t(createTrainerLocaleKeys.contentLengthError));
        return;
      }
      await createEntry(values);
      message.success(t(createTrainerLocaleKeys.successMessage));
      const trainingListPath = generatePath(trainingModules.training.fullPath, { workspaceId });
      navigate(trainingListPath);
    } catch (error) {
      message.error(t(createTrainerLocaleKeys.errorMessage));
    }
  };

  const renderActionButtons = () => {
    const createNewTrainingPath = generatePath(trainingModules.training.fullPath, { workspaceId });

    return (
      <Space>
        <Link to={createNewTrainingPath} replace>
          <Button disabled={isCreating || isBotList}>
            {t(createTrainerLocaleKeys.backButton)}
          </Button>
        </Link>
        <Button type='primary' form={createNewFormId} htmlType='submit' loading={isCreating}>
          {t(createTrainerLocaleKeys.createTrainingButton)}
        </Button>
      </Space>
    );
  };

  return (
    <PageTemplate
      title={t(localeKeys.trainerBot.sidebarMenu.configurationMenuGroup)}
      actionButtons={renderActionButtons()}
    >
      <Card title={t(createTrainerLocaleKeys.cardTitle)}>
        <Form<TrainingFormValues>
          form={form}
          layout='vertical'
          onFinish={handleFormSubmit}
          id={createNewFormId}
        >
          <Form.Item
            name='identifier'
            label={t(createTrainerLocaleKeys.identifierLabel)}
            rules={[
              {
                required: true,
                message: t(createTrainerLocaleKeys.requiredFieldMessage),
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name='content'
            label={t(createTrainerLocaleKeys.contentLabel)}
            rules={[
              {
                required: true,
                message: t(createTrainerLocaleKeys.requiredFieldMessage),
              },
            ]}
          >
            <TextArea
              rows={5}
              maxLength={1000}
              showCount
              placeholder={t(createTrainerLocaleKeys.contentPlaceholder)}
            />
          </Form.Item>
          <Form.Item name='botId' label={t(createTrainerLocaleKeys.botIdLabel)}>
            <Select
              allowClear
              loading={isBotList}
              placeholder={t(createTrainerLocaleKeys.botSelectPlaceholder)}
            >
              {data?.map((bot) => (
                <Select.Option key={bot._id} value={bot._id}>
                  {bot.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Card>
    </PageTemplate>
  );
};
