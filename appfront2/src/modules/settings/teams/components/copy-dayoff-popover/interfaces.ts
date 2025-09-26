import React from 'react';
import type { DayOff } from '~/interfaces/day-off';

export interface CopyDayoffPopoverProps {
  selectedDayoff: DayOff;
  children: React.ReactNode;
}
