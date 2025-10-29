import { CloseCircleOutlined } from '@ant-design/icons';
import { Button, Col, Form, Pagination, Row, Select, Tooltip, Typography } from 'antd';
import { debounce } from 'lodash';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { connect, useSelector } from 'react-redux';
import { useParams, withRouter } from 'react-router-dom';
import { TextLink } from '../../../../../../shared/TextLink/styled';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { timeout } from '../../../../../../utils/Timer';
import { isAnySystemAdmin } from '../../../../../../utils/UserPermission';
import I18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { TemplateCategory, TemplateMessage } from '../../../../../liveAgent/components/TemplateMessageList/interface';
import Header from '../../../../../newChannelConfig/components/Header';
import { ChannelConfigService } from '../../../../../newChannelConfig/service/ChannelConfigService';
import { WorkspaceService } from '../../../../../workspace/services/WorkspaceService';
import { useTemplateTypeContext } from '../../../../context';
import { ComponentManagerEnum } from '../../../../interfaces/component-manager.enum';
import { SearchFilters } from '../../../../interfaces/search-filters.interface';
import { WorkspaceChannels } from '../../../Billing/components/WorkspaceBillingSpecification/interface';
import { ScrollView } from '../../../ScrollView';
import { TemplateVariableContextProvider } from '../DraftEditor/context';
import EditTemplate, { emptyTemplate } from '../EditTemplate';
import ModalSelectTypeTemplate from '../ModalSelectTypeTemplate';
import TemplateList from '../TemplateList';
import { Search, TemplateWrapperProps } from './props';

