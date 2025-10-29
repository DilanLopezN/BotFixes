import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { HangTagsWrapperProps } from './props';
import I18n from '../../../../../i18n/components/i18n';
import { connect } from 'react-redux';
import { useParams, withRouter } from 'react-router-dom';
import { ScrollView } from '../../../ScrollView';
import Header from '../../../../../newChannelConfig/components/Header';
import { Tag } from '../../../../../liveAgent/components/TagSelector/props';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import EditTag from '../EditTag';
import SearchField from '../../../SearchField';
import HangTagsList from '../HangTagsList';
import { timeout } from '../../../../../../utils/Timer';
import { WorkspaceService } from '../../../../../workspace/services/WorkspaceService';
import { isAnySystemAdmin } from '../../../../../../utils/UserPermission';
import { Button, Pagination } from 'antd';
import { SearchFilters } from '../../../../interfaces/search-filters.interface';
import { ComponentManagerEnum } from '../../../../interfaces/component-manager.enum';
import { TextLink } from '../../../../../../shared/TextLink/styled';

const HangTagsWrapper: FC<HangTagsWrapperProps & I18nProps> = ({
    loggedUser,
    addNotification,
    getTranslation,
    match,
    history,
    workspaceId,
    location,
}) => {
    const getInitialComponent = useCallback(() => {
        const query = new URLSearchParams(location.search);

        if (!!query.get('tag')) {
            return ComponentManagerEnum.UPDATE_FORM;
        }
        return ComponentManagerEnum.LIST;
    }, [location.search]);
    const { tagsId } = useParams<{ tagsId?: string }>();
    const [currentComponent, setCurrentComponent] = useState<ComponentManagerEnum>(getInitialComponent());
    const [currentTag, setCurrentTag] = useState<Tag | undefined>(undefined);
    const [workspaceTags, setWorkspaceTags] = useState<Tag[]>([]);
    const [loadingRequest, setLoadingRequest] = useState(true);
    const [loading, setLoading] = useState<boolean>(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleBackToListClick = (event?): void => {
        event?.preventDefault();
        history.push(`/settings/tags`);
    };

    const handleUserCreation = (): void => {
        setCurrentTag(undefined);
        setCurrentComponent(ComponentManagerEnum.UPDATE_FORM);
    };

    const onEditTag = (tagId: string) => {
        const currTag = workspaceTags.find((tag) => tag._id === tagId);

        if (currTag) {
            setCurrentTag(currTag);
        }

        history.push(`/settings/tags/${tagId}`);
    };

    const onDeletedTag = (tagId: string) => {
        const newTags = workspaceTags.filter((tag) => tag._id !== tagId);
        setWorkspaceTags(newTags);

        if (currentComponent === ComponentManagerEnum.UPDATE_FORM) {
            handleBackToListClick();
        }
    };

    const [filters, setFilters] = useState<SearchFilters>({
        search: '',
        skip: 0,
        limit: 10,
        origin: '',
        total: 0,
    });

    const getTagById = async (tagId) => {
        const tag = await WorkspaceService.getTagWorkspace(workspaceId as string, tagId as string);

        if (!tag) {
            setCurrentTag(undefined);
            return history.push(`/settings/tags`);
        }
        setLoadingRequest(false);
        setCurrentTag(tag);
    };

    const getWorkspaceTags = async (newFilter: SearchFilters) => {
        const response = await WorkspaceService.workspaceTags(workspaceId as string, newFilter);

        if (response) {
            setWorkspaceTags(response?.data || []);
            setFilters({ ...newFilter, total: response.count });
        }

        timeout(() => setLoading(false), 100);
    };

    const onSearch = (filter: SearchFilters) => {
        setFilters({
            ...filter,
            origin: 'search',
            skip: 0,
        });
    };

    const isAdmin = isAnySystemAdmin(loggedUser);

    const newListTags = (tags) => {
        const listTags = tags.filter((tag) => {
            return isAdmin ? tag : !tag.name.includes('@sys') && tag;
        });

        return listTags;
    };

    useEffect(() => {
        if (currentComponent === ComponentManagerEnum.LIST) {
            if (filters.origin === 'search') {
                setLoading(true);
            }
            getWorkspaceTags(filters);
        }
    }, [filters.search, workspaceId, currentComponent]);

    useEffect(() => {
        if (tagsId) {
            getTagById(tagsId);
            setCurrentComponent(ComponentManagerEnum.UPDATE_FORM);
        } else {
            setCurrentComponent(ComponentManagerEnum.LIST);
        }
    }, [tagsId]);

    return (
        <>
            <Wrapper>
                <Header
                    title={
                        currentTag?.name ? (
                            <div style={{ display: 'flex' }}>
                                <TextLink href='#' onClick={handleBackToListClick}>
                                    {getTranslation('Tags')}
                                </TextLink>
                                <div style={{ margin: '0 7px' }}>{' / '}</div>
                                <div
                                    style={{
                                        width: '100%',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        marginBottom: '-15px',
                                    }}
                                >
                                    {currentTag?.name}
                                </div>
                            </div>
                        ) : (
                            getTranslation('Hang tags')
                        )
                    }
                    action={
                        currentComponent === ComponentManagerEnum.LIST ? (
                            <Button
                                onClick={() => handleUserCreation()}
                                className='antd-span-default-color'
                                type='primary'
                            >
                                {getTranslation('Add')}
                            </Button>
                        ) : undefined
                    }
                ></Header>
            </Wrapper>
            <ScrollView id='content-tags'>
                <Wrapper margin='0 auto' maxWidth='1100px' padding={'20px 30px'}>
                    {currentComponent === ComponentManagerEnum.LIST && (
                        <div ref={scrollRef}>
                            <Wrapper position='relative' left='60%' width='40%' margin='0 0 15px 0'>
                                <SearchField
                                    filters={filters}
                                    placeholder={'Find a tag'}
                                    onChange={(filter: SearchFilters) => onSearch(filter)}
                                />
                            </Wrapper>
                            <HangTagsList
                                loading={loading}
                                loadingMore={false}
                                workspaceTags={newListTags(workspaceTags)}
                                onEditTag={onEditTag}
                            />
                            {workspaceTags.length > 0 ? (
                                <Pagination
                                    style={{ display: 'flex', justifyContent: 'end', marginTop: '20px' }}
                                    total={filters.total || 0}
                                    pageSize={filters.limit}
                                    onChange={(page, pageSize) => {
                                        const newFilters: SearchFilters = {
                                            ...filters,
                                            skip: (page - 1) * filters.limit,
                                            limit: pageSize,
                                        };

                                        setFilters(newFilters);
                                        getWorkspaceTags(newFilters);
                                        if (scrollRef.current) {
                                            scrollRef.current.scrollIntoView({
                                                behavior: 'smooth',
                                                block: 'start',
                                            });
                                        }
                                    }}
                                    defaultCurrent={1}
                                    showSizeChanger
                                />
                            ) : null}
                        </div>
                    )}
                    {currentComponent === ComponentManagerEnum.UPDATE_FORM && loggedUser?._id && (
                        <EditTag
                            tag={currentTag}
                            onCancel={handleBackToListClick}
                            addNotification={addNotification}
                            workspaceId={workspaceId as string}
                            loggedUser={loggedUser}
                            onDeletedTag={onDeletedTag}
                            loadingRequest={loadingRequest}
                            editing={location.search ? true : false}
                        />
                    )}
                </Wrapper>
            </ScrollView>
        </>
    );
};

const mapStateToProps = (state: any, ownProps: any) => ({
    loggedUser: state.loginReducer.loggedUser,
});

export default I18n(withRouter(connect(mapStateToProps, null)(HangTagsWrapper)));
