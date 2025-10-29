import { useTranslation } from 'react-i18next';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleFilled,
  ExclamationCircleOutlined,
  FilterOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { Button, Card, Dropdown, Flex, Form, Input, type MenuProps, Modal, Space } from 'antd';
import { isEmpty } from 'lodash';
import { useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import { localeKeys } from '~/i18n';
import { CampaignStatus } from '~/constants/campaign-status';
import { useWindowSize } from '~/hooks/use-window-size';
import { extractTemplateKeys } from '~/utils/extract-template-keys';
import { normalizeText } from '~/utils/normalize-text';
import { notifyError } from '~/utils/notify-error';
import { ContactTableFilters } from '../../constants';
import type { BroadcastListFormValues } from '../../pages/create-broadcast-list/interfaces';
import { ContactTable } from '../contact-table';
import type { TableCardProps, TableData } from './interfaces';

export const TableCard = ({
  dataSource,
  selectedTemplate,
  selectedActiveMessage,
  broadcastStatus,
  canEdit,
  availableCount,
  duplicatedPhones,
  setDataSource,
  setIsContactModalOpened,
}: TableCardProps) => {
  const form = Form.useFormInstance<BroadcastListFormValues>();
  const isTest = Form.useWatch('isTest', form);
  const { width } = useWindowSize();
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState(ContactTableFilters.AllContacts);
  const [searchInputValue, setSearchInputValue] = useState('');
  const hasTemplateSelected = Boolean(selectedTemplate);
  const tableLength = dataSource?.length || 0;

  const maxContactCount = isTest ? 5 : selectedActiveMessage?.data?.contactListLimit || 200;

  const variables = useMemo(() => {
    return extractTemplateKeys(selectedTemplate?.message);
  }, [selectedTemplate?.message]);

  const filteredContactsBySearchInput = useMemo(() => {
    if (!searchInputValue) {
      return dataSource;
    }

    const normalizedSearchInputValue = normalizeText(searchInputValue);

    return dataSource.filter((contact) => {
      return (
        normalizeText(contact.name).includes(normalizedSearchInputValue) ||
        normalizeText(contact.phone).includes(normalizedSearchInputValue) ||
        variables.some((variable) =>
          normalizeText(contact[variable] as string).includes(normalizedSearchInputValue)
        )
      );
    });
  }, [dataSource, searchInputValue, variables]);

  const contactsWithError = useMemo(() => {
    return dataSource.reduce<TableData[]>((previousValue, currentValue) => {
      const hasEmptyColumn =
        !currentValue.name?.trim() ||
        !currentValue.phone ||
        variables.some((variable) => !String(currentValue[variable])?.trim());

      if (hasEmptyColumn) {
        previousValue.push(currentValue);
        return previousValue;
      }

      return previousValue;
    }, []);
  }, [dataSource, variables]);

  const filteredContactsByDropdownFilter = useMemo(() => {
    if (statusFilter === ContactTableFilters.AllContacts) {
      return filteredContactsBySearchInput;
    }

    if (statusFilter === ContactTableFilters.SentSuccessfully) {
      return filteredContactsBySearchInput.filter((contact) => contact.sent);
    }

    if (statusFilter === ContactTableFilters.SendingFailure) {
      return filteredContactsBySearchInput.filter((contact) => !contact.sent);
    }

    return filteredContactsBySearchInput.filter((contact) => {
      const contactId = contact.id || contact.newId;
      return contactsWithError.some((contactWithError: any) => {
        const itemId = contactWithError.id || contactWithError.newId;
        return itemId === contactId;
      });
    });
  }, [contactsWithError, filteredContactsBySearchInput, statusFilter]);

  const { t } = useTranslation();

  const tableCardLocaleKeys = localeKeys.campaign.broadcastList.components.tableCard;

  const handleAddNewRow = () => {
    if (availableCount < 1) {
      notifyError(t(tableCardLocaleKeys.addNewRowErrorMessage, { maxContactCount }));
      return;
    }

    const newRow =
      variables.reduce<Record<string, string>>((previousRowObj, attribute) => {
        const attributeName = String(attribute);

        return { ...previousRowObj, [attributeName]: '' };
      }, {}) || {};
    setDataSource([...dataSource, { ...newRow, newId: uuidv4(), phone: '', name: '' }]);
  };

  const handleImportXlsxFile = () => {
    if (availableCount < 1) {
      notifyError(t(tableCardLocaleKeys.importFileErrorMessage, { maxContactCount }));
      return;
    }

    setIsContactModalOpened(true);
  };

  const handleExportAsXlsx = () => {
    const formattedDataSource = dataSource.map((contact) => {
      const { id, newId, ...rest } = contact;
      return rest;
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedDataSource);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, 'destinatarios.xlsx');
  };

  const handleRemoveSelectedRows = () => {
    Modal.confirm({
      title:
        selectedRowKeys.length !== 1
          ? t(tableCardLocaleKeys.removeRowConfirmSingleTitle, { count: selectedRowKeys.length })
          : t(tableCardLocaleKeys.removeRowConfirmPluralTitle, { count: selectedRowKeys.length }),
      icon: <ExclamationCircleFilled />,
      content: t(tableCardLocaleKeys.removeRowConfirmContent),
      okText: t(tableCardLocaleKeys.okTextRemove),
      okButtonProps: { danger: true },
      cancelText: t(tableCardLocaleKeys.cancelText),
      onOk: () => {
        const newDataSource = dataSource.filter((row) => {
          return !selectedRowKeys.some((key) => {
            const id = row.id || row.newId;
            return key === id;
          });
        });
        setDataSource(newDataSource);
        setSelectedRowKeys([]);
      },
      onCancel: () => {},
    });
  };

  const getDropdownItems = (): MenuProps['items'] => {
    if (!canEdit) {
      return [
        {
          key: ContactTableFilters.AllContacts,
          label: t(tableCardLocaleKeys.labelFilterAllContacts),
          onClick: () => {
            setStatusFilter(ContactTableFilters.AllContacts);
          },
        },
        {
          key: ContactTableFilters.SentSuccessfully,
          label: t(tableCardLocaleKeys.labelFilterSentSuccessfully),
          onClick: () => {
            setStatusFilter(ContactTableFilters.SentSuccessfully);
          },
        },
        {
          key: ContactTableFilters.SendingFailure,
          label: t(tableCardLocaleKeys.labelFilterSendingFailure),
          onClick: () => {
            setStatusFilter(ContactTableFilters.SendingFailure);
          },
        },
      ];
    }

    if (broadcastStatus === CampaignStatus.running) {
      return [
        {
          key: ContactTableFilters.AllContacts,
          label: t(tableCardLocaleKeys.labelFilterAllContacts),
          onClick: () => {
            setStatusFilter(ContactTableFilters.AllContacts);
          },
        },
      ];
    }

    return [
      {
        key: ContactTableFilters.AllContacts,
        label: t(tableCardLocaleKeys.labelFilterAllContacts),
        onClick: () => {
          setStatusFilter(ContactTableFilters.AllContacts);
        },
      },
      {
        key: ContactTableFilters.NotFilled,
        label: t(tableCardLocaleKeys.labelFilterNotFilled),
        onClick: () => {
          setStatusFilter(ContactTableFilters.NotFilled);
        },
      },
    ];
  };

  const actionItems: MenuProps['items'] = [
    {
      key: '1',
      label: t(tableCardLocaleKeys.actionInclude),
      onClick: handleAddNewRow,
      disabled: !hasTemplateSelected || !canEdit,
    },
    {
      key: '2',
      label: t(tableCardLocaleKeys.actionExclude),
      onClick: handleRemoveSelectedRows,
      disabled: !hasTemplateSelected || isEmpty(selectedRowKeys) || !canEdit,
    },
    {
      key: '3',
      label: t(tableCardLocaleKeys.actionImport),
      onClick: handleImportXlsxFile,
      disabled: !hasTemplateSelected || !canEdit,
    },
  ];

  const renderActionButtons = () => {
    if (width >= 1352) {
      return (
        <>
          <Button disabled={!hasTemplateSelected || !canEdit} onClick={handleAddNewRow}>
            {t(tableCardLocaleKeys.actionInclude)}
          </Button>
          <Button
            disabled={!hasTemplateSelected || isEmpty(selectedRowKeys) || !canEdit}
            onClick={handleRemoveSelectedRows}
          >
            {t(tableCardLocaleKeys.actionExclude)}
          </Button>
          <Button disabled={!hasTemplateSelected || !canEdit} onClick={handleImportXlsxFile}>
            {t(tableCardLocaleKeys.actionImport)}
          </Button>
        </>
      );
    }

    return (
      <Dropdown menu={{ items: actionItems }} trigger={['hover']} arrow={{ pointAtCenter: true }}>
        <Button icon={<MoreOutlined />} />
      </Dropdown>
    );
  };

  const cardTitle = (
    <Flex justify='space-between' align='center' gap={32}>
      <Space>
        <span>{t(tableCardLocaleKeys.cardTitleSpanRecipients)}</span>
      </Space>
      <Space>
        {canEdit && renderActionButtons()}
        {!canEdit && broadcastStatus !== CampaignStatus.running && (
          <Button onClick={handleExportAsXlsx} disabled={dataSource.length === 0}>
            {t(tableCardLocaleKeys.exportXlsxButton)}
          </Button>
        )}
        <Input.Search
          disabled={!hasTemplateSelected}
          value={searchInputValue}
          onChange={(event) => {
            setSearchInputValue(event.target.value);
          }}
          allowClear
          placeholder={t(tableCardLocaleKeys.searchInputPlaceholder)}
        />
        <Dropdown
          menu={{ items: getDropdownItems(), selectedKeys: [statusFilter] }}
          disabled={!hasTemplateSelected}
        >
          <Button icon={<FilterOutlined />} />
        </Dropdown>
      </Space>
    </Flex>
  );

  const renderTableFooter = () => {
    const errorCounter = contactsWithError?.length || 0;
    let erroCounterComponent = null;
    if (duplicatedPhones.length > 0) {
      const message = t(tableCardLocaleKeys.exportMessageRepeatedPhones);
      erroCounterComponent = (
        <span title={message}>
          <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginLeft: 16, marginRight: 8 }} />
          {message}
        </span>
      );
    } else if (!errorCounter) {
      const message = t(tableCardLocaleKeys.contactTableMessageError);
      erroCounterComponent = (
        <span title={message}>
          <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 16, marginRight: 8 }} />
          {message}
        </span>
      );
    } else {
      const message =
        errorCounter !== 1
          ? `${errorCounter} ${t(tableCardLocaleKeys.exportMessagePluralMissingFields)}`
          : `${errorCounter} ${t(tableCardLocaleKeys.exportMessageSingleMissingField)}`;
      erroCounterComponent = (
        <span title={message}>
          <CloseCircleOutlined style={{ color: '#ff4d4f', marginLeft: 16, marginRight: 8 }} />
          {message}
        </span>
      );
    }

    return (
      <Flex style={{ padding: 16 }} gap={8}>
        <div style={{ whiteSpace: 'nowrap' }}>
          {tableLength !== 1
            ? `${tableLength} ${t(tableCardLocaleKeys.recipientCountPluralMessage)}`
            : `${tableLength} ${t(tableCardLocaleKeys.recipientCountSingleMessage)}`}
        </div>
        {!isEmpty(dataSource) && (
          <div
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {erroCounterComponent}
          </div>
        )}
        <div style={{ fontWeight: 'normal', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
          {availableCount !== 1
            ? `${availableCount} ${t(tableCardLocaleKeys.availableCountPluralMessage)}`
            : `${availableCount} ${t(tableCardLocaleKeys.availableCountSingleMessage)}`}
        </div>
      </Flex>
    );
  };

  return (
    <Card
      title={cardTitle}
      styles={{
        body: { padding: '0 0px', height: 'calc(100vh - 153px)' },
        header: { paddingRight: 8 },
      }}
    >
      <Flex vertical justify='space-between' style={{ height: '100%' }}>
        <ContactTable
          selectedTemplate={selectedTemplate}
          dataSource={dataSource}
          filteredDataSource={filteredContactsByDropdownFilter}
          setDataSource={setDataSource}
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
          canEdit={canEdit}
          broadcastStatus={broadcastStatus}
          duplicatedPhones={duplicatedPhones}
        />
        {renderTableFooter()}
      </Flex>
    </Card>
  );
};
