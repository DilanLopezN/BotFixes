import { Space, Tag, Tooltip } from 'antd';
import Search from 'antd/lib/input/Search';
import { UserRoles } from 'kissbot-core';
import { FC, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { Workspace } from '../../../../model/Workspace';
import SkeletonLines from '../../../../shared/skeleton-lines';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { getRecentlyWorkspacesLocal, list } from '../../../../utils/GetRecentlyWorkspaces';
import { isAnySystemAdmin } from '../../../../utils/UserPermission';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { WorkspaceService } from '../../../workspace/services/WorkspaceService';
import CardEmptyWorkspaces from '../../components/card-empty-workspaces';
import CardProfile from '../../components/card-profile';
import WorkspaceCard from '../../components/workspace-card';
import { HomeProps } from './props';
import { CardInfo, Page, WorkspaceListArea, WrapperInfo } from './styles';

const Home: FC<HomeProps & I18nProps> = ({ getTranslation, selectedWorkspace, loggedUser }) => {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [fetching, setFetching] = useState(true);
    const [recentlyWorkspaces, setRecentlyWorkspaces] = useState([]);
    const [search, setSearch] = useState('');
    const [workspaceList, setworkspaceList] = useState<Workspace[]>([]);
    const [workspaceDataIntegrationStatus, setWorkspaceDataIntegrationStatus] = useState<any[]>([]);

    useEffect(() => {
        //este if serve para não fazer a requisição de listagem de workspaces diversas vezes,
        //pois esta sendo feita no componente change-workspace
        if (!selectedWorkspace) {
            return;
        }

        getWorkspaces();
        setRecentlyWorkspaces(getRecentlyWorkspacesLocal());
    }, [selectedWorkspace]);

    useEffect(() => {
        setRecentlyWorkspaces(getRecentlyWorkspacesLocal());
    }, [selectedWorkspace]);

    useEffect(() => {
        searchResult();
    }, [search]);  

    const getWorkspaces = async () => {
        try {
            setFetching(true);
            const response = await WorkspaceService.getWorkspaceList();
            setWorkspaces(response?.data ?? []);
            setworkspaceList(response?.data ?? []);
            setWorkspaceDataIntegrationStatus(response?.data ?? []);
        } catch (error) {
            console.log('error', error);
        } finally {
            setFetching(false);
        }
    };

    const searchResult = () => {
        if (!workspaceList) {
            return;
        }

        if (search === '') {
            return setWorkspaces(workspaceList);
        }

        const array = workspaceList.filter((workspace) => {
            return workspace.name
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .includes(
                    search
                        .toLocaleLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                );
        });

        if (array.length) {
            return setWorkspaces(array as Workspace[]);
        } else {
            setWorkspaces([]);
        }
    };

    const getView = () => {
        const isUserInactive = loggedUser.roles?.some((role) => role.role === UserRoles.WORKSPACE_INACTIVE);

        if (isUserInactive) {
            return (
                <CardEmptyWorkspaces>
                    <p>
                        <span>{`${getTranslation("You don't have access to any workspace")}.`}</span>
                        <span>
                            {getTranslation('Entre em contato com seu')} <b>supervisor</b>
                            {` ${getTranslation('e solicite liberação')}`}
                        </span>
                    </p>
                </CardEmptyWorkspaces>
            );
        }

        if (fetching) {
            return (
                <SkeletonLines
                    rows={1}
                    size={3}
                    style={{
                        height: '46px',
                        padding: '8px 10px',
                        margin: '5px 0',
                        borderRadius: '5px',
                    }}
                />
            );
        }

        if (workspaces.length) {
            return list(workspaces, recentlyWorkspaces).map((workspace) => (
                <WorkspaceCard
                    key={workspace._id}
                    workspace={workspace}
                    selected={workspace._id === selectedWorkspace?._id}
                />
            ));
        }

        if (search && !workspaces.length) {
            return (
                <CardEmptyWorkspaces>
                    <p>
                        <span>{getTranslation("We didn't find any results, please try again")}</span>
                    </p>
                </CardEmptyWorkspaces>
            );
        }

        return (
            <CardEmptyWorkspaces>
                <p>
                    <span>{`${getTranslation("You don't have access to any workspace")}.`}</span>
                    <span>
                        {getTranslation('Entre em contato com seu')} <b>supervisor</b>
                        {` ${getTranslation('e solicite liberação')}`}
                    </span>
                </p>
            </CardEmptyWorkspaces>
        );
    };

    const userAnyIsAdmin = isAnySystemAdmin(loggedUser);

    const hasIntegrationStatusOff = workspaceDataIntegrationStatus.filter((workspace) =>
        workspace?.integrationStatus?.some((status) => !status.online)
    );

    const amountIntegrationOff = workspaceDataIntegrationStatus
        .filter((workspace) => workspace?.integrationStatus?.some((status) => !status.online))
        ?.flatMap((objeto) => objeto.integrationStatus.filter((status) => !status.online)).length;

    const translatorButton = () => {
        if (amountIntegrationOff > 1) {
            return getTranslation('Offline Integrations');
        } else {
            return getTranslation('Offline Integration');
        }
    };
    return (
        <Page>
            <WorkspaceListArea>
                <WrapperInfo>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <CardInfo>
                            <h4>{getTranslation('Workspaces')}</h4>
                            <span style={{ fontSize: '15px', color: '#898989' }}>
                                {getTranslation('Workspaces you have access to. Click to browse')}
                            </span>
                        </CardInfo>
                        <CardProfile />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            {hasIntegrationStatusOff.length && userAnyIsAdmin ? (
                                <Space style={{ margin: '8px 0 0 10px' }}>
                                    <Tooltip
                                        title={
                                            <>
                                                {workspaceDataIntegrationStatus
                                                    .filter((workspace) =>
                                                        workspace.integrationStatus.some((status) => !status.online)
                                                    )
                                                    .map((objeto) => {
                                                        const { name, integrationStatus } = objeto;
                                                        return (
                                                            <>
                                                                <>
                                                                    <br />
                                                                    <strong>{name}</strong>
                                                                    <br />
                                                                </>
                                                                {integrationStatus
                                                                    .filter((status) => status.online === false)
                                                                    .map((valor) => (
                                                                        <>
                                                                            <strong>{valor.name}</strong>
                                                                            {` ${
                                                                                valor.online ? 'Online' : 'Offline'
                                                                            } ${getTranslation('since')} ${new Date(
                                                                                valor.since
                                                                            ).toLocaleString()}`}
                                                                            <br />
                                                                        </>
                                                                    ))}
                                                            </>
                                                        );
                                                    })}
                                            </>
                                        }
                                        overlayStyle={{ whiteSpace: 'pre-wrap', maxWidth: '300em' }}
                                    >
                                        <Tag
                                            style={{
                                                height: '30px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                            color='red'
                                        >
                                            {`( ${amountIntegrationOff} ) ${translatorButton()}`}
                                        </Tag>
                                    </Tooltip>
                                </Space>
                            ) : null}
                        </div>
                        <div>
                            {workspaceList?.length > 1 ? (
                                <>
                                    <Wrapper flexBox justifyContent='flex-end' margin='20px 0 5px  0'>
                                        <Wrapper width='450px'>
                                            <Search
                                                autoFocus
                                                style={{
                                                    height: '38px',
                                                }}
                                                placeholder={getTranslation('Search')}
                                                onChange={(ev: any) => setSearch(ev.target.value)}
                                                allowClear
                                            />
                                        </Wrapper>
                                    </Wrapper>
                                </>
                            ) : null}
                        </div>
                    </div>
                </WrapperInfo>
                {getView()}
            </WorkspaceListArea>
        </Page>
    );
};

const mapStateToProps = (state) => ({
    loggedUser: state.loginReducer.loggedUser,
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
});

export default withRouter(i18n(connect(mapStateToProps)(Home)));
