import { FC, useEffect, useState } from 'react';
import { Team } from '../../../../model/Team';
import { PageTemplate } from '../../../../shared-v2/page-template';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { WorkspaceUserService } from '../../../settings/service/WorkspaceUserService';
import { TeamService } from '../../../teams/services/TeamService';
import { useTeamsContext } from '../../context';
import RatingFilter, { getDefaultRatingFilter } from './components/RatingFilter';
import { RatingFilterInterface } from './components/RatingFilter/props';
import RatingList from './components/RatingList';
import { TabRatingsProps } from './props';

const TabRatings: FC<TabRatingsProps & I18nProps> = ({ selectedWorkspace, getTranslation }) => {
    const [filter, setFilter] = useState<RatingFilterInterface>(getDefaultRatingFilter());
    const { teams, setTeams } = useTeamsContext();
    const [isLoading, setIsLoading] = useState(false);
    const [workspaceTeams, setWorkspaceTeams] = useState<Team[] | undefined>(teams);
    const [workspaceUsers, setWorkspaceUsers] = useState<any[]>([]);

    const getWorkspaceTeams = async () => {
        if (teams?.length) {
            return;
        }

        const response = await TeamService.getTeams(selectedWorkspace._id);
        setTeams([...(response?.data ?? [])]);
        setWorkspaceTeams([...(response?.data ?? [])]);
    };

    const getWorkspaceUsers = async () => {
        if (!selectedWorkspace) return;

        const response = await WorkspaceUserService.getAll(selectedWorkspace._id, 'name');
        setWorkspaceUsers([...(response?.data ?? [])]);
    };

    useEffect(() => {
        getWorkspaceTeams();
        getWorkspaceUsers();
    }, []);

    return (
        <PageTemplate>
            {workspaceTeams && (
                <>
                    <RatingFilter
                        filter={filter}
                        onSubmit={(filter) => setFilter({ ...filter })}
                        disable={isLoading}
                        teams={workspaceTeams}
                        users={workspaceUsers}
                        selectedWorkspace={selectedWorkspace}
                    />
                    <RatingList
                        onLoading={(loading) => setIsLoading(loading)}
                        selectedWorkspace={selectedWorkspace}
                        appliedFilters={filter}
                        teams={workspaceTeams}
                        users={workspaceUsers}
                    />
                </>
            )}
        </PageTemplate>
    );
};

export default i18n(TabRatings) as FC<TabRatingsProps>;
