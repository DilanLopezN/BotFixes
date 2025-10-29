import { Checkbox, Col, Divider, Modal, Row } from 'antd';
import type { CheckboxGroupProps } from 'antd/es/checkbox';
import { isEmpty } from 'lodash';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import type { ColumnSettingsModalProps } from './interfaces';

export const ColumnSettingsModal = ({
  isOpen,
  onClose,
  checkboxOptions,
  setCheckboxOptions,
  columns,
  localStorageKey,
}: ColumnSettingsModalProps) => {
  const { t } = useTranslation();
  const savedConfigRef = useRef<React.Key[]>([]);

  const { columnSettingsModal: columnSettingsModalLocaleKeys } =
    localeKeys.components.enhancedTable;

  const filteredColumns = useMemo(() => {
    return columns.filter((column) => column.key !== 'actions');
  }, [columns]);

  const showSelectAll = filteredColumns.length >= 2;

  const checkboxValues = isEmpty(checkboxOptions)
    ? filteredColumns
        .map((column) => column.key)
        .filter((key): key is React.Key => key !== undefined)
    : checkboxOptions;

  const filteredColumnKeys = filteredColumns
    .map((column) => column.key)
    .filter((key): key is React.Key => key !== undefined);

  const allColumnsSelected =
    checkboxValues &&
    checkboxValues.length > 0 &&
    filteredColumnKeys.length > 0 &&
    filteredColumnKeys.every((key) => checkboxValues.includes(key));

  const someColumnsSelected = checkboxValues && checkboxValues.length > 0 && !allColumnsSelected;

  const handleCheck: CheckboxGroupProps['onChange'] = (checkedValues) => {
    if (checkedValues.length === 0) {
      return;
    }
    setCheckboxOptions(checkedValues);
  };

  const handleSaveConfigs = () => {
    localStorage.setItem(localStorageKey, JSON.stringify(checkboxOptions));
    onClose();
  };

  const handleCancel = () => {
    setCheckboxOptions(savedConfigRef.current);
    onClose();
  };

  const handleSelectAll = () => {
    if (allColumnsSelected) {
      const firstKey = filteredColumns[0]?.key;
      if (firstKey !== undefined) {
        setCheckboxOptions([firstKey]);
      }
    } else {
      const allKeys = filteredColumns
        .map((column) => column.key)
        .filter((key): key is React.Key => key !== undefined);
      setCheckboxOptions(allKeys);
    }
  };

  useEffect(() => {
    const columnsConfig = localStorage.getItem(localStorageKey);

    if (!columnsConfig) {
      const visibleColumns = filteredColumns.map((column) => column.key);
      localStorage.setItem(localStorageKey, JSON.stringify(visibleColumns));
      setCheckboxOptions(visibleColumns);
      return;
    }

    const parsedColumnsConfigs = JSON.parse(columnsConfig);
    setCheckboxOptions(parsedColumnsConfigs);
  }, [filteredColumns, localStorageKey, setCheckboxOptions]);

  useEffect(() => {
    if (isOpen) {
      const columnsConfig = localStorage.getItem(localStorageKey);
      if (columnsConfig) {
        savedConfigRef.current = JSON.parse(columnsConfig);
      }
    }
  }, [isOpen, localStorageKey]);

  return (
    <Modal
      title={t(columnSettingsModalLocaleKeys.modalTitle)}
      open={isOpen}
      onOk={handleSaveConfigs}
      okText={t(columnSettingsModalLocaleKeys.saveButton)}
      onCancel={handleCancel}
      cancelText={t(columnSettingsModalLocaleKeys.cancelButton)}
      styles={{
        body: { maxHeight: 600, overflowY: 'auto', paddingRight: 14 },
        content: {
          paddingRight: 2,
        },
        footer: { paddingRight: 14 },
      }}
    >
      {showSelectAll && (
        <>
          <Checkbox
            checked={allColumnsSelected}
            indeterminate={someColumnsSelected}
            onChange={handleSelectAll}
          >
            {t(columnSettingsModalLocaleKeys.selectAll)}
          </Checkbox>
          <Divider style={{ margin: '16px 0' }} />
        </>
      )}
      <Checkbox.Group onChange={handleCheck} value={checkboxValues}>
        <Row gutter={16}>
          {filteredColumns.map((column) => {
            const { title, key } = column;
            return (
              <Col span={24} key={key}>
                <Checkbox value={key}>{title as string}</Checkbox>
              </Col>
            );
          })}
        </Row>
      </Checkbox.Group>
    </Modal>
  );
};
