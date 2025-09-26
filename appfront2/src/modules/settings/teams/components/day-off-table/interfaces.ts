import type { Dispatch, SetStateAction } from 'react';
import { DayOff } from '~/interfaces/day-off';

export interface DayOffTableProps {
  dayOffList: DayOff[];
  setDayOffList: Dispatch<SetStateAction<DayOff[]>>;
  isLoadingDayOffList?: boolean;
  isTeamInactive?: boolean;
}
