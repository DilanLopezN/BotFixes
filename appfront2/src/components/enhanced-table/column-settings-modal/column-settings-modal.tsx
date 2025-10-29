import { Checkbox, Col, Modal, Row } from 'antd';
import type { CheckboxValueType } from 'antd/es/checkbox/Group';
import { useEffect } from 'react';
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

  const { columnSettingsModal: columnSettingsModalLocaleKeys } =
    localeKeys.components.enhancedTable;

  useEffect(() => {
    const columnsConfig = localStorage.getItem(localStorageKey);

    if (!columnsConfig) {
      const visibleColumns = columns
        .filter((column) => column.key !== 'actions')
        .map((column) => column.key) as CheckboxValueType[];
      localStorage.setItem(localStorageKey, JSON.stringify(visibleColumns));
      setCheckboxOptions(visibleColumns);
      return;
    }

    const parsedColumnsConfigs = JSON.parse(columnsConfig);
    setCheckboxOptions(parsedColumnsConfigs);
  }, [columns, isOpen, localStorageKey, setCheckboxOptions]);

  const handleCheck = (checkedValues: CheckboxValueType[]) => {
    if (checkedValues.length === 0) {
      return;
    }
    setCheckboxOptions(checkedValues);
  };

  const handleSaveConfigs = () => {
    localStorage.setItem(localStorageKey, JSON.stringify(checkboxOptions));
    onClose();
  };

  return (
    <Modal
      title={t(columnSettingsModalLocaleKeys.modalTitle)}
      open={isOpen}
      onOk={handleSaveConfigs}
      okText={t(columnSettingsModalLocaleKeys.saveButton)}
      onCancel={onClose}
      cancelText={t(columnSettingsModalLocaleKeys.cancelButton)}
    >
      <Checkbox.Group onChange={handleCheck} value={checkboxOptions}>
        <Row gutter={16}>
          {columns
            .filter((column) => column.key !== 'actions')
            .map((column) => {
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
