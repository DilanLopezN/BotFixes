import { Col, Input, Row, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import { normalizeText } from '~/utils/normalize-text';
import { useCancelingReasonContext } from '../../hooks/use-canceling-reason-context';
import { useDebouncedValue } from '../../hooks/use-debounced-value';
import type { CancelingReasonListProps, DataType } from './interfaces';
import { Container } from './styles';

export const CancelingReasonList = ({
  isVisible,
  selectedCancelingReasonList,
  setSelectedCancelingReasonList,
}: CancelingReasonListProps) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInputValue, setSearchInputValue] = useState('');

  const debouncedSearchInputValue = useDebouncedValue(searchInputValue);
  const isSearching = debouncedSearchInputValue.length >= 3;

  const { cancelingReasons, isLoadingCancelingReasons, fetchCancelingReasons } =
    useCancelingReasonContext();

  const { cancelingReasonList: cancelingReasonListLocaleKeys } =
    localeKeys.dashboard.sendingList.components;

  const handleRowClick = (recordKey: string) => {
    let newCancelingReasonList = [];

    const cancelingReasonArrayIndex = selectedCancelingReasonList.findIndex(
      (cancelingReason) => cancelingReason === recordKey
    );

    if (cancelingReasonArrayIndex >= 0) {
      newCancelingReasonList = selectedCancelingReasonList.filter(
        (cancelingReason) => cancelingReason !== recordKey
      );
    } else {
      newCancelingReasonList = [...selectedCancelingReasonList, recordKey];
    }

    setSelectedCancelingReasonList(newCancelingReasonList);
  };

  useEffect(() => {
    fetchCancelingReasons();
  }, [fetchCancelingReasons]);

  useEffect(() => {
    if (isVisible) {
      setCurrentPage(1);
      setSearchInputValue('');
    }
  }, [isVisible]);

  const columns: ColumnsType<DataType> = [
    {
      title: t(cancelingReasonListLocaleKeys.titleCancelingReason),
      dataIndex: 'description',
      render: (text) => <span title={text}>{text}</span>,
    },
  ];

  const formattedData = useMemo(() => {
    return cancelingReasons
      ?.map((cancelingReason) => {
        return {
          key: String(cancelingReason.id),
          description: cancelingReason.reasonName,
        };
      })
      .filter((cancelingReason) => {
        if (!debouncedSearchInputValue) return true;

        return normalizeText(cancelingReason.description).includes(
          normalizeText(debouncedSearchInputValue)
        );
      });
  }, [cancelingReasons, debouncedSearchInputValue]);

  const footerActions = () => {
    return (
      <a
        href=' '
        onClick={(event) => {
          event.preventDefault();
          setSelectedCancelingReasonList([]);
        }}
      >
        {t(cancelingReasonListLocaleKeys.resetButton)}
      </a>
    );
  };

  return (
    <Container>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Input.Search
            placeholder={t(cancelingReasonListLocaleKeys.searchInputPlaceholder)}
            allowClear
            value={searchInputValue}
            onChange={(event) => {
              setSearchInputValue(event.target.value);
            }}
          />
        </Col>
        <Col span={24}>
          <Table
            dataSource={formattedData}
            columns={columns}
            showHeader
            size='small'
            scroll={{ y: 'calc(40vh - 180px)', scrollToFirstRowOnChange: true }}
            loading={isLoadingCancelingReasons}
            onRow={(record) => {
              return {
                onClick: () => {
                  handleRowClick(record.key);
                },
              };
            }}
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedCancelingReasonList,
              onChange: (newSelectedRowKeys) => {
                setSelectedCancelingReasonList(newSelectedRowKeys as string[]);
              },
              preserveSelectedRowKeys: true,
            }}
            pagination={
              isSearching
                ? false
                : {
                    total: formattedData?.length || 0,
                    current: currentPage,
                    onChange: (page) => {
                      setCurrentPage(page);
                    },
                    pageSize: 6,
                    showSizeChanger: false,
                    size: 'small',
                    showTotal: footerActions,
                  }
            }
          />
        </Col>
      </Row>
    </Container>
  );
};
