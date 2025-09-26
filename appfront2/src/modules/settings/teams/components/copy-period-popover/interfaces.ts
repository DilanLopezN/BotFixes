import type { FormInstance } from 'antd';
import type { TeamFormValues } from '~/modules/settings/teams/interfaces';
import { DaysOfTheWeek } from '../../constants';

export interface CopyPeriodPopoverProps {
  isDisabled?: boolean;
  day: DaysOfTheWeek;
  form: FormInstance<TeamFormValues>;
}
