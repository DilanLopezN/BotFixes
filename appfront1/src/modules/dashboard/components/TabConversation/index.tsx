import { FC, useEffect, useState } from 'react';
import { TabConversationProps } from './props';

import { Wrapper } from '../../../../ui-kissbot-v2/common';

import { Team } from '../../../../model/Team';
import { PageTemplate } from '../../../../shared-v2/page-template';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { TeamService } from '../../../teams/services/TeamService';
import { useTeamsContext } from '../../context';
import ChartWrapper from '../ChartWrapper';
import ConversationFilter, { getDefaultFilter } from '../ConversationFilter';
import { ConversationFilterInterface } from '../ConversationFilter/props';
import HighChartAttendanceAvg from './components/HighChartAttendanceAvg';
import HighChartAwaitingWorkingTimeAvg from './components/HighChartAwaitingWorkingTimeAvg';
import HighChartTotal from './components/HighChartTotal';

const TabConversation: FC<TabConversationProps & I18nProps> = ({ selectedWorkspace, getTranslation }) => {
    const { teams, setTeams } = useTeamsContext();

    const [filter, setFilter] = useState<ConversationFilterInterface>(getDefaultFilter(selectedWorkspace._id));
    const [loading, setLoading] = useState(true);
    const [workspaceTeams, setWorkspaceTeams] = useState<Team[] | undefined>(teams);

    const getWorkspaceTeams = async () => {
        if (teams?.length) {
            return;
        }

        const response = await TeamService.getTeams(selectedWorkspace._id);
        setTeams([...(response?.data ?? [])]);
        setWorkspaceTeams([...(response?.data ?? [])]);
    };

    useEffect(() => {
        getWorkspaceTeams();
    }, []);

    const onLoading = (event) => {
        setLoading(event);
    };

    return (
        <PageTemplate>
            {workspaceTeams && (
                <>
                    <Wrapper>
                        <ConversationFilter
                            teams={workspaceTeams}
                            initialFilter={filter}
                            selectedWorkspace={selectedWorkspace}
                            onSubmit={(filter) => {
                                setFilter({ ...filter });
                            }}
                            disable={loading}
                        />
                    </Wrapper>

                    <Wrapper flexBox>
                        <ChartWrapper>
                            <HighChartTotal filter={filter} teams={workspaceTeams} onLoading={onLoading} />
                        </ChartWrapper>
                    </Wrapper>

                    <Wrapper flexBox>
                        <ChartWrapper>
                            <HighChartAttendanceAvg filter={filter} onLoading={onLoading} />
                        </ChartWrapper>
                    </Wrapper>

                    <Wrapper flexBox>
                        <ChartWrapper>
                            <HighChartAwaitingWorkingTimeAvg filter={filter} onLoading={onLoading} />
                        </ChartWrapper>
                    </Wrapper>
                </>
            )}
        </PageTemplate>
    );
};

export default i18n(TabConversation) as FC<TabConversationProps>;
