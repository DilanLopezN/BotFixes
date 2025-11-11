import { FC, useEffect, useState } from 'react';
import { GraphicsWrapperProps } from './props';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import GraphicsForm from '../GraphicsForm';
import GraphicList from '../GraphicList';
import { TeamService } from '../../../../../teams/services/TeamService';
import { Team } from '../../../../../../model/Team';
import { ConversationTemplate, TemplateGroupInterface } from '../../interfaces/conversation-template-interface';
import { DashboardService } from '../../../../services/DashboardService';
import { Tag } from '../../../../../liveAgent/components/TagSelector/props';
import { ChannelIdConfig, User } from 'kissbot-core';
import { WorkspaceService } from '../../../../../workspace/services/WorkspaceService';
import { WorkspaceUserService } from '../../../../../settings/service/WorkspaceUserService';
import getDefaultTags from '../../../../../../utils/default-tags';
import EmptyDashboardGroup from '../EmptyDashboardGroup';
import { isAnySystemAdmin } from '../../../../../../utils/UserPermission';
import orderBy from 'lodash/orderBy';
import { useTeamsContext } from '../../../../context';
import { ChannelConfigService } from '../../../../../newChannelConfig/service/ChannelConfigService';
import { ChannelConfig } from '../../../../../../model/Bot';
import { useConversationOutcomes } from '../../hooks/use-conversation-outcomes';
import { useConversationObjectives } from '../../hooks/use-conversation-objectives';

export interface PeriodFilterInterface {
    endDate: string;
    startDate: string;
}

