import { FC } from 'react'
import moment from 'moment'
import { DatePicker } from 'antd'
import RangeDatePickerProps from './props'
import '../../../../node_modules/antd/es/date-picker/style/css'
import './styles.scss'
import locale from 'antd/es/date-picker/locale/pt_BR'

const RageDatePicker: FC<RangeDatePickerProps> = ({
  size,
  name,
  disabled,
  defaultValue,
  format,
  onChange,
  placeholder,
}) => (
  <DatePicker.RangePicker
    size={!!size ? size : 'large'}
    name={name}
    locale={locale}
    placeholder={placeholder}
    disabled={disabled}
    defaultValue={defaultValue}
    format={!!format ? format : 'DD/MM/YYYY'}
    onChange={onChange}
    disabledDate={(day) => {
      if (day) {
        const now = moment();
        const date = moment(day.format('YYYY-MM-DD'), 'YYYY-MM-DD');

        return date.isAfter(now);
      }

      return false;
    }}
  />
);

export default RageDatePicker;
