import { Table } from 'antd';
import type { CheckboxValueType } from 'antd/es/checkbox/Group';
import _ from 'lodash';
import {
  ForwardedRef,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import { ColumnSettingsModal } from './column-settings-modal';
import { EnhancedTableProps, EnhancedTableRef } from './interfaces';
import { Container } from './styles';

export const EnhancedTable = forwardRef(
  (
    {
      columns = [],
      id,
      pagination,
      scroll,
      dataSource,
      rowKey,
      minHeight,
      addExtraPaddingIfEmpty = true,
      shouldAlwaysAddHeight = false,
      ...props
    }: EnhancedTableProps,
    ref: ForwardedRef<EnhancedTableRef>
  ) => {
    const { t } = useTranslation();
    const [isModalOpened, setIsModalOpened] = useState(false);
    const [checkboxOptions, setCheckboxOptions] = useState<CheckboxValueType[]>([]);

    const { enhancedTable: enhancedTableLocaleKeys } = localeKeys.components;

    const shouldRenderExtraPadding = addExtraPaddingIfEmpty && _.isEmpty(dataSource);
    const height =
      shouldAlwaysAddHeight || (dataSource && dataSource.length > 0) ? scroll?.y : undefined;

    const filteredColumns = useMemo(() => {
      return id
        ? columns.filter(
            (column) =>
              column.key === 'actions' || checkboxOptions.some((option) => option === column.key)
          )
        : columns;
    }, [checkboxOptions, columns, id]);

    const openColumnConfig = () => {
      setIsModalOpened(true);
    };

    const getVisibleColumns = useCallback(() => {
      return filteredColumns;
    }, [filteredColumns]);

    useImperativeHandle(
      ref,
      () => ({
        openColumnConfig,
        getVisibleColumns,
      }),
      [getVisibleColumns]
    );

    if (!columns) {
      return null;
    }

    const defaultRowKey = (row: any) => {
      return row._id || row.id || row.key;
    };

    return (
      <Container
        height={height}
        minHeight={minHeight}
        shouldRenderExtraPadding={shouldRenderExtraPadding}
      >
        <Table<any>
          {...props}
          rowKey={rowKey || defaultRowKey}
          dataSource={dataSource}
          columns={filteredColumns}
          scroll={scroll}
          pagination={
            pagination
              ? {
                  showSizeChanger: true,
                  showTotal: (total) =>
                    total > 1
                      ? `${total} ${t(enhancedTableLocaleKeys.showTotalPluralMessage)}`
                      : `${total} ${t(enhancedTableLocaleKeys.showTotalSingularMessage)}`,
                  ...pagination,
                }
              : false
          }
        />
        {id && (
          <ColumnSettingsModal
            isOpen={isModalOpened}
            localStorageKey={id}
            checkboxOptions={checkboxOptions}
            setCheckboxOptions={setCheckboxOptions}
            onClose={() => {
              setIsModalOpened(false);
            }}
            columns={columns}
          />
        )}
      </Container>
    );
  }
);
