import { EllipsisOutlined } from '@ant-design/icons';
import { Button, Card, Dropdown, MenuProps, message, Modal, Space, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link, useParams } from 'react-router-dom';
import { EnhancedTable } from '~/components/enhanced-table';
import { PageTemplate } from '~/components/page-template';
import { localeKeys } from '~/i18n';
import { TrainingEntry } from '~/interfaces/training-entry';
import { routes } from '~/routes';
import { TrainingButton } from '../../components/trainings-button';
import { useBotsList } from '../../hooks/use-bots-list';
import { useDeleteTrainingEntry } from '../../hooks/use-delete-training-entry';
import { useTrainingEntries } from '../../hooks/use-training-entries';

export const TrainingList = () => {
  const { t } = useTranslation();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { data, isLoading } = useBotsList();
  const { trainings, isLoading: isLoadingTrainings } = useTrainingEntries();
  const [trainingList, setTrainingList] = useState<TrainingEntry[]>([]);

  const trainerBotListLocaleKeys = localeKeys.trainerBot.sidebarMenu;
  const { trainingList: trainingListLocaleKeys } = localeKeys.trainerBot.training.pages;
  const { children: trainingModules } = routes.modules.children.trainerBot.children.training;
  const createNewTeamPath = generatePath(trainingModules.createNewTrainer.fullPath, {
    workspaceId,
  });

  const { deleteEntry, isLoading: isDeleting } = useDeleteTrainingEntry();

  const renderBotName = (botId: string | null) => {
    if (!botId || isLoading) return '-';

    const botName = data.find((bot) => bot._id === botId);
    return botName ? botName.name : '-';
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: t(trainingListLocaleKeys.confirmDeleteTitle),
      onOk: async () => {
        try {
          await deleteEntry({ trainingEntryId: id });
          setTrainingList((prev) => prev.filter((item) => item.id !== id));
          message.success(t(trainingListLocaleKeys.successDeleteMessage));
        } catch (err) {
          message.error(t(trainingListLocaleKeys.errorDeleteMessage));
        }
      },
    });
  };

  useEffect(() => {
    if (trainings) {
      setTrainingList(trainings);
    }
  }, [trainings]);

  const actionButtons = (
    <Space>
      <Link to={createNewTeamPath}>
        <Button type='primary'>{t(trainingListLocaleKeys.createTrainingButton)}</Button>
      </Link>
    </Space>
  );

  const columns: ColumnsType<TrainingEntry> = [
    {
      title: t(trainingListLocaleKeys.botColumnTitle),
      dataIndex: 'botId',
      key: 'botId',
      width: 150,
      render: renderBotName,
    },
    {
      title: t(trainingListLocaleKeys.identifierColumnTitle),
      dataIndex: 'identifier',
      key: 'identifier',
      width: 200,
    },
    {
      title: t(trainingListLocaleKeys.contentColumnTitle),
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (text: string) => (
        <Typography.Paragraph ellipsis={{ rows: 3, expandable: false }}>
          {text}
        </Typography.Paragraph>
      ),
    },
    {
      title: t(trainingListLocaleKeys.lastTrainingColumnTitle),
      dataIndex: 'executedTrainingAt',
      key: 'executedTrainingAt',
      width: 150,
      render: (val: string | null) => val || '-',
    },

    {
      title: '',
      width: 80,
      render: (_: any, training: TrainingEntry) => {
        const editTrainingPath = generatePath(trainingModules.viewTrainer.fullPath, {
          workspaceId,
          trainerId: training.id,
        });

        const items: MenuProps['items'] = [
          {
            key: 'edit',
            label: <Link to={editTrainingPath}>{t(trainingListLocaleKeys.editOption)}</Link>,
          },
          {
            key: 'deactivate',
            label: t(trainingListLocaleKeys.deactivateOption),
            danger: true,
            onClick: () => handleDelete(training.id),
          },
        ];

        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <Button icon={<EllipsisOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <PageTemplate
      title={t(trainerBotListLocaleKeys.configurationMenuGroup)}
      actionButtons={actionButtons}
    >
      <Card
        styles={{ body: { paddingBottom: 0 } }}
        extra={<TrainingButton trainings={trainingList} setTrainings={setTrainingList} />}
      >
        <EnhancedTable
          columns={columns}
          dataSource={trainingList}
          loading={isLoadingTrainings || isDeleting}
          bordered
        />
      </Card>
    </PageTemplate>
  );
};