const GraphicsWrapper: FC<GraphicsWrapperProps & I18nProps> = ({
    selectedWorkspace,
    conversationTemplate,
    setConversationTemplate,
    loggedUser,
    setTemplateGroup,
    templateGroup,
    setCanAddChart,
    getTranslation,
}) => {
    const { teams, setTeams } = useTeamsContext();

    const [loading, setLoading] = useState(true);
    const [workspaceTeams, setWorkspaceTeams] = useState<Team[] | undefined>(teams);
    const [conversationTemplates, setConversationTemplates] = useState<ConversationTemplate[]>([]);
    const [workspaceTags, setWorkspaceTags] = useState<Tag[]>([]);
    const [workspaceUsers, setWorkspaceUsers] = useState<User[]>([]);
    const [templateGroups, setTemplateGroups] = useState<TemplateGroupInterface[]>([]);
    const [dashboardSelected, setDashboardSelected] = useState<TemplateGroupInterface | undefined>(undefined);
    const [workspaceChannelConfigs, setWorkspaceChannelConfigs] = useState<ChannelConfig[]>([]);
    const [workspaceReferrals, setWorkspaceReferrals] = useState<{ source_id: string }[]>([]);
    const { conversationOutcomes } = useConversationOutcomes();
    const { conversationObjectives } = useConversationObjectives();
    const getWorkspaceTeams = async () => {
        try {
            if (teams?.length) {
                setWorkspaceTeams(orderBy([...(teams ?? [])], 'name'));
                return;
            }

            const response = await TeamService.getTeams(selectedWorkspace._id);
            if (response) {
                setTeams([...(response?.data ?? [])]);
                setWorkspaceTeams(orderBy([...(response?.data ?? [])], 'name'));
            }
        } catch (e) {
            console.log('error on load teams', e);
        }
    };

    const getWorkspaceTags = async () => {
        try {
            if (!selectedWorkspace) return;

            const response = await WorkspaceService.workspaceTags(selectedWorkspace._id);
            if (response) {
                setWorkspaceTags([...getDefaultTags(selectedWorkspace._id), ...[...(response?.data ?? [])]]);
            }
        } catch (e) {
            console.log('error on load tags', e);
        }
    };

    const getWorkspaceUsers = async () => {
        try {
            const response = await WorkspaceUserService.getAll(selectedWorkspace._id, 'name');
            if (response?.data) {
                setWorkspaceUsers(response.data);
            }
        } catch (e) {
            console.log('error on load users', e);
        }
    };

    const getConversationTemplates = async () => {
        try {
            if (!dashboardSelected?._id) return;

            const response = await DashboardService.getConversationTemplates(
                selectedWorkspace._id,
                dashboardSelected._id
            );
            if (response) {
                setConversationTemplates(response);
            }
        } catch (e) {
            console.log('error on load conversationTemplates', e);
        }
    };

    const getChannelConfigs = async () => {
        const filter = {
            workspaceId: selectedWorkspace._id,
            // channelId: ChannelIdConfig.gupshup,
            enable: true,
        };

        const data = await ChannelConfigService.getChannelsConfig(filter);
        return setWorkspaceChannelConfigs(data || []);
    };

    const getTemplateGroups = async () => {
        try {
            const response = await DashboardService.getTemplateGroups(selectedWorkspace._id);
            if (response) {
                setLoading(false);
                setTemplateGroups(response);

                const selectedExist = response.find((templateGroup) => templateGroup?._id === dashboardSelected?._id);
                if (!dashboardSelected || !selectedExist) {
                    setDashboardSelected(response[0]);
                }
            }
        } catch (e) {
            console.log('error on load TemplateGroups', e);
        }
    };

    const getWorkspaceReferrals = async () => {
        try {
            if (!selectedWorkspace) return;

            const response = await DashboardService.getReferralsByWorkspaceId(selectedWorkspace._id);
            if (response) {
                setWorkspaceReferrals(response);
            }
        } catch (e) {
            console.log('error on load referrals', e);
        }
    };

    useEffect(() => {
        getWorkspaceTeams();
        getTemplateGroups();
        getWorkspaceTags();
        getWorkspaceUsers();
        getChannelConfigs();
        getWorkspaceReferrals();
    }, []);

    const permissionToAddChart = () => {
        if (isAnySystemAdmin(loggedUser) || dashboardSelected?.ownerId === loggedUser._id) {
            return true;
        }

        if (dashboardSelected?.shared && dashboardSelected.globalEditable) {
            return true;
        }

        return false;
    };

    useEffect(() => {
        if (dashboardSelected?._id) {
            getConversationTemplates();
            setCanAddChart(permissionToAddChart());
        } else {
            setCanAddChart(false);
        }
    }, [dashboardSelected]);

    const onLoading = (event) => {
        setLoading(event);
    };

    const closeForm = (value?: ConversationTemplate, value2?: TemplateGroupInterface) => {
        if (value) {
            const newConversationTemplates = conversationTemplates.map((template) => {
                if (template._id === value._id) {
                    return value;
                }
                return template;
            });
            setConversationTemplate(undefined);
            return setConversationTemplates(newConversationTemplates);
        }

        if (value2) {
            const newTemplateGroups = templateGroups.map((templateGroup) => {
                if (templateGroup._id === value2._id) {
                    return value2;
                }
                return templateGroup;
            });
            setTemplateGroup(undefined);
            return setTemplateGroups(newTemplateGroups);
        }

        setConversationTemplate(undefined);
        setTemplateGroup(undefined);
    };

    const gupshupChannels = () => {
        return workspaceChannelConfigs.filter((channelConfig) => channelConfig.channelId === ChannelIdConfig.gupshup);
    };

    return (
        <Wrapper width='100%' height='100%'>
            {
                <GraphicsForm
                    closeForm={closeForm}
                    conversationTemplate={conversationTemplate}
                    selectedWorkspace={selectedWorkspace}
                    loggedUser={loggedUser}
                    teams={workspaceTeams || []}
                    getConversationTemplates={getConversationTemplates}
                    users={workspaceUsers}
                    tags={workspaceTags}
                    conversationOutcomes={conversationOutcomes}
                    conversationObjectives={conversationObjectives}
                    setConversationTemplate={setConversationTemplate}
                    templateGroup={templateGroup}
                    setTemplateGroup={setTemplateGroup}
                    getTemplateGroups={getTemplateGroups}
                    dashboardSelected={dashboardSelected}
                    workspaceChannelConfigs={gupshupChannels()}
                    workspaceReferrals={workspaceReferrals}
                />
            }
            {templateGroups && !templateGroups.length ? (
                <EmptyDashboardGroup
                    text={
                        <span>
                            {getTranslation('You still not')}
                            <br />
                            {getTranslation('has no dashboard')}
                        </span>
                    }
                />
            ) : (
                workspaceTeams &&
                dashboardSelected && (
                    <GraphicList
                        loggedUser={loggedUser}
                        selectedWorkspace={selectedWorkspace}
                        teams={workspaceTeams}
                        onLoading={(event) => onLoading(event)}
                        loading={loading}
                        conversationTemplates={
                            conversationTemplate
                                ? [{ ...conversationTemplate, groupId: dashboardSelected?._id || '' }]
                                : conversationTemplates
                        }
                        setConversationTemplates={setConversationTemplates}
                        users={workspaceUsers}
                        tags={workspaceTags}
                        conversationOutcomes={conversationOutcomes}
                        conversationObjectives={conversationObjectives}
                        setConversationTemplate={setConversationTemplate}
                        conversationTemplate={conversationTemplate}
                        getConversationTemplates={getConversationTemplates}
                        templateGroup={templateGroup}
                        templateGroups={templateGroups}
                        dashboardSelected={dashboardSelected}
                        setDashboardSelected={(value?: TemplateGroupInterface) => setDashboardSelected(value)}
                        setTemplateGroup={setTemplateGroup}
                        getTemplateGroups={getTemplateGroups}
                        workspaceChannelConfigs={workspaceChannelConfigs}
                    />
                )
            )}
        </Wrapper>
    );
};

export default i18n(GraphicsWrapper) as FC<GraphicsWrapperProps>;
