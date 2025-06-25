import { Team } from './team.interface';

export interface TeamHistory extends Team {
    updatedByUserId: string;
    teamId: string;
}
