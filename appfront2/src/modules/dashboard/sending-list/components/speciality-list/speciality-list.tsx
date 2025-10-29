import { Col, Input, Row, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HealthEntityType } from '~/constants/health-entity-type';
import { localeKeys } from '~/i18n';
import { useDebouncedValue } from '../../hooks/use-debounced-value';
import { useHealthEntities } from '../../hooks/use-health-entities';
import type { DataType, SpecialityListProps } from './interfaces';
import { Container } from './styles';

export const SpecialityList = ({
  isVisible,
  selectedIntegrationId,
  selectedSpecialityCodeList,
  setSelectedSpecialityCodeList,
}: SpecialityListProps) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInputValue, setSearchInputValue] = useState('');

  const debouncedSearchInputValue = useDebouncedValue(searchInputValue);
  const isSearching = debouncedSearchInputValue.length >= 3;

  const { data, isLoading, fetchConfirmationEntity } = useHealthEntities({
    currentPage,
    integrationId: selectedIntegrationId,
    searchInputValue: debouncedSearchInputValue.length >= 3 ? debouncedSearchInputValue : '',
    entityType: HealthEntityType.speciality,
  });

  const { filtersModal: filtersModalLocaleKeys } = localeKeys.dashboard.sendingList.fullTable;

  const handleRowClick = (recordKey: string) => {
    let newSpecialityCodeList = [];

    const specialityArrayIndex = selectedSpecialityCodeList.findIndex(
      (specialityCode) => specialityCode === recordKey
    );

    if (specialityArrayIndex >= 0) {
      newSpecialityCodeList = selectedSpecialityCodeList.filter(
        (specialityCode) => specialityCode !== recordKey
      );
    } else {
      newSpecialityCodeList = [...selectedSpecialityCodeList, recordKey];
    }

    setSelectedSpecialityCodeList(newSpecialityCodeList);
  };

  useEffect(() => {
    fetchConfirmationEntity();
  }, [fetchConfirmationEntity]);

  useEffect(() => {
    if (isVisible) {
      setCurrentPage(1);
      setSearchInputValue('');
    }
  }, [isVisible]);

  const columns: ColumnsType<DataType> = [
    {
      title: t(filtersModalLocaleKeys.titleSpecialityList),
      dataIndex: 'description',
      render: (text) => <span title={text}>{text}</span>,
    },
  ];

  const formattedData = data?.data.map((speciality) => {
    return {
      key: speciality.code,
      description: speciality.name,
    };
  });

  const footerActions = () => {
    return (
      <a
        href=' '
        onClick={(event) => {
          event.preventDefault();
          setSelectedSpecialityCodeList([]);
        }}
      >
        {t(filtersModalLocaleKeys.specialityResetButton)}
      </a>
    );
  };

  return (
    <Container>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Input.Search
            placeholder={t(filtersModalLocaleKeys.specialitySearchInputPlaceholder)}
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
            loading={isLoading}
            onRow={(record) => {
              return {
                onClick: () => {
                  handleRowClick(record.key);
                },
              };
            }}
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedSpecialityCodeList,
              onChange: (newSelectedRowKeys) => {
                setSelectedSpecialityCodeList(newSelectedRowKeys as string[]);
              },
              preserveSelectedRowKeys: true,
            }}
            pagination={
              isSearching
                ? false
                : {
                    total: data?.count,
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
