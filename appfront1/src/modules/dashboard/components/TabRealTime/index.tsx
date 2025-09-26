import { Checkbox, Select, Space } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { FC, useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Team } from '../../../../model/Team';
import { PageTemplate } from '../../../../shared-v2/page-template';
import { TextLink } from '../../../../shared/TextLink/styled';
import { Icon, Wrapper } from '../../../../ui-kissbot-v2/common';
import { Constants } from '../../../../utils/Constants';
import { useLanguageContext } from '../../../i18n/context';
import { TeamService } from '../../../teams/services/TeamService';
import { useTeamsContext } from '../../context';
import { useAnalyticsRanges } from '../../utils/use-analytics-ranges';
import AbsolutePage from './components/AbsolutePage';
import TeamResume from './components/TeamResume';
import UserResume from './components/UserResume';
import { TabRealTimeComponentProps } from './props';

const SectionTitle = styled('div')`
    width: 100%;
    margin: 15px 0;
    display: flex;
    justify-content: center;
`;

const TabRealTime: FC<TabRealTimeComponentProps> = ({ selectedWorkspace }) => {
    const { teams, setTeams } = useTeamsContext();
    const { saveAnalyticsRange, initialAnalyticsRanges } = useAnalyticsRanges(
        Constants.LOCAL_STORAGE_MAP.DASHBOARD_REAL_TIME_TEAMS,
        selectedWorkspace
    );
    const { getTranslation } = useLanguageContext();
    const [expandedTeamResume, setExpandedTeamResume] = useState(false);
    const [expandedUserResume, setExpandedUserResume] = useState(false);
    const [workspaceTeams, setWorkspaceTeams] = useState<Team[] | undefined>(teams);
    const [selectedTeamId, setSelectedTeamId] = useState('ALL_TEAMS');
    const [hideInactiveTeams, setHideInactiveTeams] = useState(false);

    const handleHideInactiveTeamsChange = (e: CheckboxChangeEvent) => {
        const newValue = e.target.checked;
        setHideInactiveTeams(newValue);
        saveAnalyticsRange('hideInactiveTeams', newValue);
    };

    const filteredTeams = workspaceTeams?.filter((team) => {
        if (hideInactiveTeams) {
            return !team?.inactivatedAt;
        }
        return true;
    });

    const getWorkspaceTeams = useCallback(async () => {
        try {
            const response = await TeamService.getTeams(selectedWorkspace._id);
            setTeams([...(response?.data ?? [])]);
            setWorkspaceTeams([...(response?.data ?? [])]);
        } catch (error) {}
    }, [selectedWorkspace._id, setTeams]);

    useEffect(() => {
        getWorkspaceTeams();
    }, [getWorkspaceTeams]);

    useEffect(() => {
        if (initialAnalyticsRanges?.hideInactiveTeams !== undefined) {
            setHideInactiveTeams(initialAnalyticsRanges.hideInactiveTeams);
        }
    }, [initialAnalyticsRanges]);

    return (
        <PageTemplate >
            {workspaceTeams && (
                <>
                    {!expandedUserResume && (
                        <AbsolutePage expanded={expandedTeamResume} close={() => setExpandedTeamResume(false)}>
                            {!expandedTeamResume && (
                                <Wrapper flexBox justifyContent='flex-end' position='relative'>
                                    <TextLink
                                        href={`${window.location.origin}/public/real-time?workspaceId=${selectedWorkspace._id}`}
                                        target='_blank'
                                        title={getTranslation('Abrir relatório público')}
                                        style={{ position: 'absolute', bottom: '-48px', right: '40px' }}
                                    >
                                        {getTranslation('Abrir relatório público')}
                                    </TextLink>
                                    <Icon
                                        className='expand'
                                        size='fas fa-2x'
                                        style={{ position: 'absolute', bottom: '-60px' }}
                                        name='arrow-expand-all'
                                        title={getTranslation('Expand all')}
                                        onClick={() => setExpandedTeamResume(true)}
                                    />
                                </Wrapper>
                            )}
                            <SectionTitle style={expandedTeamResume ? { margin: 0 } : undefined}>
                                <h3>{getTranslation('Teams resume')}</h3>
                            </SectionTitle>
                            <Space size='middle' style={{ marginBottom: 16 }}>
                                <span>{getTranslation('Hide inactive teams')}:</span>
                                <Checkbox checked={hideInactiveTeams} onChange={handleHideInactiveTeamsChange} />
                            </Space>
                            <TeamResume
                                selectedWorkspace={selectedWorkspace}
                                teams={filteredTeams}
                                expanded={expandedTeamResume}
                            />
                        </AbsolutePage>
                    )}
                    {!expandedTeamResume && (
                        <AbsolutePage expanded={expandedUserResume} close={() => setExpandedUserResume(false)}>
                            {!expandedUserResume && (
                                <Wrapper flexBox justifyContent='flex-end' position='relative'>
                                    <Icon
                                        className='expand'
                                        size='fas fa-2x'
                                        style={{ position: 'absolute', bottom: '-60px' }}
                                        name='arrow-expand-all'
                                        title={getTranslation('Expand all')}
                                        onClick={() => setExpandedUserResume(true)}
                                    />
                                </Wrapper>
                            )}
                            <SectionTitle style={expandedUserResume ? { margin: 0 } : undefined}>
                                <h3>{getTranslation('Agents resume')}</h3>
                            </SectionTitle>
                            <Space size='middle' style={{ marginBottom: 16 }}>
                                <span>{getTranslation('Teams')}:</span>
                                <Select
                                    style={{ width: 260 }}
                                    value={selectedTeamId}
                                    onChange={setSelectedTeamId}
                                    showSearch
                                    optionFilterProp='children'
                                    filterOption={(search, option) => {
                                        return (option?.children as unknown as string)
                                            ?.toLowerCase()
                                            .trim()
                                            .includes(search.toLowerCase().trim());
                                    }}
                                >
                                    <Select.Option value='ALL_TEAMS'>{getTranslation('All')}</Select.Option>
                                    {filteredTeams?.map((team) => {
                                        return (
                                            <Select.Option key={team._id} value={team._id}>
                                                {team.name}
                                            </Select.Option>
                                        );
                                    })}
                                </Select>
                            </Space>
                            <UserResume
                                selectedWorkspace={selectedWorkspace}
                                selectedTeamId={selectedTeamId}
                                expanded={expandedUserResume}
                            />
                        </AbsolutePage>
                    )}
                </>
            )}
        </PageTemplate>
    );
};

export default TabRealTime;
