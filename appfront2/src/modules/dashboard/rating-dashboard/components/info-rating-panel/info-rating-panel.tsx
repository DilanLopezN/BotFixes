import { Card, Flex, Rate, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import { InfoRatingPanelProps, TableDataType } from './intercaes';

export const InfoRatingPanel = ({ rating, users, teams, onClose }: InfoRatingPanelProps) => {
  const { t } = useTranslation();
  const infoLocaleKeys = localeKeys.dashboard.ratingDashboard.components.infoRatingModal;

  const teamName = useMemo(() => {
    return teams?.find((team) => team._id === rating.teamId)?.name || 'N/A';
  }, [teams, rating.teamId]);

  const userName = useMemo(() => {
    return users?.find((user) => user._id === rating.closedBy)?.name || 'N/A';
  }, [users, rating.closedBy]);

  const formatTimestamp = (timestamp: string | number) => {
    if (!timestamp) return 'N/A';
    const ts = typeof timestamp === 'string' ? Number(timestamp) : timestamp;
    return dayjs(ts).format('DD/MM/YYYY [às] HH:mm');
  };

  const columns: ColumnsType<TableDataType> = [
    {
      title: 'Item',
      dataIndex: 'label',
      key: 'label',
      width: '40%',
      render: (text) => <Typography.Text strong>{text}</Typography.Text>,
    },
    {
      title: 'Valor',
      dataIndex: 'value',
      key: 'value',
    },
  ];

  const dataSource: TableDataType[] = [
    {
      key: '1',
      label: t(infoLocaleKeys.ratedAtLabel),
      value: formatTimestamp(rating.ratingAt),
    },
    {
      key: '2',
      label: t(infoLocaleKeys.conversationCreatedAtLabel),
      value: formatTimestamp(rating.createdAt),
    },
    {
      key: '3',
      label: t(infoLocaleKeys.teamLabel),
      value: teamName,
    },
    {
      key: '4',
      label: t(infoLocaleKeys.agentLabel),
      value: userName,
    },
  ];

  return (
    <Card style={{ marginBottom: 16 }}>
      <Flex vertical align='center' style={{ marginBottom: 24 }}>
        <Rate style={{ fontSize: 30 }} disabled value={rating.value} />
      </Flex>

      {rating.ratingFeedback && (
        <Typography.Paragraph style={{ marginBottom: 24 }}>
          <Typography.Text strong>{`${t(infoLocaleKeys.feedbackLabel)}: `}</Typography.Text>
          {rating.ratingFeedback}
        </Typography.Paragraph>
      )}

      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        showHeader={false}
        size='small'
        bordered
      />
    </Card>
  );
};
