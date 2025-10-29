import { useTranslation } from 'react-i18next';
import {
  CheckCircleOutlined,
  EditOutlined,
  MinusCircleOutlined,
  PoweroffOutlined,
} from '@ant-design/icons';
import {
  Button,
  Flex,
  Form,
  notification,
  Popconfirm,
  Space,
  type TableProps,
  Tag,
  Tooltip,
} from 'antd';
import { useState } from 'react';
import { localeKeys } from '~/i18n';
import { EnhancedTable } from '~/components/enhanced-table';
import { ConversationObjective } from '~/interfaces/conversation-objective';
import { EditableCell } from './editable-cell';
import type { Columns, EditableTableProps } from './interfaces';
import { TableContainer } from './styles';

export const EditableTable = ({
  dataSource,
  isLoading,
  selectedRowKeys,
  setSelectedRowKeys,
  onEditRow,
  onRemoveRow,
  onRestoreRow,
}: EditableTableProps) => {
  const [form] = Form.useForm();
  const [selectedRowIdToEdit, setSelectedRowIdToEdit] = useState<number>();
  const activeObjectives = dataSource.filter((item) => !item.deletedAt);

  const handleEditRow = async (row: any) => {
    const rowValues = await form.validateFields();
    setSelectedRowIdToEdit(undefined);
    onEditRow({ ...row, ...rowValues });
  };

  const { t } = useTranslation();

  const editableTableLocaleKeys =
    localeKeys.settings.categorization.components.editableTable.editableTable;

  const handleRemoveRow = (row: any) => {
    if (activeObjectives.length <= 1) {
      return notification.warning({
        message: t(editableTableLocaleKeys.messageWarning),
        description: t(editableTableLocaleKeys.descriptionWarning),
        placement: 'topRight',
        duration: 0,
      });
    }
    onRemoveRow(row);
  };

  const columns: Columns = [
    {
      title: t(editableTableLocaleKeys.columnsID),
      dataIndex: 'id',
      key: 'id',
      width: 230,
      sorter: (a: any, b: any) => a.id - b.id,
      sortDirections: ['ascend', 'descend'],
      render: (id) => {
        return <span>{`#${id}`}</span>;
      },
    },
    {
      title: t(editableTableLocaleKeys.columnsName),
      dataIndex: 'name',
      key: 'name',
      editable: true,
      render: (_, row: ConversationObjective) => {
        const isDeletedAt = Boolean(row.deletedAt);
        if (isDeletedAt) {
          return (
            <Space size='middle'>
              <span>{row.name}</span>
              <Tag color='red'>Inativo</Tag>
            </Space>
          );
        }

        return <span>{row.name}</span>;
      },
    },
    {
      title: '',
      dataIndex: 'actions',
      key: 'actions',
      width: 140,
      align: 'right',
      fixed: 'right',
      render: (_, row: ConversationObjective) => {
        const isDeletedAt = Boolean(row.deletedAt);
        return (
          <Flex gap={8} justify='flex-end'>
            {selectedRowIdToEdit === row.id ? (
              <Tooltip title={t(editableTableLocaleKeys.confirmButton)}>
                <Button
                  disabled={isLoading}
                  icon={<CheckCircleOutlined />}
                  onClick={() => {
                    handleEditRow(row);
                  }}
                />
              </Tooltip>
            ) : (
              <Tooltip title={t(editableTableLocaleKeys.editButton)}>
                <Button
                  disabled={isLoading || isDeletedAt}
                  icon={<EditOutlined />}
                  onClick={() => {
                    setSelectedRowIdToEdit(row.id);
                  }}
                />
              </Tooltip>
            )}
            {isDeletedAt ? (
              <Popconfirm
                title={t(editableTableLocaleKeys.popConfirmTitleReactivate)}
                okText={t(editableTableLocaleKeys.okTextReactivate)}
                cancelText={t(editableTableLocaleKeys.cancelText)}
                placement='left'
                disabled={isLoading}
                onConfirm={() => {
                  onRestoreRow(row.id);
                }}
              >
                <Tooltip title={t(editableTableLocaleKeys.activateObjective)}>
                  <Button icon={<PoweroffOutlined />} disabled={isLoading} />
                </Tooltip>
              </Popconfirm>
            ) : (
              <Popconfirm
                title={t(editableTableLocaleKeys.popConfirmTitleDeactivate)}
                okText={t(editableTableLocaleKeys.okTextDisable)}
                cancelText={t(editableTableLocaleKeys.cancelText)}
                placement='left'
                okButtonProps={{ danger: true }}
                disabled={isLoading}
                onConfirm={() => handleRemoveRow(row)}
              >
                <Tooltip title={t(editableTableLocaleKeys.tooltipTitleDeactivate)}>
                  <Button icon={<MinusCircleOutlined />} disabled={isLoading} />
                </Tooltip>
              </Popconfirm>
            )}
          </Flex>
        );
      },
    },
  ];

  const components: TableProps['components'] = {
    body: {
      cell: EditableCell,
    },
  };

  const editableColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: any) => ({
        record,
        dataIndex: col.dataIndex,
        title: col.title as string,
        isEditing: record.id === selectedRowIdToEdit,
        onEditRow: handleEditRow,
      }),
    };
  });

  return (
    <Form form={form} component={false}>
      <TableContainer>
        <EnhancedTable
          rowKey={(row) => row.id}
          components={components}
          columns={editableColumns}
          dataSource={dataSource}
          loading={isLoading}
          scroll={{
            y: 'calc(100vh - 300px)',
          }}
          minHeight='400px'
          size='small'
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys,
            onChange: (newSelectedRowKeys) => {
              setSelectedRowKeys(newSelectedRowKeys as number[]);
            },
            preserveSelectedRowKeys: true,
            getCheckboxProps: (record: ConversationObjective) => ({
              disabled: Boolean(record.deletedAt),
            }),
          }}
        />
      </TableContainer>
    </Form>
  );
};
