import type { Team } from '~/interfaces/team';

export interface InactivateTeamModalProps {
  team?: Team;
  isVisible: boolean;
  onClose: () => void;
  getTeamById: () => void;
}
