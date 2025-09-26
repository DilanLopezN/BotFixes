import type { Team } from '~/interfaces/team';

export interface ReactivateTeamModalProps {
  team?: Team;
  isVisible: boolean;
  onClose: () => void;
  getTeamById: () => void;
}
