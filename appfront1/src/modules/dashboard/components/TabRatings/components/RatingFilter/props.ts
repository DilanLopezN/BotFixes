import { User } from 'kissbot-core';
import { Team } from '../../../../../../model/Team';
import { Workspace } from '../../../../../../model/Workspace';
import { typeDownloadEnum } from '../../../../../../shared/DownloadModal/props';

export interface FiltersProps {
    selectedWorkspace?: Workspace;
    filter: RatingFilterInterface;
    onSubmit: (filter: RatingFilterInterface) => any;
    disable: boolean;
    teams: Team[];
    users: User[];
}

export interface RatingFilterInterface {
    tags?: string[] | undefined;
    rangeDate?: string[];
    timezone?: string;
    note?: {
        1: 1;
        2: 2;
        3: 3;
        4: 4;
        5: 5;
    };
    teamId?: string;
    teamIds?: string[];
    memberId?: string;
    feedback?: feedbackEnum;
    downloadType?: typeDownloadEnum;
}

export enum feedbackEnum {
    all = 'all',
    withFeedback = 'withFeedback',
    noFeedback = 'noFeedback',
}


