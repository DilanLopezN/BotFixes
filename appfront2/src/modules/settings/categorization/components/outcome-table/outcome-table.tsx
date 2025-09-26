import { useTranslation } from 'react-i18next';
import { Button, Card, Flex, Input, notification, Popconfirm, Space } from 'antd';
import { useMemo, useState } from 'react';
import { localeKeys } from '~/i18n';
import type { ConversationOutcome } from '~/interfaces/conversation-outcome';
import { normalizeText } from '~/utils/normalize-text';
import { notifySuccess } from '~/utils/notify-success';
import { useEditConversationOutcome } from '../../hooks/use-edit-conversation-outcome';
import { useRemoveConversationOutcomes } from '../../hooks/use-remove-conversation-outcomes';
import { useRestoreConversationOutcomes } from '../../hooks/use-restore-conversation-outcome';
import { EditableTable } from '../editable-table';
import type { OutcomeTableProps } from './interfaces';

export const OutcomeTable = ({
  conversationOutcomes,
  isLoading,
  fetchConversationOutcomes,
}: OutcomeTableProps) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [searchInputValue, setSearchInputValue] = useState<string>('');
  const activeObjectives = conversationOutcomes.filter((item) => !item.deletedAt);
  const { removeConversationOutcomes: removeConversationOutcome, isRemovingConversationOutcome } =
    useRemoveConversationOutcomes();
  const { editConversationOutcome, isEditingConversationOutcome } = useEditConversationOutcome();
  const { restoreOutcome } = useRestoreConversationOutcomes();
  const filteredDataSourceBySearchInput = useMemo(() => {
    const dataSource = conversationOutcomes || [];

    if (!searchInputValue) {
      return dataSource;
    }

    return dataSource.filter((data) => {
      return normalizeText(data.name).includes(normalizeText(searchInputValue));
    });
  }, [conversationOutcomes, searchInputValue]);

  const { t } = useTranslation();

  const outcomeTableLocaleKeys = localeKeys.settings.categorization.components.outcomeTable;

  const handleRemoveSelectedRows = async () => {
    const activeIds = activeObjectives.map((item) => item.id);
    const isAllActiveSelected = activeIds.every((id) => selectedRowKeys.includes(id));

    if (isAllActiveSelected) {
      return notification.warning({
        message: t(outcomeTableLocaleKeys.messageWarning),
        description: t(outcomeTableLocaleKeys.descriptionWarning),
        placement: 'topRight',
        duration: 0,
      });
    }
    const result = await removeConversationOutcome(selectedRowKeys);

    if (result) {
      setSelectedRowKeys([]);
      notifySuccess({
        description: t(outcomeTableLocaleKeys.notifyRemoveOutcome),
        message: t(outcomeTableLocaleKeys.messageSuccess),
      });
      await fetchConversationOutcomes();
    }
  };

  const handleEditRow = async (row: ConversationOutcome) => {
    const result = await editConversationOutcome(row.id, row.name);
    if (result) {
      notifySuccess({
        description: t(outcomeTableLocaleKeys.notifyEditOutcome),
        message: t(outcomeTableLocaleKeys.messageSuccess),
      });
      await fetchConversationOutcomes();
    }
  };

  const handleRemoveRow = async (row: ConversationOutcome) => {
    const result = await removeConversationOutcome([row.id]);
    const newSelectedRowKeys = selectedRowKeys.filter((key) => key !== row.id);
    if (result) {
      setSelectedRowKeys(newSelectedRowKeys);
      notifySuccess({
        description: t(outcomeTableLocaleKeys.descriptionRemoveOutcome),
        message: t(outcomeTableLocaleKeys.messageSuccess),
      });
      await fetchConversationOutcomes();
    }
  };

  const handleRestoreRow = async (conversationOutcomeId: number) => {
    const result = await restoreOutcome(conversationOutcomeId);
    if (result) {
      notifySuccess({
        description: t(outcomeTableLocaleKeys.notifyRestoreOutcome),
        message: t(outcomeTableLocaleKeys.messageSuccess),
      });
      await fetchConversationOutcomes();
    }
  };

  const OutcomeTableTitle = (
    <Flex justify='space-between'>
      <Space size='large'>
        <span>{t(outcomeTableLocaleKeys.outcomeTableTitle)}</span>
        <Input.Search
          value={searchInputValue}
          onChange={(event) => {
            setSearchInputValue(event.target.value);
          }}
          allowClear
          placeholder={t(outcomeTableLocaleKeys.searchInput)}
        />
      </Space>
      <Popconfirm
        title={t(outcomeTableLocaleKeys.popConfirmTitle)}
        okText={t(outcomeTableLocaleKeys.okTextDisable)}
        cancelText={t(outcomeTableLocaleKeys.cancelText)}
        placement='left'
        okButtonProps={{ danger: true }}
        disabled={
          selectedRowKeys.length === 0 ||
          isLoading ||
          isRemovingConversationOutcome ||
          isEditingConversationOutcome
        }
        onConfirm={handleRemoveSelectedRows}
      >
        <Button
          disabled={
            selectedRowKeys.length === 0 ||
            isLoading ||
            isEditingConversationOutcome ||
            isRemovingConversationOutcome
          }
        >
          {t(outcomeTableLocaleKeys.buttonDisable)}
        </Button>
      </Popconfirm>
    </Flex>
  );

  return (
    <Card title={OutcomeTableTitle}>
      <EditableTable
        dataSource={filteredDataSourceBySearchInput}
        isLoading={isLoading || isEditingConversationOutcome || isRemovingConversationOutcome}
        selectedRowKeys={selectedRowKeys}
        setSelectedRowKeys={setSelectedRowKeys}
        onEditRow={handleEditRow}
        onRemoveRow={handleRemoveRow}
        onRestoreRow={handleRestoreRow}
      />
    </Card>
  );
};
