import { CommentOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Button, Form, notification, Popconfirm, Space, Tag, Tooltip } from 'antd';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { EnhancedTable } from '~/components/enhanced-table';
import { CampaignStatus } from '~/constants/campaign-status';
import { localeKeys } from '~/i18n';
import { extractTemplateKeys } from '~/utils/extract-template-keys';
import { AppTypePort, getBaseUrl } from '~/utils/redirect-app';
import { BroadcastListFormValues } from '../../pages/create-broadcast-list/interfaces';
import { EditableCell } from './editable-cell';
import { EditableRow } from './editable-row';
import type { Columns, ContactTableProps } from './interfaces';
import { TableContainer } from './styles';

export const ContactTable = ({
  selectedTemplate,
  dataSource,
  filteredDataSource,
  selectedRowKeys,
  setDataSource,
  setSelectedRowKeys,
  canEdit,
  broadcastStatus,
  duplicatedPhones,
}: ContactTableProps) => {
  const form = Form.useFormInstance<BroadcastListFormValues>();
  const immediateStart = Form.useWatch('immediateStart', form);
  const { workspaceId } = useParams<{
    workspaceId: string;
  }>();

  const variables = useMemo(() => {
    return extractTemplateKeys(selectedTemplate?.message);
  }, [selectedTemplate?.message]);

  const handleSave = (row: any) => {
    const newData = [...dataSource];
    const rowId = row.id || row.newId;
    const index = newData.findIndex((item) => {
      const itemId = item.id || item.newId;
      return rowId === itemId;
    });
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row,
    });
    setDataSource(newData);
  };

  const handleRemoveRow = (selectedRow: any) => {
    const selectedRowId = selectedRow.id || selectedRow.newId;
    const newDataSource = dataSource.filter((row) => {
      const itemId = row.id || row.newId;
      return itemId !== selectedRowId;
    });
    const newSelectedRowKeys = selectedRowKeys.filter((key) => key !== selectedRowId);
    setDataSource(newDataSource);
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const { t } = useTranslation();

  const contactTableLocaleKeys =
    localeKeys.campaign.broadcastList.components.contactTable.contactTable;

  const isCreatingColumns: Columns =
    !canEdit && broadcastStatus !== CampaignStatus.running
      ? [
          {
            title: t(contactTableLocaleKeys.titleStatusBroadcast),
            dataIndex: 'sent',
            key: 'sent',
            width: 160,
            render: (_, row) => {
              if (row.sent) {
                return <Tag color='green'>{t(contactTableLocaleKeys.tagSend)}</Tag>;
              }

              return (
                <Tooltip
                  title={row.descriptionError || t(contactTableLocaleKeys.defaultSendingError)}
                >
                  <Tag
                    icon={<ExclamationCircleOutlined />}
                    color='error'
                    style={{ cursor: 'pointer' }}
                  >
                    {t(contactTableLocaleKeys.tagSubmissionFailed)}
                  </Tag>
                </Tooltip>
              );
            },
          },
        ]
      : [];

  const dynamicColumns: Columns =
    variables.map((variable) => {
      return {
        title: variable,
        dataIndex: variable,
        key: variable,
        width: 230,
        ellipsis: true,
        editable: true && canEdit,
      };
    }) || [];

  const dynamicButtons = (): Columns => {
    const btns: Columns = [];
    if (selectedTemplate?.buttons?.length) {
      selectedTemplate?.buttons.forEach((button, index) => {
        if (button?.url?.endsWith('{{1}}') && button.type === 'URL') {
          btns.push({
            title: `${button.type}_${index}`,
            dataIndex: `${button.type}_${index}`,
            key: `${button.type}_${index}`,
            width: 230,
            ellipsis: true,
            editable: true && canEdit,
          });
        }
      });
    }
    return btns;
  };

  const columns: Columns = [
    {
      title: t(contactTableLocaleKeys.titleColumnPhone),
      dataIndex: 'phone',
      key: 'phone',
      width: 230,
      ellipsis: true,
      editable: true && canEdit,
    },
    {
      title: t(contactTableLocaleKeys.titleColumnName),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      editable: true && canEdit,
    },
    ...isCreatingColumns,
    ...dynamicColumns,
    ...dynamicButtons(),
    {
      title: '',
      dataIndex: 'actions',
      key: 'actions',
      width: 70,
      align: 'right',
      fixed: 'right',
      render: (_, row) => {
        const liveAgentpath = getBaseUrl({
          pathname: '/live-agent',
          appTypePort: AppTypePort.APP,
          queryString: `?workspace=${workspaceId}&conversation=${row.conversationId}`,
          addExtraQueries: false,
        });

        return (
          <Space style={{ marginLeft: 'auto' }}>
            {canEdit && (
              <Popconfirm
                title={t(contactTableLocaleKeys.popConfirmDel)}
                okText={t(contactTableLocaleKeys.okTextYes)}
                cancelText={t(contactTableLocaleKeys.cancelTextNo)}
                placement='left'
                disabled={!canEdit}
                onConfirm={() => {
                  handleRemoveRow(row);
                }}
              >
                <Tooltip title={t(contactTableLocaleKeys.tooltipTitleDel)}>
                  <Button icon={<DeleteOutlined />} />
                </Tooltip>
              </Popconfirm>
            )}
            {!canEdit && row.conversationId && (
              <Tooltip title={t(contactTableLocaleKeys.tooltipTitleConversation)}>
                <a href={liveAgentpath} target='_blank' rel='noopener noreferrer'>
                  <Button icon={<CommentOutlined />} />
                </a>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

  useEffect(() => {
    if (duplicatedPhones.length > 0) {
      notification.error({
        key: 'duplicated-phone-notification',
        message: t(contactTableLocaleKeys.messageAlert),
        description: t(contactTableLocaleKeys.descriptionDuplicatePhone),
        duration: 0,
        placement: 'bottomRight',
      });
    }
  }, [
    contactTableLocaleKeys.descriptionDuplicatePhone,
    contactTableLocaleKeys.messageAlert,
    duplicatedPhones.length,
    t,
  ]);

  const getRowClassName = (row: any) => {
    if (!canEdit) {
      return '';
    }
    const rowKeys = Object.keys(row);
    const matchButtons = selectedTemplate?.buttons?.some((button, index) => {
      const constructedKey = `${button.type.toUpperCase()}_${index}`;
      return rowKeys.includes(constructedKey) && row[constructedKey] !== '';
    });

    const hasEmptyColumn =
      !row.name || !row.phone || variables.some((variable) => !row[variable]) || !matchButtons;

    if (duplicatedPhones.includes(String(row.phone))) {
      return 'editable-row-duplicate-phone';
    }
    if (hasEmptyColumn) {
      return 'editable-row-fail';
    }

    return 'editable-row';
  };

  const editableColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: any) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title as string,
        handleSave,
        hasDuplicatedPhone: duplicatedPhones.includes(String(record.phone)),
        immediateStart,
      }),
    };
  });

  return (
    <TableContainer>
      <EnhancedTable
        rowKey={(row) => row.id || row.newId}
        components={components}
        rowClassName={getRowClassName}
        columns={editableColumns}
        dataSource={filteredDataSource}
        scroll={{
          y: 'calc(100vh - 260px)',
        }}
        rowSelection={
          canEdit
            ? {
                type: 'checkbox',
                selectedRowKeys,
                onChange: (newSelectedRowKeys) => {
                  setSelectedRowKeys(newSelectedRowKeys as string[]);
                },
                preserveSelectedRowKeys: true,
              }
            : undefined
        }
      />
    </TableContainer>
  );
};