const TemplateWrapper: FC<TemplateWrapperProps & I18nProps> = (props) => {
    const { menuSelected, loggedUser, addNotification, match, getTranslation, history, location } = props;
    const { selectedFilter, setSelectedFilter } = useTemplateTypeContext();

    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const getInitialComponent = useCallback(() => {
        const query = new URLSearchParams(location.search);

        if (!!query.get('template')) {
            return ComponentManagerEnum.UPDATE_FORM;
        }
        return ComponentManagerEnum.LIST;
    }, [location.search]);

    const [currentComponent, setCurrentComponent] = useState<ComponentManagerEnum>(getInitialComponent());
    const { templateId } = useParams<{ templateId?: string }>();
    const [editingTemplate, setEditingTemplate] = useState<TemplateMessage | undefined>(undefined);
    const [templates, setTemplates] = useState<TemplateMessage[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingRequest, setLoadingRequest] = useState(true);
    const [openModalCreate, setOpenModalCreate] = useState<boolean>(false);
    const [channelIds, setChannelIds] = useState<string[]>([]);
    const [isCreatingNewTemplate, setIsCreatingNewTemplate] = useState<boolean>(false);

    const isAnyAdmin = isAnySystemAdmin(loggedUser);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleBackToListClick = (event?): void => {
        event?.preventDefault();
        history.push(`/settings/templates`);
        setIsCreatingNewTemplate(false);
    };

    const handleTemplateCreation = (isHsm: boolean): void => {
        const storedMessage = localStorage.getItem('templateSuggestionMessage');
        
        const newTemplate = {
            ...emptyTemplate,
            isHsm: isHsm,
            message: storedMessage || '',
        };
        
        if (storedMessage) {
            localStorage.removeItem('templateSuggestionMessage');
        }
        
        history.push(`/settings/templates`);
        
        setLoadingRequest(false);
        setOpenModalCreate(false);
        setEditingTemplate(newTemplate);
        setIsCreatingNewTemplate(true);
        setCurrentComponent(ComponentManagerEnum.UPDATE_FORM);
    };

    const workspaceId = match.params.workspaceId || props.workspaceId;

    const getTemplateById = async (templateId) => {
        const template = await WorkspaceService.getTemplate(workspaceId as string, templateId as string);

        if (!template) {
            setEditingTemplate(editingTemplate || emptyTemplate);
            return history.push(`/settings/templates`);
        }

        setLoadingRequest(false);
        setEditingTemplate({ ...template });
    };

    const getAllTemplate = async (newFilter: SearchFilters) => {
        const response = await WorkspaceService.getTemplates(newFilter, workspaceId);

        if (response) {
            let templates = response?.data ?? [];
            setTemplates(templates);
            setSelectedFilter({ ...newFilter, total: response.count });
        }

        timeout(() => setLoading(false), 100);
    };

    const onCreatedTemplate = () => {
        history.push(`/settings/templates`);
        setCurrentComponent(ComponentManagerEnum.LIST);
        setIsCreatingNewTemplate(false);
    };

    const onDeletedTemplate = (templateId: string) => {
        const newTemplates = templates.filter((template) => template._id !== templateId);
        setTemplates(newTemplates);

        if (currentComponent === ComponentManagerEnum.UPDATE_FORM) {
            handleBackToListClick();
        }
    };

    const onEditTemplate = (templateId: string) => {
        const currTemplate = templates.find((template) => template._id === templateId);

        if (currTemplate) {
            setEditingTemplate(currTemplate);
        }

        history.push(`/settings/templates/${templateId}`);
    };

    const onUpdatedTemplate = () => {
        history.push(`/settings/templates`);
        setEditingTemplate(undefined);
        setCurrentComponent(ComponentManagerEnum.LIST);
        setIsCreatingNewTemplate(false);

        setLoading(true);
        setLoadingRequest(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        debouncedSearch(e.target.value, selectedFilter, setSelectedFilter);
    };

    const filterTemplateType = () => {
        if (selectedFilter.filter?.isHsm) {
            return 1;
        } else if (selectedFilter.filter?.isHsm === false) {
            return 2;
        } else {
            return undefined;
        }
    };

    const filterTemplateActive = () => {
        if (selectedFilter.filter?.active) {
            return 'ACTIVE';
        } else if (selectedFilter.filter?.active === false) {
            return 'INACTIVE';
        } else {
            return undefined;
        }
    };

    const filterTemplateCategory = (): TemplateCategory | undefined => {
        const orConditions = selectedFilter.filter?.$or;

        if (Array.isArray(orConditions) && orConditions.length > 0) {
            const categoryValue = orConditions.some((condition) => {
                return Object.values(condition).some((val) => val === TemplateCategory.UTILITY);
            });

            return categoryValue ? TemplateCategory.UTILITY : TemplateCategory.MARKETING;
        }

        return undefined;
    };

    const handleSelectTemplate = (value: number | undefined) => {
        setLoading(true);

        let updatedFilter: Partial<SearchFilters> = {
            ...selectedFilter,
            filter: {
                ...selectedFilter.filter,
                isHsm: value === 1 ? true : value === 2 ? false : undefined,
            },
        };

        if (value === 1) {
            updatedFilter.filter.isHsm = true;
        } else if (value === 2) {
            updatedFilter.filter.isHsm = false;
        } else {
            delete updatedFilter.filter.isHsm;
        }

        const combinedFilter = { ...selectedFilter, ...updatedFilter };

        Object.keys(combinedFilter.filter).forEach(
            (key) => combinedFilter.filter[key] === undefined && delete combinedFilter.filter[key]
        );

        setSelectedFilter(combinedFilter);
        getAllTemplate(combinedFilter);
    };

    const handleIsActiveChange = (value: string | undefined) => {
        setLoading(true);

        let updatedFilter: Partial<SearchFilters> = {
            ...selectedFilter,
            filter: {
                ...selectedFilter.filter,
                active: value === 'ACTIVE' ? true : value === 'INACTIVE' ? false : undefined,
            },
        };

        if (value === 'ACTIVE') {
            updatedFilter.filter.active = true;
        } else if (value === 'INACTIVE') {
            updatedFilter.filter.active = false;
        }

        const combinedFilter = { ...selectedFilter, ...updatedFilter };

        Object.keys(combinedFilter.filter).forEach(
            (key) => combinedFilter.filter[key] === undefined && delete combinedFilter.filter[key]
        );

        setSelectedFilter(combinedFilter);
        getAllTemplate(combinedFilter);
    };

    const handleCategoryChange = (value: TemplateCategory | undefined) => {
        setLoading(true);

        let updatedFilter: Partial<SearchFilters> = {
            ...selectedFilter,
            filter: {
                ...selectedFilter.filter,
                $or: value
                    ? channelIds.map((channelId) => ({
                          [`wabaResult.${channelId}.category`]:
                              value === TemplateCategory.UTILITY ? 'UTILITY' : 'MARKETING',
                      }))
                    : undefined,
            },
        };

        if (value) {
            updatedFilter.filter.$or = channelIds.map((channelId) => ({
                [`wabaResult.${channelId}.category`]: value === TemplateCategory.UTILITY ? 'UTILITY' : 'MARKETING',
            }));
        } else {
            delete updatedFilter.filter.$or;
        }

        const combinedFilter = { ...selectedFilter, ...updatedFilter };

        setSelectedFilter(combinedFilter);
        getAllTemplate(combinedFilter);
    };

    const debouncedSearch = debounce((value: string, selectedFilter, setSelectedFilter) => {
        const filter = { ...selectedFilter, search: value, origin: 'search', skip: 0 };
        setSelectedFilter(filter);
        getAllTemplate(filter);
    }, 500);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const fetchChannelConfigList = async () => {
        setLoading(true);
        const response: any[] | null = await ChannelConfigService.getChannelConfigList(workspaceId);
        if (response) {
            const validChannelIds = response
                .filter((template) => template.channelId === WorkspaceChannels.gupshup)
                .map((template) => template._id)
                .filter((id): id is string => !!id);

            setChannelIds(validChannelIds);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchChannelConfigList();
    }, []);

    useEffect(() => {
        if (templateId) {
            getTemplateById(templateId);
            setCurrentComponent(ComponentManagerEnum.UPDATE_FORM);
            setIsCreatingNewTemplate(false);
        } else if (isCreatingNewTemplate) {
            setIsCreatingNewTemplate(true);
            setLoadingRequest(false)
            setCurrentComponent(ComponentManagerEnum.UPDATE_FORM);
        } else if (!isCreatingNewTemplate) {
            setCurrentComponent(ComponentManagerEnum.LIST);
        }
    }, [templateId, isCreatingNewTemplate]);

    useEffect(() => {
        if (currentComponent === ComponentManagerEnum.LIST) {
            if (selectedFilter.origin === 'search') {
                setLoading(true);
            }
            getAllTemplate(selectedFilter);
        }
    }, [workspaceId, currentComponent]);

    return (
        <>
            <ModalSelectTypeTemplate
                open={openModalCreate}
                onCancel={() => {
                    setOpenModalCreate(false);
                }}
                footer={null}
                title={getTranslation('Select the type of template you want to create')}
                handleTemplateCreation={handleTemplateCreation}
            />
            <Wrapper>
                <Header
                    title={
                        editingTemplate?.name ? (
                            <div className='antd-span-default-color' style={{ display: 'flex', maxWidth: '80%' }}>
                                <TextLink href='#' onClick={handleBackToListClick}>
                                    {getTranslation(`${menuSelected.title}`)}
                                </TextLink>
                                <div style={{ margin: '0 7px' }}>{' / '}</div>
                                <Typography.Text ellipsis> {editingTemplate.name}</Typography.Text>
                            </div>
                        ) : (
                            menuSelected.title
                        )
                    }
                    action={
                        currentComponent === ComponentManagerEnum.LIST ? (
                            <Button
                                className='antd-span-default-color'
                                type='primary'
                                onClick={() => {
                                    if (selectedWorkspace?.featureFlag?.createTemplateWhatsappOfficial || isAnyAdmin) {
                                        setOpenModalCreate(true);
                                        return;
                                    }
                                    handleTemplateCreation(false);
                                }}
                            >
                                {getTranslation('Add')}
                            </Button>
                        ) : undefined
                    }
                ></Header>
            </Wrapper>
            <ScrollView id='content-templates'>
                <Wrapper margin='0 auto' maxWidth='1100px' padding={'20px 30px'}>
                    {currentComponent === ComponentManagerEnum.LIST && (
                        <div ref={scrollRef}>
                            <Row justify={'space-between'} style={{ marginBottom: '24px' }}>
                                <Col span={5}>
                                    {isAnyAdmin ? (
                                        <Form.Item labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}>
                                            <Select
                                                placeholder={getTranslation('Select a category')}
                                                value={filterTemplateCategory()}
                                                onChange={handleCategoryChange}
                                                allowClear
                                                onClear={() => handleCategoryChange(undefined)}
                                                clearIcon={
                                                    <Tooltip title={getTranslation('Clear Selection')}>
                                                        <CloseCircleOutlined />
                                                    </Tooltip>
                                                }
                                            >
                                                <Select.Option value={TemplateCategory.UTILITY}>
                                                    {getTranslation('Utility template')}
                                                </Select.Option>
                                                <Select.Option value={TemplateCategory.MARKETING}>
                                                    {getTranslation('Marketing template')}
                                                </Select.Option>
                                            </Select>
                                        </Form.Item>
                                    ) : null}
                                </Col>
                                <Col span={4}>
                                    <Form.Item labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}>
                                        <Select
                                            placeholder={getTranslation('Select a status')}
                                            value={filterTemplateActive()}
                                            onChange={handleIsActiveChange}
                                            allowClear
                                            onClear={() => handleIsActiveChange(undefined)}
                                            clearIcon={
                                                <Tooltip title={getTranslation('Clear Selection')}>
                                                    <CloseCircleOutlined />
                                                </Tooltip>
                                            }
                                        >
                                            <Select.Option value='ACTIVE'>{getTranslation('Active')}</Select.Option>
                                            <Select.Option value='INACTIVE'>{getTranslation('Inactive')}</Select.Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}>
                                        <Select
                                            placeholder='Selecione um tipo de template'
                                            value={filterTemplateType()}
                                            onChange={(value) => handleSelectTemplate(value)}
                                            onClear={() => handleSelectTemplate(undefined)}
                                            allowClear
                                            clearIcon={
                                                <Tooltip title={getTranslation('Clear Selection')}>
                                                    <CloseCircleOutlined />
                                                </Tooltip>
                                            }
                                        >
                                            <Select.Option value={1}>
                                                {getTranslation('Official template')}
                                            </Select.Option>
                                            <Select.Option value={2}>
                                                {getTranslation('Unofficial template')}
                                            </Select.Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}>
                                        <Search
                                            placeholder={getTranslation('Search for templates by name or message')}
                                            defaultValue={selectedFilter.search}
                                            onChange={handleChange}
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <TemplateList
                                workspaceId={workspaceId}
                                templates={templates}
                                onEditTemplate={onEditTemplate}
                                loading={loading}
                                loadingMore={false}
                                editingTemplateId={editingTemplate && editingTemplate._id}
                                user={loggedUser}
                            />
                            {(selectedFilter?.total || 0) > 0 ? (
                                <Pagination
                                    style={{ display: 'flex', justifyContent: 'end', marginTop: '20px' }}
                                    total={selectedFilter.total || 0}
                                    pageSize={selectedFilter.limit}
                                    onChange={(page, pageSize) => {
                                        const newFilters: SearchFilters = {
                                            ...selectedFilter,
                                            skip: (page - 1) * selectedFilter.limit,
                                            limit: pageSize,
                                        };
                                        setSelectedFilter(newFilters);
                                        getAllTemplate(newFilters);
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

                    {currentComponent === ComponentManagerEnum.UPDATE_FORM && loggedUser._id && (
                        <TemplateVariableContextProvider>
                            <EditTemplate
                                setCurrentComponent={setCurrentComponent}
                                onUpdatedTemplate={onUpdatedTemplate}
                                onCreatedTemplate={onCreatedTemplate}
                                template={editingTemplate}
                                onCancel={handleBackToListClick}
                                addNotification={addNotification}
                                user={loggedUser}
                                workspaceId={workspaceId}
                                onDeletedTemplate={onDeletedTemplate}
                                loadingRequest={loadingRequest}
                                setLoadingRequest={setLoadingRequest}
                                editing={location.search ? true : false}
                            />
                        </TemplateVariableContextProvider>
                    )}
                </Wrapper>
            </ScrollView>
        </>
    );
};

const mapStateToProps = (state: any, ownProps: any) => ({});

export default I18n(withRouter(connect(mapStateToProps, null)(TemplateWrapper)));
