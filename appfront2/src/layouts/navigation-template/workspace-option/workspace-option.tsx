import { Input, Popover } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { VscListTree } from 'react-icons/vsc';
import { Link, useLocation, useParams } from 'react-router-dom';
import { LOCAL_STORAGE_KEYS } from '~/constants/local-storage-keys';
import { useSelectedWorkspace } from '~/hooks/use-selected-workspace';
import { useWorkspaceList } from '~/hooks/use-workspace-list';
import { localeKeys } from '~/i18n';
import { getRecentlyWorkspaces } from '~/utils/get-recently-workspaces';
import { getUrlWithWorkspaceId } from '~/utils/get-url-with-workspace-id';
import { EmptyIcon } from './icons/empty-icon';
import { orderWorkspaceByFavorites } from './order-workspace-by-favorites';
import {
  Container,
  Content,
  NoResultIconContainer,
  NoResultsFoundContainer,
  NotResultsMessage,
  OptionItemWithLabel,
  PopoverWrapper,
  SearchBarContainer,
  WorkspaceCard,
  WorkspaceList,
  WorkspaceName,
} from './styles';

export const WorkspaceOption = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const location = useLocation();
  const selectedWorkspace = useSelectedWorkspace();
  const { t } = useTranslation();
  const { data: paginatedWorkspaceList } = useWorkspaceList();
  const [isPopoverOpened, setIsPopoverOpened] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');

  const { data: workspaceList = [] } = paginatedWorkspaceList || {};
  const recentlyWorkspaces = getRecentlyWorkspaces();

  const filteredWorkspaces = workspaceList.filter((workspace) => {
    const normalizedWorkspaceName = workspace.name.trim().toLowerCase();
    const normalizedSearchInputValue = searchInputValue.trim().toLocaleLowerCase();
    return normalizedWorkspaceName.includes(normalizedSearchInputValue);
  });

  const updateRecently = (wSpaceId: string) => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.RECENTLY_WORKSPACES);
      if (saved && typeof saved === 'string') {
        const parsed = JSON.parse(saved);
        const existWorkspaceId = parsed.items.find((id: string) => id === wSpaceId);
        if (existWorkspaceId) parsed.items = parsed.items.filter((id: string) => id !== wSpaceId);

        parsed.items.push(wSpaceId);
        localStorage.setItem(LOCAL_STORAGE_KEYS.RECENTLY_WORKSPACES, JSON.stringify(parsed));
      } else {
        localStorage.setItem(
          LOCAL_STORAGE_KEYS.RECENTLY_WORKSPACES,
          JSON.stringify({
            items: [wSpaceId],
          })
        );
      }
    } catch (error) {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.RECENTLY_WORKSPACES);
    }
  };

  const content = (
    <PopoverWrapper>
      <SearchBarContainer>
        <Input.Search
          autoFocus
          type='text'
          placeholder={t(localeKeys.navigationSideBar.changeWorkspace.searchInputPlaceholder)}
          value={searchInputValue}
          onChange={(event) => setSearchInputValue(event.target.value)}
          aria-label='Search'
        />
      </SearchBarContainer>
      {filteredWorkspaces.length ? (
        <WorkspaceList>
          {orderWorkspaceByFavorites(filteredWorkspaces, recentlyWorkspaces).map((workspace) => {
            const pathName = getUrlWithWorkspaceId({
              pathname: location.pathname,
              workspaceId: workspace._id,
            });

            return (
              <Link key={workspace._id} to={pathName}>
                <WorkspaceCard
                  selected={workspace._id === workspaceId}
                  title={workspace.name}
                  onClick={() => {
                    setIsPopoverOpened(false);
                    updateRecently(workspace._id);
                  }}
                >
                  <VscListTree />
                  <WorkspaceName>{workspace.name}</WorkspaceName>
                </WorkspaceCard>
              </Link>
            );
          })}
        </WorkspaceList>
      ) : (
        <NoResultsFoundContainer>
          <NoResultIconContainer>
            <EmptyIcon style={{ height: 150 }} />
          </NoResultIconContainer>
          <NotResultsMessage>
            {t(localeKeys.navigationSideBar.changeWorkspace.notFoundMessage)}
          </NotResultsMessage>
        </NoResultsFoundContainer>
      )}
    </PopoverWrapper>
  );

  return (
    <Container>
      <Popover
        content={content}
        trigger='click'
        open={isPopoverOpened}
        onOpenChange={setIsPopoverOpened}
        placement='right'
      >
        <OptionItemWithLabel>
          <span className='title' title={selectedWorkspace.name}>
            {selectedWorkspace.name}
          </span>
          <Content title={t(localeKeys.navigationSideBar.changeWorkspace.changeWorkspaceMenuItem)}>
            <VscListTree className='icon-menu' />
          </Content>
        </OptionItemWithLabel>
      </Popover>
    </Container>
  );
};
