import { DayOff } from '~/interfaces/day-off';

export interface CreateDayOffProps {
  offDay: DayOff;
  teamIds: string[];
}
