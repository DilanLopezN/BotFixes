import { useTranslation } from 'react-i18next';
import { Button, Card, Flex, Input, notification, Popconfirm, Space } from 'antd';
import { useMemo, useState } from 'react';
import { localeKeys } from '~/i18n';
import type { ConversationObjective } from '~/interfaces/conversation-objective';
import { normalizeText } from '~/utils/normalize-text';
import { notifySuccess } from '~/utils/notify-success';
import { useEditConversationObjective } from '../../hooks/use-edit-conversation-objective';
import { useRemoveConversationObjectives } from '../../hooks/use-remove-conversation-objectives';
import { EditableTable } from '../editable-table';
import type { ObjectiveTableProps } from './interfaces';
import { useRestoreConversationObjectives } from '../../hooks/use-restore-conversation-objective';

export const ObjectiveTable = ({
  conversationObjectives,
  isLoading,
  fetchConversationObjective,
}: ObjectiveTableProps) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [searchInputValue, setSearchInputValue] = useState<string>('');
  const activeObjectives = conversationObjectives.filter((item) => !item.deletedAt);
  const {
    removeConversationObjectives: removeConversationObjective,
    isRemovingConversationObjective,
  } = useRemoveConversationObjectives();
  const { restoreObjective } = useRestoreConversationObjectives();
  const { editConversationObjective, isEditingConversationObjective } =
    useEditConversationObjective();

  const filteredDataSourceBySearchInput = useMemo(() => {
    const dataSource = conversationObjectives || [];

    if (!searchInputValue) {
      return dataSource;
    }

    return dataSource.filter((data) => {
      return normalizeText(data.name).includes(normalizeText(searchInputValue));
    });
  }, [conversationObjectives, searchInputValue]);

  const { t } = useTranslation();

  const objetiveTableLocaleKeys = localeKeys.settings.categorization.components.objetiveTable;

  const handleRemoveSelectedRows = async () => {
    const activeIds = activeObjectives.map((item) => item.id);
    const isAllActiveSelected = activeIds.every((id) => selectedRowKeys.includes(id));

    if (isAllActiveSelected) {
      return notification.warning({
        message: t(objetiveTableLocaleKeys.messageWarning),
        description: t(objetiveTableLocaleKeys.descriptionWarning),
        placement: 'topRight',
        duration: 0,
      });
    }
    const result = await removeConversationObjective(selectedRowKeys);

    if (result) {
      setSelectedRowKeys([]);
      notifySuccess({
        description: t(objetiveTableLocaleKeys.descriptionSuccess),
        message: t(objetiveTableLocaleKeys.messageSuccess),
      });
      await fetchConversationObjective();
    }
  };

  const handleEditRow = async (row: ConversationObjective) => {
    const result = await editConversationObjective(row.id, row.name);
    if (result) {
      notifySuccess({
        description: t(objetiveTableLocaleKeys.notifyEditObjective),
        message: t(objetiveTableLocaleKeys.messageSuccess),
      });
      await fetchConversationObjective();
    }
  };

  const handleRemoveRow = async (row: ConversationObjective) => {
    const result = await removeConversationObjective([row.id]);
    const newSelectedRowKeys = selectedRowKeys.filter((key) => key !== row.id);
    if (result) {
      setSelectedRowKeys(newSelectedRowKeys);
      notifySuccess({
        description: t(objetiveTableLocaleKeys.notifyRemoveObjective),
        message: t(objetiveTableLocaleKeys.messageSuccess),
      });
      await fetchConversationObjective();
    }
  };

  const handleRestoreRow = async (conversationObjectiveId: number) => {
    const result = await restoreObjective(conversationObjectiveId);
    if (result) {
      notifySuccess({
        description: t(objetiveTableLocaleKeys.notifyRestoreObjective),
        message: t(objetiveTableLocaleKeys.messageSuccess),
      });
      await fetchConversationObjective();
    }
  };

  const objectiveTableTitle = (
    <Flex justify='space-between'>
      <Space size='large'>
        <span>{t(objetiveTableLocaleKeys.objectiveTableTitle)}</span>
        <Input.Search
          value={searchInputValue}
          onChange={(event) => {
            setSearchInputValue(event.target.value);
          }}
          allowClear
          placeholder={t(objetiveTableLocaleKeys.searchInput)}
        />
      </Space>
      <Popconfirm
        title={t(objetiveTableLocaleKeys.popConfirmTitle)}
        okText={t(objetiveTableLocaleKeys.okTextDisable)}
        cancelText={t(objetiveTableLocaleKeys.cancelText)}
        placement='left'
        okButtonProps={{ danger: true }}
        disabled={
          selectedRowKeys.length === 0 ||
          isLoading ||
          isEditingConversationObjective ||
          isRemovingConversationObjective
        }
        onConfirm={handleRemoveSelectedRows}
      >
        <Button
          disabled={
            selectedRowKeys.length === 0 ||
            isLoading ||
            isEditingConversationObjective ||
            isRemovingConversationObjective
          }
        >
          {t(objetiveTableLocaleKeys.buttonDisable)}
        </Button>
      </Popconfirm>
    </Flex>
  );

  return (
    <Card title={objectiveTableTitle}>
      <EditableTable
        dataSource={filteredDataSourceBySearchInput}
        isLoading={isLoading || isEditingConversationObjective || isRemovingConversationObjective}
        selectedRowKeys={selectedRowKeys}
        setSelectedRowKeys={setSelectedRowKeys}
        onEditRow={handleEditRow}
        onRemoveRow={handleRemoveRow}
        onRestoreRow={handleRestoreRow}
      />
    </Card>
  );
};
