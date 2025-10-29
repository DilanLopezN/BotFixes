import { FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { Badge, Button, DatePicker, Space } from 'antd';
import type { RangePickerProps } from 'antd/es/date-picker';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useQueryString } from '~/hooks/use-query-string';
import type { RemiDashboardQueryString } from '../../interfaces';
import { FilterModal } from './filter-modal';
import type { FiltersContainerProps } from './interfaces';

export const FiltersContainer = ({ onRefresh, isRefreshing }: FiltersContainerProps) => {
  const { queryStringAsObj, updateQueryString } = useQueryString<RemiDashboardQueryString>();
  const [isVisible, setIsVisible] = useState(false);

  const filterCount = useMemo(() => {
    return queryStringAsObj.remiIdList ? 1 : 0;
  }, [queryStringAsObj.remiIdList]);

  const getDisabledDate = (current: dayjs.Dayjs) => {
    const today = dayjs().endOf('day');
    const threeMonthsAgo = dayjs().subtract(3, 'month').startOf('day');

    return current.isAfter(today) || current.isBefore(threeMonthsAgo);
  };

  const handleChangeDateRangePicker: RangePickerProps['onChange'] = (dates, _datesAsString) => {
    const newStartDate = dates && dates[0] ? dates[0].format('YYYY-MM-DD') : '';
    const newEndDate = dates && dates[1] ? dates[1].format('YYYY-MM-DD') : '';
    updateQueryString({ startDate: newStartDate, endDate: newEndDate });
  };

  const handleOpenFilterModal = () => {
    setIsVisible(true);
  };

  const handleCloseFilterModal = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    if (
      dayjs(queryStringAsObj.startDate, 'YYYY-MM-DD', true).isValid() &&
      dayjs(queryStringAsObj.endDate, 'YYYY-MM-DD', true).isValid()
    ) {
      return;
    }
    const newStartDate = dayjs().subtract(7, 'days').format('YYYY-MM-DD');
    const newEndDate = dayjs().format('YYYY-MM-DD');
    updateQueryString({ startDate: newStartDate, endDate: newEndDate });
  }, [queryStringAsObj.endDate, queryStringAsObj.startDate, updateQueryString]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <DatePicker.RangePicker
        allowClear={false}
        format='DD/MM/YYYY'
        style={{ width: 230 }}
        onChange={handleChangeDateRangePicker}
        value={[dayjs(queryStringAsObj.startDate), dayjs(queryStringAsObj.endDate)]}
        placeholder={['Data início', 'Data fim']}
        disabledDate={getDisabledDate}
      />
      <Button icon={<FilterOutlined />} onClick={handleOpenFilterModal}>
        <Space align='center'>
          <span>Filtrar</span>
          {filterCount > 0 && <Badge count={filterCount} />}
        </Space>
      </Button>
      <Button icon={<ReloadOutlined />} onClick={onRefresh} disabled={isRefreshing}>
        Recarregar
      </Button>
      <FilterModal isVisible={isVisible} onClose={handleCloseFilterModal} />
    </div>
  );
};
