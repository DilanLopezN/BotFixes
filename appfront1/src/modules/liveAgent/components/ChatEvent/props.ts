import { Team } from '../../../../model/Team';
import { Activity } from '../../interfaces/activity.interface';

export interface ChatEventProps {
    activity: Activity;
    teams: Team[]
}