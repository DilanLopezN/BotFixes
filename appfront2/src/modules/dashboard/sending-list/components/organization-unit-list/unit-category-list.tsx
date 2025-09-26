import { Col, Input, Row, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HealthEntityType } from '~/constants/health-entity-type';
import { localeKeys } from '~/i18n';
import { useHealthEntities } from '../../hooks/use-health-entities';
import type { DataType, UnitCategoryListProps } from './interfaces';
import { Container } from './styles';
import { useDebouncedValue } from '../../hooks/use-debounced-value';

export const OrganizationUnitList = ({
  isVisible,
  selectedIntegrationId,
  selectedOrganizationUnitList,
  setSelectedOrganizationUnitList,
}: UnitCategoryListProps) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInputValue, setSearchInputValue] = useState('');

  const debouncedSearchInputValue = useDebouncedValue(searchInputValue);
  const isSearching = debouncedSearchInputValue.length >= 3;

  const { data, isLoading, fetchConfirmationEntity } = useHealthEntities({
    currentPage,
    integrationId: selectedIntegrationId,
    searchInputValue: debouncedSearchInputValue.length >= 3 ? debouncedSearchInputValue : '',
    entityType: HealthEntityType.organizationUnit,
  });

  const { filtersModal: filtersModalLocaleKeys } = localeKeys.dashboard.sendingList.fullTable;

  const handleRowClick = (recordKey: string) => {
    let newProcedureList = [];

    const specialtyArrayIndex = selectedOrganizationUnitList.findIndex(
      (organizationUnitList) => organizationUnitList === recordKey
    );

    if (specialtyArrayIndex >= 0) {
      newProcedureList = selectedOrganizationUnitList.filter(
        (organizationUnitList) => organizationUnitList !== recordKey
      );
    } else {
      newProcedureList = [...selectedOrganizationUnitList, recordKey];
    }

    setSelectedOrganizationUnitList(newProcedureList);
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
      title: t(filtersModalLocaleKeys.titleUnitCategoryList),
      dataIndex: 'description',
      render: (text) => <span title={text}>{text}</span>,
    },
  ];

  const formattedData = data?.data.map((organizationUnit) => {
    return {
      key: organizationUnit.code,
      description: organizationUnit.name,
    };
  });

  const footerActions = () => {
    return (
      <a
        href=' '
        onClick={(event) => {
          event.preventDefault();
          setSelectedOrganizationUnitList([]);
        }}
      >
        {t(filtersModalLocaleKeys.unitCategoryResetButton)}
      </a>
    );
  };

  return (
    <Container>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Input.Search
            placeholder={t(filtersModalLocaleKeys.unitCategorySearchInputPlaceholder)}
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
              selectedRowKeys: selectedOrganizationUnitList,
              onChange: (newSelectedRowKeys) => {
                setSelectedOrganizationUnitList(newSelectedRowKeys as string[]);
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
