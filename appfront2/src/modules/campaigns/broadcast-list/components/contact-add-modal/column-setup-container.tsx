import { useTranslation } from 'react-i18next';
import { Alert, Col, Form, Modal, Row, Select } from 'antd';
import type { ColumnType } from 'antd/es/table';
import { isEmpty } from 'lodash';
import { useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { localeKeys } from '~/i18n';
import { normalizeText } from '~/utils/normalize-text';
import type { ColumnSetupContainerProps } from './interfaces';
import { AttributeTable } from './styles';

export const ColumnSetupContainer = ({
  xlsxFile,
  columns,
  maxContactCount,
  onClose,
  setDataSource,
}: ColumnSetupContainerProps) => {
  const [form] = Form.useForm();

  const selectOptions = useMemo(() => {
    if (!xlsxFile || isEmpty(xlsxFile) || isEmpty(xlsxFile[0])) {
      return [];
    }

    return xlsxFile[0].filter(Boolean).map((row) => {
      return { value: String(row), label: String(row) };
    });
  }, [xlsxFile]);

  const initialValues = useMemo(() => {
    return columns.reduce((previousValue, currentValue) => {
      const hasTableColumnInXlsxData = selectOptions.some(
        (option) => option.value === currentValue.value
      );

      if (hasTableColumnInXlsxData) {
        return { ...previousValue, [currentValue.value]: currentValue.value };
      }

      return previousValue;
    }, {});
  }, [columns, selectOptions]);

  const formattedXlsxData = useMemo(() => {
    return xlsxFile?.reduce<Record<string, string>[]>((previousDataObj, row, rowIndex) => {
      if (rowIndex === 0) {
        return previousDataObj;
      }

      const attributes = xlsxFile[0];
      const formattedRows = attributes.reduce<Record<string, string>>(
        (previousRowObj, attribute, attributeIndex) => {
          const selectedColumn = row[attributeIndex];
          const attributeName = String(attribute);

          return { ...previousRowObj, [attributeName]: selectedColumn || '' };
        },
        {}
      );
      previousDataObj.push({ newId: uuidv4(), ...formattedRows });
      return previousDataObj;
    }, []);
  }, [xlsxFile]);

  const { t } = useTranslation();

  const columnSetupContainersLocaleKeys =
    localeKeys.campaign.broadcastList.components.contactAddModal.columnSetupContainer;

  const handleSubmit = (formValues: Record<string, string>) => {
    const valueList = Object.values(formValues);
    const hasDuplicatedValue = valueList.some((value, index) => {
      if (!value) {
        return false;
      }

      return valueList.some((valueAux, indexAux) => {
        if (index === indexAux) {
          return false;
        }

        return value === valueAux;
      });
    });

    const newData = formattedXlsxData?.map<Record<string, string>>((xlsxRow) => {
      const rowWithAssociatedAttributes = columns.reduce<Record<string, string>>(
        (previousValue, currentValue) => {
          const attribute = formValues[currentValue.value];
          return { ...previousValue, [currentValue.value]: xlsxRow[attribute] };
        },
        {}
      );

      return { newId: xlsxRow.newId, ...rowWithAssociatedAttributes };
    });

    const handleNewData = () => {
      if (newData) {
        setDataSource((currentDataSource) => {
          const newDataSource = [...currentDataSource, ...newData];

          return newDataSource.slice(0, maxContactCount).map((contact) => ({
            ...contact,
            phone: contact.phone ? String(contact.phone).replace(/\D/g, '') : '',
          }));
        });
      }
      onClose();
    };

    if (hasDuplicatedValue) {
      Modal.confirm({
        title: t(columnSetupContainersLocaleKeys.modalTitle),
        content: t(columnSetupContainersLocaleKeys.modalContent),
        okText: t(columnSetupContainersLocaleKeys.modalOkText),
        cancelText: t(columnSetupContainersLocaleKeys.modalCancelText),
        centered: true,
        onOk: handleNewData,
      });
      return;
    }

    handleNewData();
  };

  const getColumns = (dataIndex: string, title: string): ColumnType<any>[] => {
    return [
      {
        title,
        dataIndex,
        key: dataIndex,
        ellipsis: true,
      },
    ];
  };

  return (
    <Form
      id='setup-columns-form'
      layout='vertical'
      form={form}
      initialValues={initialValues}
      onFinish={handleSubmit}
    >
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <span>{t(columnSetupContainersLocaleKeys.span)}</span>
        </Col>
        <Col span={24}>
          <Alert
            message={t(columnSetupContainersLocaleKeys.alertMessage)}
            type='warning'
            showIcon
          />
        </Col>
        <Row
          gutter={[16, 16]}
          wrap={false}
          style={{ overflow: 'hidden', overflowX: 'auto', width: '100%' }}
        >
          {columns.map((column) => {
            return (
              <Col span={6} key={column.value}>
                <Form.Item
                  noStyle
                  shouldUpdate={(previousValues, currentValues) => {
                    return previousValues[column.value] !== currentValues[column.value];
                  }}
                >
                  {({ getFieldValue }) => {
                    const fieldValue = getFieldValue(column.value);

                    return (
                      <>
                        <div
                          style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          <span
                            title={t(columnSetupContainersLocaleKeys.columnTitle, {
                              column: column.label,
                            })}
                          >
                            {t(columnSetupContainersLocaleKeys.columnTitle, {
                              column: column.label,
                            })}
                          </span>
                        </div>
                        <Form.Item name={column.value}>
                          <Select
                            allowClear
                            placeholder={t(columnSetupContainersLocaleKeys.selectPlaceholder)}
                            options={selectOptions}
                            showSearch
                            filterOption={(search, option) => {
                              return Boolean(
                                normalizeText(option?.label).includes(normalizeText(search))
                              );
                            }}
                          />
                        </Form.Item>
                        <AttributeTable
                          rowKey={(row) => row.newId}
                          dataSource={formattedXlsxData}
                          columns={getColumns(fieldValue, column.label)}
                          pagination={false}
                          size='small'
                          scroll={{ y: 'calc(100vh - 472px)' }}
                        />
                      </>
                    );
                  }}
                </Form.Item>
              </Col>
            );
          })}
        </Row>
      </Row>
    </Form>
  );
};
