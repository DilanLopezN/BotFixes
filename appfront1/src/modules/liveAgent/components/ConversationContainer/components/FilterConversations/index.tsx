import { FC, useState, useEffect } from 'react';
import { FilterConversationsProps } from './props';
import { Wrapper, Badge } from '../../../../../../ui-kissbot-v2/common';
import I18n from '../../../../../i18n/components/i18n';
import FilterConversationsForm from '../FilterConversationsForm';
import { WorkspaceService } from '../../../../../workspace/services/WorkspaceService';
import { SettingsService } from '../../../../../settings/service/SettingsService';
import { Team } from '../../../../../../model/Team';
import { ChannelIdConfig, User } from 'kissbot-core';
import { PaginatedModel } from '../../../../../../model/PaginatedModel';
import { WorkspaceUserService } from '../../../../../settings/service/WorkspaceUserService';
import getDefaultTags from '../../../../../../utils/default-tags';
import { ChannelConfig } from '../../../../../../model/Bot';
import { ChannelConfigService } from '../../../../../newChannelConfig/service/ChannelConfigService';
import { useSelector } from 'react-redux';

const FilterConversations: FC<FilterConversationsProps> = ({
    onClose,
    appliedFilters,
    onFiltersApply,
    getTranslation,
    workspaceId,
    loggedUser,
}) => {
    const [filters, setFilters]: any = useState({});
    const [workspaceTags, setWorkspaceTags]: any = useState([]);
    const [workspaceTeams, setWorkspaceTeams] = useState<Team[]>([]);
    const [workspaceChannelConfigs, setWorkspaceChannelConfigs] = useState<ChannelConfig[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [qtdAppliedFilters, setQtdAppliedFilters] = useState<number>(0);

    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);

    const initialInfinity = {
        limit: 25,
        actual: 0,
        hasMore: true,
    };

    useEffect(() => {
        setFilters(appliedFilters || {});
        getWorkspaceTags();
        getWorkspaceTeams();
        getChannelConfigs();
        fetchWorkspaceUsers();
    }, []);

    useEffect(() => {
        setFilters(appliedFilters || {});
    }, [appliedFilters]);

    const transformToQueryFilter = (filters: any) => {
        let formValues = { ...filters };

        if (formValues.tab) delete formValues.tab;
        if (formValues.search) delete formValues.search;
        if (formValues.formValues) delete formValues.formValues;

        return { ...filters, formValues };
    };

    const getWorkspaceTags = async () => {
        if (!workspaceId) return;
        const remiEnabled = selectedWorkspace?.userFeatureFlag?.enableRemi;

        const defaultTags = getDefaultTags(selectedWorkspace._id).filter((tag) => {
            if (['@remi.assume', '@remi.finaliza'].includes(tag.name)) {
                return remiEnabled;
            }
            return true;
        });

        const response = await WorkspaceService.workspaceTags(workspaceId);
        const dynamicTags = response?.data ?? [];

        setWorkspaceTags([...defaultTags, ...dynamicTags]);
    };

    const getWorkspaceTeams = async () => {
        const teamList = await SettingsService.getTeams({}, workspaceId);
        setWorkspaceTeams([...(teamList?.data || [])]);
    };

    const getChannelConfigs = async () => {
        const filter = {
            workspaceId: workspaceId,
            channelId: ChannelIdConfig.gupshup,
            enable: true,
        };

        const data = await ChannelConfigService.getChannelsConfig(filter);
        return setWorkspaceChannelConfigs(data || []);
    };

    async function fetchWorkspaceUsers() {
        if (workspaceId) {
            const response: PaginatedModel<User> = await WorkspaceUserService.getAll(workspaceId, 'name');

            if (response?.data.length) {
                setUsers(response.data);
            }
        }
    }

    const clearFilters = () => {
        onFiltersApply(
            initialInfinity,
            {
                tab: appliedFilters.tab,
                search: appliedFilters.search,
                formValues: {},
                sort: appliedFilters.sort,
            },
            true
        );

        setFilters({});
        onClose();
    };

    return (
        <div style={{ height: '100%' }}>
            <Wrapper
                padding='10px 15px'
                className='mb-3'
                flexBox
                alignItems='center'
                justifyContent='space-between'
                margin='0px!important'
            >
                <Badge margin='5px' bgColor='#aaa'>
                    {`${qtdAppliedFilters} ${getTranslation('applied filters')}`}
                </Badge>
                <Wrapper cursor='pointer' fontSize='13px' onClick={() => clearFilters()}>
                    {getTranslation('Clear filters')}
                </Wrapper>
            </Wrapper>
            <FilterConversationsForm
                workspaceTags={workspaceTags}
                workspaceTeams={workspaceTeams}
                workspaceChannelConfigs={workspaceChannelConfigs}
                appliedFilters={filters}
                onApplyFilters={(filters) => {
                    setFilters(filters);
                    onFiltersApply(initialInfinity, transformToQueryFilter(filters));
                    onClose();
                }}
                users={users}
                qtdApplyFilters={(qtd) => {
                    setQtdAppliedFilters(qtd);
                }}
                workspaceId={workspaceId}
                userId={loggedUser._id as string}
            />
        </div>
    );
};

export default I18n(FilterConversations);
