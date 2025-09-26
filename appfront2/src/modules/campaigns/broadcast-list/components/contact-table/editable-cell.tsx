import { useTranslation } from 'react-i18next';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { Form, Input, Tooltip, type InputRef } from 'antd';
import { useContext, useEffect, useRef, useState } from 'react';
import { localeKeys } from '~/i18n';
import { NumberInput } from '~/components/number-input';
import { hasOnlyWhitespaces } from '~/utils/antd-form-validators';
import { EditableContext } from './editable-context';
import type { EditableCellProps } from './interfaces';

export const EditableCell = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  hasDuplicatedPhone,
  immediateStart,
  ...restProps
}: EditableCellProps) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<InputRef>(null);
  const form = useContext(EditableContext)!;

  const attribute = record ? record[dataIndex] : undefined;
  const isAttributeEmpty = !attribute || !String(record[dataIndex])?.trim();

  const rules =
    dataIndex === 'name' || dataIndex === 'phone'
      ? [{ required: true, message: '' }, hasOnlyWhitespaces('')]
      : undefined;

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({ [dataIndex]: record[dataIndex] });
  };

  const save = async () => {
    const values = await form.getFieldsValue();
    toggleEdit();
    handleSave({ ...record, ...values });
  };

  const { t } = useTranslation();

  const editableCellLocaleKeys =
    localeKeys.campaign.broadcastList.components.contactTable.editableCell;

  const renderIcon = () => {
    const shouldShowIconOnCell = Boolean(dataIndex);

    if (!shouldShowIconOnCell) {
      return null;
    }

    if (dataIndex === 'phone' && hasDuplicatedPhone) {
      return (
        <Tooltip title={t(editableCellLocaleKeys.titleDuplicatedPhone)}>
          <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
        </Tooltip>
      );
    }

    if (isAttributeEmpty) {
      return (
        <Tooltip title={t(editableCellLocaleKeys.titleAttributeEmpty)}>
          <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
        </Tooltip>
      );
    }

    return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
  };

  const getCellClassName = () => {
    const defaultClass = `editable-cell-value-wrap`;
    const requiredFieldClass =
      dataIndex === 'phone' || dataIndex === 'name' || immediateStart ? 'cell-required' : '';
    const emptyCellClass = isAttributeEmpty ? 'cell-is-empty' : '';
    const duplicatedPhoneClass =
      dataIndex === 'phone' && hasDuplicatedPhone ? 'cell-with-duplicated-phone' : '';

    const className = `${defaultClass} ${requiredFieldClass} ${emptyCellClass} ${duplicatedPhoneClass}`;

    return className;
  };

  let childNode = children;

  if (editable) {
    childNode = editing ? (
      <div style={{ display: 'flex', width: '100%', gap: 8 }}>
        {renderIcon()}
        <Form.Item style={{ margin: 0, width: '100%' }} name={dataIndex} rules={rules}>
          {dataIndex === 'phone' ? (
            <NumberInput
              ref={inputRef}
              onPressEnter={save}
              onBlur={save}
              style={{ width: '100%' }}
            />
          ) : (
            <Input ref={inputRef} onPressEnter={save} onBlur={save} style={{ width: '100%' }} />
          )}
        </Form.Item>
      </div>
    ) : (
      <div style={{ display: 'flex', width: '100%', gap: 8 }}>
        {renderIcon()}
        <div
          role='button'
          tabIndex={0}
          className={getCellClassName()}
          title={record[dataIndex]}
          style={{
            paddingInlineEnd: 24,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            wordBreak: 'keep-all',
            minHeight: 32,
            width: '100%',
          }}
          onClick={toggleEdit}
          onFocus={toggleEdit}
          onKeyDown={toggleEdit}
        >
          {children}
        </div>
      </div>
    );
  }

  return <td {...restProps}>{childNode}</td>;
};
