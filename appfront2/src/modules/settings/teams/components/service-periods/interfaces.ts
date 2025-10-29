import type { FormInstance } from 'antd';
import type { Dispatch, SetStateAction } from 'react';
import type { DayOff } from '~/interfaces/day-off';
import type { TeamFormValues } from '../../interfaces';

export interface ServicePeriosProps {
  form: FormInstance<TeamFormValues>;
  dayOffList: DayOff[];
  setDayOffList: Dispatch<SetStateAction<DayOff[]>>;
  isTeamInactive?: boolean;
}
