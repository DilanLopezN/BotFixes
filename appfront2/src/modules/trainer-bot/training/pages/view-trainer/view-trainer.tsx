import { Button, Card, Form, Input, message, Select, Space, Spin } from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link, useNavigate, useParams } from 'react-router-dom';
import { PageTemplate } from '~/components/page-template';
import { localeKeys } from '~/i18n';
import { Bot } from '~/interfaces/bot';
import { routes } from '~/routes';
import { useBotsList } from '../../hooks/use-bots-list';
import { useGetTrainingEntry } from '../../hooks/use-get-training-entry';
import { useUpdateTrainingEntry } from '../../hooks/use-update-training-entry';
import { TrainingFormValues } from '../../interfaces';
import { trainerFormId } from './constants';

const { TextArea } = Input;

export const ViewTrainer = () => {
  const { t } = useTranslation();
  const { workspaceId = '', trainerId = '' } = useParams<{
    workspaceId: string;
    trainerId: string;
  }>();
  const navigate = useNavigate();
  const [form] = Form.useForm<TrainingFormValues>();
  const { data: bots, isLoading: isLoadingBots } = useBotsList();
  const { updateEntry, isLoading: isUpdating } = useUpdateTrainingEntry();
  const { data: trainingData, isLoading: isLoadingTraining } = useGetTrainingEntry(trainerId);

  const { children: trainingModules } = routes.modules.children.trainerBot;
  const { viewTrainer: viewTrainerLocaleKeys } = localeKeys.trainerBot.training.pages;

  const handleFormSubmit = async (values: TrainingFormValues) => {
    try {
      if (values.content.length > 1000) {
        message.error(t(viewTrainerLocaleKeys.contentLengthError));
        return;
      }

      const updatedValues = {
        ...values,
        trainingEntryId: trainerId,
      };
      await updateEntry(updatedValues);
      message.success(t(viewTrainerLocaleKeys.successMessage));
      const trainingListPath = generatePath(trainingModules.training.fullPath, { workspaceId });
      navigate(trainingListPath);
    } catch (error) {
      message.error(t(viewTrainerLocaleKeys.errorMessage));
    }
  };

  useEffect(() => {
    if (trainingData) {
      form.setFieldsValue({
        identifier: trainingData.identifier,
        content: trainingData.content,
        botId: trainingData.botId,
      });
    }
  }, [trainingData, form]);

  const renderActionButtons = () => {
    const createNewTrainingPath = generatePath(trainingModules.training.fullPath, { workspaceId });

    return (
      <Space>
        <Link to={createNewTrainingPath} replace>
          <Button>{t(viewTrainerLocaleKeys.backToListButton)}</Button>
        </Link>
        <Button type='primary' form={trainerFormId} htmlType='submit' loading={isUpdating}>
          {t(viewTrainerLocaleKeys.saveButton)}
        </Button>
      </Space>
    );
  };

  return (
    <PageTemplate
      title={t(localeKeys.trainerBot.sidebarMenu.configurationMenuGroup)}
      actionButtons={renderActionButtons()}
    >
      <Card title={t(viewTrainerLocaleKeys.cardTitle)}>
        <Spin spinning={isLoadingTraining} tip={t(viewTrainerLocaleKeys.loadingTip)}>
          <Form<TrainingFormValues>
            id={trainerFormId}
            form={form}
            layout='vertical'
            onFinish={handleFormSubmit}
          >
            <Form.Item
              name='identifier'
              label={t(viewTrainerLocaleKeys.identifierLabel)}
              rules={[
                {
                  required: true,
                  message: t(viewTrainerLocaleKeys.requiredFieldMessage),
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name='content'
              label={t(viewTrainerLocaleKeys.contentLabel)}
              rules={[
                {
                  required: true,
                  message: t(viewTrainerLocaleKeys.requiredFieldMessage),
                },
              ]}
            >
              <TextArea
                rows={5}
                maxLength={1000}
                showCount
                placeholder={t(viewTrainerLocaleKeys.contentPlaceholder)}
              />
            </Form.Item>
            <Form.Item name='botId' label={t(viewTrainerLocaleKeys.botIdLabel)}>
              <Select
                allowClear
                loading={isLoadingBots}
                placeholder={t(viewTrainerLocaleKeys.botSelectPlaceholder)}
              >
                {bots?.map((bot: Bot) => (
                  <Select.Option key={bot._id} value={bot._id}>
                    {bot.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </PageTemplate>
  );
};
