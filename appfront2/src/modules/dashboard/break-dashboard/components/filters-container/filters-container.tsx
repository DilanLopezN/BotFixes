import { FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { Badge, Button, DatePicker, Radio, Space, type RadioProps } from 'antd';
import type { RangePickerProps } from 'antd/es/date-picker';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryString } from '~/hooks/use-query-string';
import { useRefreshContext } from '../../hooks/use-refresh-context';
import type { BreakDashboardQueryString } from '../../interfaces';
import { FilterModal } from './filter-modal';

export const FiltersContainer = () => {
  const { tabId } = useParams();
  const { handleRefresh, isRefreshing } = useRefreshContext();
  const { queryStringAsObj, updateQueryString } = useQueryString<BreakDashboardQueryString>();
  const [isVisible, setIsVisible] = useState(false);

  const isRealTimeActive = queryStringAsObj.isRealtime === 'true';
  const radioValue = isRealTimeActive || !queryStringAsObj.isRealtime ? 'realtime' : 'custom';
  const isMetricTabActive = tabId === 'metrics';

  const filterCount = useMemo(() => {
    return (
      (queryStringAsObj.teamId ? 1 : 0) +
      (queryStringAsObj.userId ? 1 : 0) +
      (queryStringAsObj.breakSettingId ? 1 : 0)
    );
  }, [queryStringAsObj.breakSettingId, queryStringAsObj.teamId, queryStringAsObj.userId]);

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

  const handleChangeRadio: RadioProps['onChange'] = (event) => {
    updateQueryString({ isRealtime: event.target.value === 'realtime' ? 'true' : 'false' });
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

  useEffect(() => {
    if (queryStringAsObj.isRealtime === undefined) {
      updateQueryString({ isRealtime: true });
    }
  }, [queryStringAsObj.isRealtime, updateQueryString]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      {isMetricTabActive && (
        <Radio.Group onChange={handleChangeRadio} value={radioValue}>
          <Radio value='realtime'>Tempo Real</Radio>
          <Radio value='custom'>
            <DatePicker.RangePicker
              allowClear={false}
              format='DD/MM/YYYY'
              style={{ width: 230 }}
              onChange={handleChangeDateRangePicker}
              value={[dayjs(queryStringAsObj.startDate), dayjs(queryStringAsObj.endDate)]}
              placeholder={['Data início', 'Data fim']}
              disabled={radioValue === 'realtime'}
              disabledDate={getDisabledDate}
            />
          </Radio>
        </Radio.Group>
      )}
      <Button icon={<FilterOutlined />} onClick={handleOpenFilterModal}>
        <Space align='center'>
          <span>Filtrar</span>
          {filterCount > 0 && <Badge count={filterCount} />}
        </Space>
      </Button>
      <Button icon={<ReloadOutlined />} onClick={handleRefresh} disabled={isRefreshing}>
        Recarregar
      </Button>
      <FilterModal isVisible={isVisible} onClose={handleCloseFilterModal} />
    </div>
  );
};
