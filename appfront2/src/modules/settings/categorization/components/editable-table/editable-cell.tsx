import { useTranslation } from 'react-i18next';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Form, Input, Tooltip, type InputRef } from 'antd';
import { useEffect, useRef } from 'react';
import { localeKeys } from '~/i18n';
import { hasOnlyWhitespaces } from '~/utils/antd-form-validators';
import type { EditableCellProps } from './interfaces';

export const EditableCell = ({
  title,
  isEditing,
  children,
  dataIndex,
  record,
  onEditRow,
  ...restProps
}: EditableCellProps) => {
  const inputRef = useRef<InputRef>(null);
  const form = Form.useFormInstance();

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      form.setFieldsValue({ [dataIndex]: record[dataIndex] });
    }
  }, [dataIndex, form, isEditing, record]);

  const save = async () => {
    onEditRow(record);
  };

  const { t } = useTranslation();

  const editableCellLocaleKeys =
    localeKeys.settings.categorization.components.editableTable.editableCell;

  const renderIcon = () => {
    const shouldShowIconOnCell = Boolean(dataIndex);

    if (!shouldShowIconOnCell) {
      return null;
    }

    const attribute = record[dataIndex];

    if (!attribute || !String(record[dataIndex])?.trim()) {
      return (
        <Tooltip title={t(editableCellLocaleKeys.tooltipTitle)}>
          <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
        </Tooltip>
      );
    }

    return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
  };

  const childNode = isEditing ? (
    <div style={{ display: 'flex', width: '100%', gap: 8 }}>
      {renderIcon()}
      <Form.Item
        style={{ margin: 0, width: '100%' }}
        name={dataIndex}
        rules={[
          { required: true, message: t(editableCellLocaleKeys.rulesMessage) },
          hasOnlyWhitespaces(t(editableCellLocaleKeys.hasOnlyWhitespaces)),
        ]}
      >
        <Input ref={inputRef} onPressEnter={save} style={{ width: '100%' }} />
      </Form.Item>
    </div>
  ) : (
    <div style={{ display: 'flex', width: '100%', gap: 8, alignItems: 'center' }}>
      <div
        role='button'
        tabIndex={-1}
        className='editable-cell-value-wrap'
        title={record ? record[dataIndex] : undefined}
        style={{
          paddingInlineEnd: 24,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          wordBreak: 'keep-all',
          minHeight: 32,
          width: '100%',
        }}
      >
        {children}
      </div>
    </div>
  );

  return <td {...restProps}>{childNode}</td>;
};
