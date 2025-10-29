import type { FormInstance } from 'antd';
import type { TeamFormValues } from '~/modules/settings/teams/interfaces';

export interface PeriodTimePickedProps {
  name: any;
  label: React.ReactNode;
  form: FormInstance<TeamFormValues>;
  isTeamInactive?: boolean;
}
