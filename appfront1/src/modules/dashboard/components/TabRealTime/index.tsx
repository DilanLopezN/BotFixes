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
import SavedViews from './components/SavedViews';
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
    const { initialAnalyticsRanges } = useAnalyticsRanges(
        Constants.LOCAL_STORAGE_MAP.DASHBOARD_REAL_TIME_TEAMS,
        selectedWorkspace
    );
    const { getTranslation } = useLanguageContext();
    const [expandedTeamResume, setExpandedTeamResume] = useState(false);
    const [expandedUserResume, setExpandedUserResume] = useState(false);
    const [workspaceTeams, setWorkspaceTeams] = useState<Team[] | undefined>(teams);
    const [selectedTeamId, setSelectedTeamId] = useState('ALL_TEAMS');
    const [hideInactiveTeams, setHideInactiveTeams] = useState(false);
    const [currentConfigBase64, setCurrentConfigBase64] = useState<string | null>(null);

    const handleHideInactiveTeamsChange = (e: CheckboxChangeEvent) => {
        const newValue = e.target.checked;
        setHideInactiveTeams(newValue);
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

    const generateCurrentConfigBase64 = useCallback(() => {
        try {
            const teamResumeFilters = (window as any).__getTeamResumeFilters?.() || null;
            const userResumeFilters = (window as any).__getUserResumeFilters?.() || null;

            const config = {
                selectedTeamId,
                hideInactiveTeams,
                teamResumeFilters,
                userResumeFilters,
            };

            return window.btoa(JSON.stringify(config));
        } catch (error) {
            console.error('Erro ao gerar base64 da configuração:', error);
            return null;
        }
    }, [selectedTeamId, hideInactiveTeams]);

    const loadSavedView = useCallback((configBase64: string) => {
        try {
            const decoded = JSON.parse(window.atob(configBase64));

            if (decoded.selectedTeamId !== undefined) {
                setSelectedTeamId(decoded.selectedTeamId);
            }

            if (decoded.hideInactiveTeams !== undefined) {
                setHideInactiveTeams(decoded.hideInactiveTeams);
            }

            // Load filters in child components
            if (decoded.teamResumeFilters && (window as any).__loadTeamResumeFilters) {
                (window as any).__loadTeamResumeFilters(decoded.teamResumeFilters);
            }

            if (decoded.userResumeFilters && (window as any).__loadUserResumeFilters) {
                (window as any).__loadUserResumeFilters(decoded.userResumeFilters);
            }
        } catch (error) {
            console.error('Erro ao carregar visão salva:', error);
        }
    }, []);

    const handleResetFilters = useCallback(() => {
        setSelectedTeamId('ALL_TEAMS');
        setHideInactiveTeams(false);

        // Reset filters in child components
        if ((window as any).__resetTeamResumeFilters) {
            (window as any).__resetTeamResumeFilters();
        }
        if ((window as any).__resetUserResumeFilters) {
            (window as any).__resetUserResumeFilters();
        }
    }, []);

    useEffect(() => {
        const configBase64 = generateCurrentConfigBase64();
        setCurrentConfigBase64(configBase64);
    }, [generateCurrentConfigBase64]);

    return (
        <PageTemplate>
            {workspaceTeams && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                        <SavedViews
                            currentViewConfig={currentConfigBase64}
                            onLoadView={loadSavedView}
                            onResetFilters={handleResetFilters}
                            workspaceId={selectedWorkspace?._id}
                            generateConfig={generateCurrentConfigBase64}
                        />
                    </div>

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
                                        style={{ position: 'absolute', bottom: '-48px' }}
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
                                onResetFilters={handleResetFilters}
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
                                onResetFilters={handleResetFilters}
                            />
                        </AbsolutePage>
                    )}
                </>
            )}
        </PageTemplate>
    );
};

export default TabRealTime;
