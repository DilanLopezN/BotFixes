import { Badge, Button, Collapse, Flex, Modal, Space, type CollapseProps } from 'antd';
import { ModalFooterRender } from 'antd/es/modal/interface';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryString } from '~/hooks/use-query-string';
import { localeKeys } from '~/i18n';
import type { SendingListQueryString } from '../../interfaces';
import { StatusList } from '../status-list';
import type { SimplifiedFiltersModalProps } from './interfaces';
import { FiltersContainer } from './styles';

export const SimplifiedFiltersModal = ({ isVisible, onClose }: SimplifiedFiltersModalProps) => {
  const { t } = useTranslation();
  const { queryStringAsObj, updateQueryString } = useQueryString<SendingListQueryString>();
  const [selectedStatusList, setSelectedStatusList] = useState<string[]>([]);
  const [activeCollapseItem, setActiveCollapseItem] = useState<string[]>(['1']);

  const { filtersModal: filtersModalLocaleKeys } = localeKeys.dashboard.sendingList.fullTable;

  const handleResetFilters = () => {
    setSelectedStatusList([]);
  };

  const handleFilters = () => {
    updateQueryString({
      statusList: selectedStatusList,
    });
    onClose();
  };

  useEffect(() => {
    if (isVisible) {
      setSelectedStatusList(
        queryStringAsObj.statusList ? queryStringAsObj.statusList.split(',') : []
      );
    }
  }, [isVisible, queryStringAsObj.statusList]);

  const filterList: CollapseProps['items'] = [
    {
      key: '1',
      label: (
        <Space align='center'>
          <span>{t(filtersModalLocaleKeys.statusGroupTitle)}</span>
          <Badge count={selectedStatusList.length} />
        </Space>
      ),
      children: (
        <StatusList
          selectedStatusList={selectedStatusList}
          setSelectedStatusList={setSelectedStatusList}
        />
      ),
    },
  ];

  const modalFooter: ModalFooterRender = (_originNode, { OkBtn, CancelBtn }) => {
    return (
      <Flex justify='space-between'>
        <Button onClick={handleResetFilters}>{t(filtersModalLocaleKeys.resetFiltersButton)}</Button>
        <Space>
          <CancelBtn />
          <OkBtn />
        </Space>
      </Flex>
    );
  };

  return (
    <FiltersContainer>
      <Modal
        open={isVisible}
        onOk={handleFilters}
        okText={t(filtersModalLocaleKeys.filterButton)}
        cancelText={t(filtersModalLocaleKeys.cancelButton)}
        styles={{ body: { height: 600 } }}
        onCancel={onClose}
        title={t(filtersModalLocaleKeys.modalTitle)}
        maskClosable={false}
        keyboard={false}
        forceRender
        footer={modalFooter}
      >
        <Collapse
          items={filterList}
          ghost
          activeKey={activeCollapseItem}
          onChange={(key) => {
            const lastKey = _.last(key);
            setActiveCollapseItem(lastKey ? [lastKey] : []);
          }}
        />
      </Modal>
    </FiltersContainer>
  );
};
