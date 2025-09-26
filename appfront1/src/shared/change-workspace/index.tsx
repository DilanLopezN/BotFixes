import { FC, useCallback, useEffect, useState } from 'react';
import ClickOutside from 'react-click-outside';
import { VscListTree } from 'react-icons/vsc';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation, useRouteMatch } from 'react-router-dom';
import { Workspace } from '../../model/Workspace';
import i18n from '../../modules/i18n/components/i18n';
import { I18nProps } from '../../modules/i18n/interface/i18n.interface';
import { WorkspaceActions } from '../../modules/workspace/redux/actions';
import { WorkspaceService } from '../../modules/workspace/services/WorkspaceService';
import { Wrapper } from '../../ui-kissbot-v2/common';
import { Constants } from '../../utils/Constants';
import { getRecentlyWorkspacesLocal, list } from '../../utils/GetRecentlyWorkspaces';
import { parseQueryStringToObj } from '../../utils/parse-query-string-to-obj';
import NoResults from '../NoResults';
import { OptionItemWithLabel } from '../Page/styles';
import { SearchBar } from '../SearchBar/SearchBar';
import { Content, PopoverWrapper, WorkspaceCard, WorkspaceList } from './styles';

interface ChangeWorkspaceProps {}

const ChangeWorkspace: FC<ChangeWorkspaceProps & I18nProps> = ({ getTranslation }) => {
    const { search: qString } = useLocation();
    const { workspaceList, selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const dispatch = useDispatch();
    const match = useRouteMatch<{ [k: string]: string }>();
    const history = useHistory();

    const [visibleList, setVisibleList] = useState(false);
    const [recentlyWorkspaces, setRecentlyWorkspaces] = useState(getRecentlyWorkspacesLocal() || []);
    const [searchWorkspaceList, setSearchWorkspaceList] = useState<any>([]);
    const [search, setSearch] = useState('');
    const [selectWorkspace, setSelectWorkspace] = useState(0);

    const { workspaceId } = parseQueryStringToObj<{ workspaceId?: string }>(qString);

    const searchResult = useCallback(() => {
        setSelectWorkspace(0);
        if (search === '') {
            return setSearchWorkspaceList(workspaceList);
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
            return setSearchWorkspaceList(array);
        } else {
            setSearchWorkspaceList([]);
        }
    }, [search, workspaceList]);

    const selectWorkspaceDefault = useCallback(async () => {
        let workspaces: Workspace[];
        if (!workspaceList) {
            const response = await WorkspaceService.getWorkspaceList();
            workspaces = response?.data ?? [];
            dispatch(WorkspaceActions.setWorkspaceListNotAsync(workspaces) as any);
        } else {
            workspaces = workspaceList;
        }

        setSearchWorkspaceList(workspaces);

        const savedWorkspaceId = localStorage.getItem(Constants.LOCAL_STORAGE_MAP.CURRENT_WORKSPACE);
        const idWorkspace = workspaceId || (match.params.workspaceId ?? savedWorkspaceId);

        const workspaceSelected =
            workspaceList?.find((workspace: Workspace) => workspace._id === idWorkspace) ?? workspaceList?.[0];

        if (!workspaceSelected) {
            return;
        }

        dispatch(WorkspaceActions.setSelectedWorkspaceWithoutLoaders(workspaceSelected) as any);
    }, [dispatch, match.params.workspaceId, workspaceId, workspaceList]);

    const getModuleBasePath = (route: string) => {
        let newRoute = route;
        newRoute = newRoute.replace(/\/campaigns\/id\/.*/, '/campaigns');
        newRoute = newRoute.replace(/\/(bot|entities)\/[^/]+$/, '/$1');
        return newRoute;
    };

    const buildPathForNewWorkspace = (currentPath: string, newWorkspaceId: string) => {
        if (!currentPath.startsWith('/workspace/')) return currentPath;
        const parts = currentPath.split('/');
        if (parts.length > 2) {
            parts[2] = newWorkspaceId;
        }
        const replaced = parts.join('/');
        return getModuleBasePath(replaced);
    };

    const onChangeWorkspace = async (workspace: Workspace) => {
        if (!!workspace) {
            setRecentlyWorkspaces(getRecentlyWorkspacesLocal());
        }

        const topLevelRoutes = ['home', 'profile'];
        const currentRouteLevel = match.path?.split('/')?.[1] ?? '';

        if (topLevelRoutes.includes(currentRouteLevel)) {
            return;
        }

        const currentPath = history.location.pathname;
        const containsBotModule = /\/workspace\/.+\/bot(\/|$)/.test(currentPath);
        const containsEntitiesModule = /\/workspace\/.+\/entities(\/|$)/.test(currentPath);

        try {
            const botsResponse = await WorkspaceService.getWorkspaceBots(workspace._id);
            const bots = botsResponse?.data || [];
            dispatch(WorkspaceActions.setSelectedWorkspaceWithoutLoaders(workspace, bots) as any);

            let targetPath = buildPathForNewWorkspace(currentPath, workspace._id);

            if (containsBotModule) {
                targetPath = `/workspace/${workspace._id}`;
            } else if (containsEntitiesModule) {
                targetPath = `/workspace/${workspace._id}/entities`;
            } else {
                targetPath = `/workspace/${workspace._id}`;
            }

            if (targetPath !== currentPath) {
                history.push(targetPath);
            }
        } catch (e) {
            history.push(`/workspace/${workspace._id}`);
        }
    };

    const updateRecently = (workspaceId: string) => {
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

    const handleEvent = (event) => {
        const listWorkspace = list(searchWorkspaceList, recentlyWorkspaces);
        const elementSelected = document.getElementsByClassName('workspaceSelected');
        const containerList = document.getElementById('workspaceListContainer');

        if (!listWorkspace.length) return;

        if (event.key === 'ArrowDown') {
            if (selectWorkspace < listWorkspace.length - 1) {
                if (elementSelected[0].getBoundingClientRect().y > 850) {
                    containerList?.scrollTo(0, containerList?.scrollTop + 41);
                }
                setSelectWorkspace(selectWorkspace + 1);
            } else {
                setSelectWorkspace(0);
                containerList?.scrollTo(0, 0);
            }
        }

        if (event.key === 'ArrowUp') {
            if (selectWorkspace === 0) {
                setSelectWorkspace(listWorkspace.length - 1);
                containerList?.scrollTo(0, containerList?.scrollHeight);
            } else {
                if (elementSelected[0].getBoundingClientRect().y < 580) {
                    containerList?.scrollTo(0, containerList?.scrollTop - 41);
                }
                setSelectWorkspace(selectWorkspace - 1);
            }
        }

        if (event.key === 'Enter') {
            updateRecently(listWorkspace[selectWorkspace]._id);
            onChangeWorkspace(listWorkspace[selectWorkspace]);
            setVisibleList(false);
            setSelectWorkspace(0);
        }
    };

    useEffect(() => {
        const fetchWorkspaces = async () => {
            if (!selectedWorkspace) {
                await selectWorkspaceDefault();
                setRecentlyWorkspaces(getRecentlyWorkspacesLocal());
            }

            if (workspaceId) {
                history.replace(history.location.pathname);
            }
        };
        fetchWorkspaces();
    }, [history, selectWorkspaceDefault, selectedWorkspace, workspaceId]);

    useEffect(() => {
        searchResult();
    }, [searchResult]);

    return selectedWorkspace && workspaceList?.length > 0 ? (
        <OptionItemWithLabel
            onClick={selectedWorkspace && workspaceList?.length > 1 ? () => setVisibleList(true) : () => {}}
        >
            <span className='title' title={selectedWorkspace?.name}>
                {selectedWorkspace?.name}
            </span>
            <Content title={getTranslation('Change workspace')}>
                <VscListTree className='icon-menu' />
            </Content>
            {visibleList && (
                <ClickOutside
                    onClickOutside={() => {
                        setVisibleList(false);
                        setSelectWorkspace(0);
                    }}
                >
                    <PopoverWrapper id='content-change-workspace' onKeyDown={handleEvent}>
                        <Wrapper width='100%'>
                            <SearchBar onSearch={(event) => setSearch(event.target.value || '')} />
                        </Wrapper>
                        {searchWorkspaceList.length ? (
                            <WorkspaceList id={'workspaceListContainer'}>
                                {list(searchWorkspaceList, recentlyWorkspaces).map((workspace, index) => (
                                    <WorkspaceCard
                                        key={workspace._id}
                                        className={selectWorkspace === index ? 'workspaceSelected' : ' '}
                                        selected={selectedWorkspace._id === workspace._id}
                                        title={workspace.name}
                                        onClick={() => {
                                            setVisibleList(false);
                                            updateRecently(workspace._id);
                                            onChangeWorkspace(workspace);
                                        }}
                                    >
                                        <VscListTree />
                                        <div>
                                            <span>{workspace.name}</span>
                                        </div>
                                    </WorkspaceCard>
                                ))}
                            </WorkspaceList>
                        ) : (
                            <Wrapper width='230px' minHeight='40vh' maxHeight='40vh'>
                                <NoResults
                                    text={`${getTranslation("We didn't find any results, please try again")}.`}
                                />
                            </Wrapper>
                        )}
                    </PopoverWrapper>
                </ClickOutside>
            )}
        </OptionItemWithLabel>
    ) : null;
};

export default i18n(ChangeWorkspace) as FC<ChangeWorkspaceProps>;
