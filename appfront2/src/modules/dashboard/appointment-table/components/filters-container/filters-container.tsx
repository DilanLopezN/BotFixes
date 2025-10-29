import {
  FilterOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Badge, Button, Checkbox, type CheckboxProps, DatePicker, Space, Tooltip } from 'antd';
import type { RangePickerProps } from 'antd/es/date-picker';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { ExportButton, ExportType } from '~/components/export-button';
import { useQueryString } from '~/hooks/use-query-string';
import { useExportAppointmentTable } from '../../hooks/use-export-appointment-table';
import { AppointmentTableQueryString } from '../../interfaces';
import { FilterModal } from './filter-modal';
import type { FiltersContainerProps } from './interfaces';

export const FiltersContainer = ({ onRefresh, isRefreshing, tableRef }: FiltersContainerProps) => {
  const { queryStringAsObj, updateQueryString } = useQueryString<AppointmentTableQueryString>();
  const { exportTable, isExportingAppointmentTable } = useExportAppointmentTable();
  const [calendarValue, setCalendarValue] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
    null,
    null,
  ]);
  const [displayValue, setDisplayValue] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
    null,
    null,
  ]);

  const [isVisible, setIsVisible] = useState(false);

  const filterCount = useMemo(() => {
    return (
      (queryStringAsObj.agentIds ? 1 : 0) +
      (queryStringAsObj.teamIds ? 1 : 0) +
      (queryStringAsObj.channelId ? 1 : 0) +
      (queryStringAsObj.tags ? 1 : 0) +
      (queryStringAsObj.appointmentStatus ? 1 : 0)
    );
  }, [
    queryStringAsObj.agentIds,
    queryStringAsObj.appointmentStatus,
    queryStringAsObj.channelId,
    queryStringAsObj.tags,
    queryStringAsObj.teamIds,
  ]);

  const getDisabledDate = (current: dayjs.Dayjs) => {
    const today = dayjs().endOf('day');

    if (current.isAfter(today)) {
      return true;
    }

    if (!calendarValue[0] && !calendarValue[1]) return false;

    const start = calendarValue[0];
    const end = calendarValue[1];

    if (start) {
      return current.diff(start, 'day') > 31 || start.diff(current, 'day') > 31;
    }

    if (end) {
      return current.diff(end, 'day') > 31 || end.diff(current, 'day') > 31;
    }

    return false;
  };

  const handleChangeDateRangePicker: RangePickerProps['onChange'] = (dates, _datesAsString) => {
    const newStartDate = dates && dates[0] ? dates[0].format('YYYY-MM-DD') : '';
    const newEndDate = dates && dates[1] ? dates[1].format('YYYY-MM-DD') : '';
    updateQueryString({ startDate: newStartDate, endDate: newEndDate });
  };

  const handleGroupSwitchChange: CheckboxProps['onChange'] = (event) => {
    updateQueryString({
      includeAppointmentDetails: event.target.checked ? 'true' : '',
    });
  };

  const handleExport = async (type: ExportType) => {
    await exportTable(type);
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
    setDisplayValue([dayjs(queryStringAsObj.startDate), dayjs(queryStringAsObj.endDate)]);
  }, [queryStringAsObj.startDate, queryStringAsObj.endDate]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 8,
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <DatePicker.RangePicker
          allowClear={false}
          format='DD/MM/YYYY'
          style={{ width: 230 }}
          onChange={handleChangeDateRangePicker}
          onCalendarChange={(val) => {
            setCalendarValue(val as [dayjs.Dayjs | null, dayjs.Dayjs | null]);
          }}
          value={displayValue}
          placeholder={['Data início', 'Data fim']}
          disabledDate={getDisabledDate}
        />
        <Tooltip title='O intervalo máximo é de 31 dias'>
          <InfoCircleOutlined style={{ color: '#1677ff', marginRight: 8 }} />
        </Tooltip>
        <Checkbox
          checked={queryStringAsObj.includeAppointmentDetails === 'true'}
          onChange={handleGroupSwitchChange}
        >
          Trazer dados de agendamentos
        </Checkbox>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <ExportButton onDownload={handleExport} loading={isExportingAppointmentTable} />
        <Button icon={<ReloadOutlined />} onClick={onRefresh} disabled={isRefreshing}>
          Recarregar
        </Button>
        <Button
          icon={<SettingOutlined />}
          onClick={() => {
            tableRef.current?.openColumnConfig();
          }}
        >
          Configurar lista
        </Button>
        <Button icon={<FilterOutlined />} onClick={handleOpenFilterModal}>
          <Space align='center'>
            <span>Filtrar</span>
            {filterCount > 0 && <Badge count={filterCount} />}
          </Space>
        </Button>
        <FilterModal isVisible={isVisible} onClose={handleCloseFilterModal} />
      </div>
    </div>
  );
};
