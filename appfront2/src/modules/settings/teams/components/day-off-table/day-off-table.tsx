import { CopyOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Form, Popconfirm, Space, Typography } from 'antd';
import type { ColumnType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EnhancedTable } from '~/components/enhanced-table';
import { useWindowSize } from '~/hooks/use-window-size';
import { localeKeys } from '~/i18n';
import type { DayOff } from '~/interfaces/day-off';
import { CopyDayoffPopover } from '../copy-dayoff-popover';
import { DayOffModal } from '../day-off-modal';
import type { DayOffTableProps } from './interfaces';

export const DayOffTable = ({
  dayOffList,
  setDayOffList,
  isLoadingDayOffList,
  isTeamInactive,
}: DayOffTableProps) => {
  const { t } = useTranslation();
  const { dayOffTable } = localeKeys.settings.teams.components;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDayOff, setSelectedDayOff] = useState<DayOff>();
  const [selectedDayOffIndex, setSelectedDayOffIndex] = useState<number>();
  const { width } = useWindowSize();

  const handleCreateNewDayOff = () => {
    setIsModalVisible(true);
    setSelectedDayOff(undefined);
    setSelectedDayOffIndex(undefined);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedDayOff(undefined);
    setSelectedDayOffIndex(undefined);
  };

  const handleEditDayOff = (dayOff: DayOff, dayOffIndex: number) => {
    setIsModalVisible(true);
    setSelectedDayOff(dayOff);
    setSelectedDayOffIndex(dayOffIndex);
  };

  const handleDeleteDayOff = (dayOffIndex: number) => {
    setDayOffList((previousState) => {
      return previousState.filter((_, index) => index !== dayOffIndex);
    });
  };

  const columns: ColumnType<DayOff>[] = [
    {
      title: t(dayOffTable.name),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t(dayOffTable.period),
      dataIndex: 'period',
      key: 'period',
      width: 300,
      render: (_, dayOff) => {
        const formattedStartDate = dayjs(dayOff.start).format('DD/MM/YYYY HH:mm');
        const formattedEndDate = dayjs(dayOff.end).format('DD/MM/YYYY HH:mm');

        return (
          <span>
            {formattedStartDate} - {formattedEndDate}
          </span>
        );
      },
    },
    /* 
    TODO: Vai ser implementado quando o backend estiver pronto 
    {
      title: t(dayOffTable.createdAt),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (_, dayOff) => {
        return <span>{dayjs(dayOff.createdAt).format('DD/MM/YYYY HH:mm')}</span>;
      },
    },
    */
    {
      title: '',
      width: 340,
      key: 'action',
      align: 'right',
      render: (_, dayOff, index) => (
        <Space>
          <CopyDayoffPopover selectedDayoff={dayOff}>
            <Button icon={<CopyOutlined style={{ color: '#1677ff' }} />} disabled={isTeamInactive}>
              {t(dayOffTable.copy)}
            </Button>
          </CopyDayoffPopover>
          <Button
            disabled={isTeamInactive}
            onClick={(event) => {
              event.stopPropagation();
              handleEditDayOff(dayOff, index);
            }}
            icon={<EditOutlined style={{ color: '#faad14' }} />}
          >
            {t(dayOffTable.edit)}
          </Button>
          <Popconfirm
            title={t(dayOffTable.confirmDeleteTitle)}
            okText={t(dayOffTable.confirmDeleteOk)}
            cancelText={t(dayOffTable.confirmDeleteCancel)}
            onConfirm={() => {
              handleDeleteDayOff(index);
            }}
          >
            <Button
              disabled={isTeamInactive}
              onClick={(event) => {
                event.stopPropagation();
              }}
              icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />}
            >
              {t(dayOffTable.delete)}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Col span={24}>
        <Flex justify='space-between' align='center'>
          <Typography.Title style={{ margin: 0 }} level={5}>
            {t(dayOffTable.title)}
          </Typography.Title>
          <Button
            disabled={isTeamInactive}
            icon={<PlusOutlined style={{ color: '#52c41a' }} />}
            onClick={handleCreateNewDayOff}
          >
            {t(dayOffTable.addPeriod)}
          </Button>
        </Flex>
      </Col>
      <Col span={24}>
        <Col span={24}>
          <Form.Item>
            <EnhancedTable
              rowKey={(row) => JSON.stringify(row)}
              columns={columns}
              dataSource={dayOffList}
              loading={isLoadingDayOffList}
              scroll={{ y: 'calc(100vh - 705px)', x: width < 1400 ? 950 : undefined }}
              minHeight='300px'
            />
          </Form.Item>
        </Col>
      </Col>
      <DayOffModal
        isVisible={isModalVisible}
        selectedDayOff={selectedDayOff}
        selectedDayOffIndex={selectedDayOffIndex}
        setDayOffList={setDayOffList}
        onClose={handleCloseModal}
      />
    </>
  );
};
