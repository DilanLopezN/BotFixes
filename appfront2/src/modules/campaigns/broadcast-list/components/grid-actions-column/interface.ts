import type { Campaign } from '~/interfaces/campaign';

export interface GridActionsColumnProps {
  broadcastList: Campaign;
  updateList: () => Promise<boolean | undefined>;
}
