import { FC, useEffect, useState } from 'react';
import { PageTemplate } from '../../../../shared-v2/page-template';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { TeamService } from '../../../teams/services/TeamService';
import { useTeamsContext } from '../../context';
import ConversationFilter, { getDefaultFilter } from '../ConversationFilter';
import { ConversationFilterInterface } from '../ConversationFilter/props';

const TabUsers: FC<any & I18nProps> = ({ selectedWorkspace, getTranslation }) => {
    const { teams, setTeams } = useTeamsContext();
    const [filter, setFilter] = useState<ConversationFilterInterface>(getDefaultFilter(selectedWorkspace?._id));
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const getWorkspaceTeams = async () => {
            if (teams?.length) {
                return;
            }
            setLoading(true);
            const response = await TeamService.getTeams(selectedWorkspace._id);
            setLoading(false);
            setTeams([...(response?.data ?? [])]);
        };

        getWorkspaceTeams();
    }, [selectedWorkspace._id, setTeams, teams?.length]);

    return (
        <PageTemplate>
            {teams && (
                <ConversationFilter
                    teams={teams}
                    initialFilter={filter}
                    selectedWorkspace={selectedWorkspace}
                    onSubmit={(filter) => {
                        setFilter({ ...filter });
                    }}
                    disable={loading}
                    showAgentsTabs={true}
                />
            )}
        </PageTemplate>
    );
};

export default i18n(TabUsers) as FC<any>;
