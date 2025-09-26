import { FC } from 'react';
import { AiOutlineComment, AiOutlinePartition, AiOutlineSetting } from 'react-icons/ai';
import { VscListTree } from 'react-icons/vsc';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { WorkspaceActions as WorkspaceReduxActions } from '../../../workspace/redux/actions';
import { WorkspaceCardProps } from './props';
import { Content, WorkspaceInfo, WorkspaceActions } from './styles';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { isAnySystemAdmin, isSystemAdmin, isWorkspaceAdmin } from '../../../../utils/UserPermission';
import { Constants } from '../../../../utils/Constants';
import { WorkspaceService } from '../../../workspace/services/WorkspaceService';
import { Space, Tag, Tooltip } from 'antd';
import { isArray } from 'lodash';

const WorkspaceCard: FC<WorkspaceCardProps & I18nProps> = ({ workspace, getTranslation, selected }) => {
    const history = useHistory();
    const dispatch = useDispatch();

    const updateRecently = (workspaceId) => {
        try {
            const saved = localStorage.getItem(Constants.LOCAL_STORAGE_MAP.RECENTLY_WORKSPACES);
            if (saved && typeof saved === 'string') {
                const parsed = JSON.parse(saved);
                const existWorkspaceId = parsed.items.find((id: string) => id === workspaceId);
                if (existWorkspaceId) parsed.items = parsed.items.filter((id) => id !== workspaceId);

                parsed.items.push(workspaceId);
                localStorage.setItem(Constants.LOCAL_STORAGE_MAP.RECENTLY_WORKSPACES, JSON.stringify(parsed));
            } else {
                localStorage.setItem(
                    Constants.LOCAL_STORAGE_MAP.RECENTLY_WORKSPACES,
                    JSON.stringify({
                        items: [workspaceId],
                    })
                );
            }
        } catch (error) {
            localStorage.removeItem(Constants.LOCAL_STORAGE_MAP.RECENTLY_WORKSPACES);
        }
    };

    const handleLiveAgentClick = (ev) => {
        if (workspace.restrictedIp) {
            return;
        }
        ev.stopPropagation();
        dispatch(WorkspaceReduxActions.setSelectedWorkspaceWithoutLoaders(workspace) as any);
        updateRecently(workspace._id);
        history.push(`/live-agent`);
    };

    const handleBotsClick = async (ev) => {
        if (workspace.restrictedIp) {
            return;
        }
        ev.stopPropagation();

        const response = await WorkspaceService.getWorkspaceBots(workspace._id);

        dispatch(WorkspaceReduxActions.setSelectedWorkspaceWithoutLoaders(workspace, response.data) as any);
        updateRecently(workspace._id);

        if (response?.data?.length > 1 || !response?.data?.length) {
            return history.push(`/workspace/${workspace._id}`);
        }
        return history.push(`/workspace/${workspace._id}/bot/${response.data[0]._id}`);
    };
    const handleSettingsClick = (ev) => {
        if (workspace.restrictedIp) {
            return;
        }
        ev.stopPropagation();
        dispatch(WorkspaceReduxActions.setSelectedWorkspaceWithoutLoaders(workspace) as any);
        updateRecently(workspace._id);
        history.push('/settings/tags');
    };

    const { loggedUser } = useSelector((state: any) => state.loginReducer);
    const userAnyIsAdmin = isAnySystemAdmin(loggedUser);
    const userIsWorkspaceAdmin = isWorkspaceAdmin(loggedUser, workspace._id);
    const userSystemAdmin = isSystemAdmin(loggedUser);

    const handleCardClick = () => {
        if (userAnyIsAdmin) {
            return handleBotsClick;
        }
        return handleLiveAgentClick;
    };

    if (!isArray(workspace.integrationStatus)) {
        workspace.integrationStatus = [];
    }

    const integrations = workspace.integrationStatus || [];
    const hasOfflineIntegration = integrations.some((integration) => !integration.online);

    return (
        <Content
            selected={selected}
            disabled={workspace.restrictedIp ?? false}
            clickable={true}
            onClick={handleCardClick()}
            title={`${getTranslation('Go to')} ${workspace.name}`}
        >
            <WorkspaceInfo>
                <VscListTree />
                <div>
                    <span>{workspace.name}</span>
                    {workspace.restrictedIp && (
                        <span style={{ color: '#af2929' }}>
                            {' '}
                            - <b>Acesso bloqueado</b> contate seu supervisor
                        </span>
                    )}
                </div>
            </WorkspaceInfo>
            <WorkspaceActions clickable={!workspace.restrictedIp}>
                <Space style={{ marginRight: '10px' }}>
                    {userAnyIsAdmin && hasOfflineIntegration ? (
                        <Tooltip
                            title={integrations
                                .filter((integration) => {
                                    return !integration.online;
                                })
                                .map((integration) => {
                                    const status = integration.online ? 'Online' : 'Offline';
                                    const since = new Date(integration.since).toLocaleString();
                                    return (
                                        <>
                                            <strong>{integration.name}</strong>
                                            {` ${status} ${getTranslation('since')} ${since}`}
                                            <br />
                                        </>
                                    );
                                })}
                            overlayStyle={{ whiteSpace: 'pre-wrap', maxWidth: '300em' }}
                        >
                            <Tag color='red'>{getTranslation('Offline Integration')}</Tag>
                        </Tooltip>
                    ) : null}
                </Space>
                <Space style={{ marginRight: '10px' }}>
                    {userSystemAdmin && !workspace?.dialogFlowAccount ? (
                        <Tag color='orange'>{getTranslation('No DialogFlow')}</Tag>
                    ) : null}
                </Space>
                <AiOutlineComment title={getTranslation('Attendances')} onClick={handleLiveAgentClick} />
                {userAnyIsAdmin ? (
                    <>
                        <AiOutlinePartition title={getTranslation('Bots')} onClick={handleBotsClick} />
                    </>
                ) : null}
                {userIsWorkspaceAdmin || userAnyIsAdmin ? (
                    <>
                        <AiOutlineSetting title={getTranslation('Settings')} onClick={handleSettingsClick} />
                    </>
                ) : null}
            </WorkspaceActions>
        </Content>
    );
};

export default i18n(WorkspaceCard) as FC<WorkspaceCardProps>;
