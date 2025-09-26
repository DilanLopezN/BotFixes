import { User } from 'kissbot-core';
import { Team } from '../../../../../../model/Team';
import { RatingFilterInterface } from '../RatingFilter/props';
import { Workspace } from '../../../../../../model/Workspace';

export interface RatingListProps {
    selectedWorkspace: Workspace;
    appliedFilters: RatingFilterInterface;
    teams: Team[];
    onLoading: Function;
    users: User[];
}
export interface Filters {
    skip: number;
    total: number;
}

export interface AvgRating {
    avg: number;
    count: number;
    values: {
        note1: number;
        note2: number;
        note3: number;
        note4: number;
        note5: number;
    };
}
