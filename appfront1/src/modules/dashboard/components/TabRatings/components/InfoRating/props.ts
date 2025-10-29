import { User } from 'kissbot-core';
import { Team } from '../../../../../../model/Team';

export interface InfoRatingProps {
    info: {
        userId: string;
        teamId: string;
        value: number;
        feedback: string;
        date: string;
        ratingAt: string;
        createdAt: string;
    };
    teams: Team[];
    users: User[];
}
