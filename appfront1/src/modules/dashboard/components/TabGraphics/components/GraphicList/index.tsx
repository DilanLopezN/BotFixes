import moment from 'moment';
import { FC, useEffect, useState } from 'react';
import '../../../../../../../node_modules/react-grid-layout/css/styles.css';
import '../../../../../../../node_modules/react-resizable/css/styles.css';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { isAnySystemAdmin } from '../../../../../../utils/UserPermission';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import Header from '../../../../../newChannelConfig/components/Header';
import { ChartType, ConversationTemplate } from '../../interfaces/conversation-template-interface';
import HighChartColumn from './GraphicsTypes/GraphicColumn/index';
import HighChartLine from './GraphicsTypes/GraphicLine/index';
import HighChartPizza from './GraphicsTypes/GraphicPizza/index';
import GraphicTable from './GraphicsTypes/GraphicTable/index';
import { GraphicListProps } from './props';

import { Responsive, WidthProvider } from 'react-grid-layout';
import locale from 'rsuite/locales/pt_BR';
import { Constants } from '../../../../../../utils/Constants';
import { DashboardService } from '../../../../services/DashboardService';
import TemplateGroupList from '../TemplateGroupList';

import DateRangePicker from 'rsuite/DateRangePicker';
import 'rsuite/dist/rsuite.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export interface PeriodFilterInterface {
    endDate: string;
    startDate: string;
}

interface FilterSelect {
    [loggedUserId: string]: PeriodFilterInterface;
}

const defaultFilter = {
    startDate: moment().startOf('day').subtract(7, 'day').format('YYYY-MM-DDTHH:mm:ss'),
    endDate: moment().endOf('day').format('YYYY-MM-DDTHH:mm:ss'),
};

export const getDefaultFilter = (dashboardSelectedId): PeriodFilterInterface => {
    const localStorageFilter = getAppliedFilters();
    if (localStorageFilter?.[dashboardSelectedId]) {
        return { ...localStorageFilter[dashboardSelectedId] };
    }
    return defaultFilter;
};

const localStorageGraphicsFilterToken = Constants.LOCAL_STORAGE_MAP.DASHBOARD_FILTER_GRAPHICS;

const getAppliedFilters = () => {
    const filterSelected = localStorage.getItem(localStorageGraphicsFilterToken);
    if (typeof filterSelected !== 'string') {
        localStorage.removeItem(localStorageGraphicsFilterToken);
        return {};
    }
    const removeLocal = () => localStorage.removeItem(localStorageGraphicsFilterToken);

    try {
        const obj = JSON.parse(filterSelected);
        if (obj && typeof obj === 'object' && obj !== null) {
            const parsedFilters = JSON.parse(filterSelected);
            return parsedFilters;
        }
    } catch (err) {
        removeLocal();
    }
};

const GraphicList: FC<GraphicListProps & I18nProps> = ({
    selectedWorkspace,
    loggedUser,
    onLoading,
    loading,
    teams,
    conversationTemplates,
    setConversationTemplates,
    users,
    tags,
    setConversationTemplate,
    conversationTemplate,
    getConversationTemplates,
    templateGroup,
    getTemplateGroups,
    setDashboardSelected,
    setTemplateGroup,
    templateGroups,
    dashboardSelected,
    getTranslation,
    workspaceChannelConfigs,
    conversationObjectives,
    conversationOutcomes,
}) => {
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilterInterface>(
        getDefaultFilter(dashboardSelected?._id)
    );

    useEffect(() => {
        setSelectedPeriod(getDefaultFilter(dashboardSelected?._id));
    }, [dashboardSelected]);

    const saveFilters = (filters: PeriodFilterInterface) => {
        if (selectedWorkspace) {
            const replFilter: FilterSelect = {
                ...getAppliedFilters(),
                [dashboardSelected?._id as string]: {
                    ...filters,
                },
            };
            localStorage.setItem(localStorageGraphicsFilterToken, JSON.stringify(replFilter));
            setSelectedPeriod(filters);
        }
    };

    const updateLayout = (layout: any[]) => {
        if (!layout) return;

        if (conversationTemplate) return;

        let conversationTemplatesChanged: any[] = [];

        conversationTemplates.forEach((template) => {
            const position = layout.find((e) => e.i === template._id);

            if (position) {
                if (
                    position.x !== template.position[0] ||
                    position.y !== template.position[1] ||
                    position.w !== template.position[2] ||
                    position.h !== template.position[3]
                ) {
                    conversationTemplatesChanged.push({
                        id: template._id,
                        position: [position.x, position.y, position.w, position.h],
                    });
                }
            }
        });

        if (conversationTemplatesChanged.length) {
            const conversationTemplatesUpdate: ConversationTemplate[] = [];

            const newConversationTemplates = conversationTemplates.map((template) => {
                const templateChanged = conversationTemplatesChanged.find((element) => element.id === template._id);

                if (templateChanged) {
                    conversationTemplatesUpdate.push({
                        ...template,
                        position: templateChanged.position,
                    });

                    return {
                        ...template,
                        position: templateChanged.position,
                    };
                }
                return template;
            });

            if (conversationTemplatesUpdate.length) {
                DashboardService.updatePositionConversationTemplates(selectedWorkspace._id, {
                    templates: conversationTemplatesUpdate,
                });
                setConversationTemplates(newConversationTemplates);
            }
        }
    };

    const deleteConversationTemplate = async (templateId) => {
        try {
            const response = await DashboardService.deleteConversationTemplate(selectedWorkspace._id, templateId);
            if (response) {
                getConversationTemplates();
            }
        } catch (e) {
            console.log('error on delete conversationTemplate', e);
        }
    };

    const disabledDate = (current) => {
        return current && current > moment().endOf('day');
    };

    const canEdit = (templateId) => {
        if (conversationTemplate?._id === templateId) {
            return true;
        }

        if (isAnySystemAdmin(loggedUser) || dashboardSelected?.ownerId === loggedUser._id) {
            return false;
        }

        if (dashboardSelected?.shared && dashboardSelected.globalEditable) {
            return false;
        }

        return true;
    };
    return (
        <Wrapper width='100%' height='100%'>
            <DateRangePicker
                style={{
                    width: '250px',
                    display: 'flex',
                    justifyContent: 'right',
                    alignItems: 'center',
                    gap: '15px',
                    marginBottom: '16px',
                }}
                size='lg'
                ranges={[]}
                placement='auto'
                cleanable
                format={'dd/MM/yy'}
                character=' - '
                disabled={loading}
                shouldDisableDate={disabledDate}
                placeholder={getTranslation('Select period')}
                locale={locale.DateRangePicker}
                value={[new Date(selectedPeriod.startDate), new Date(selectedPeriod.endDate)]}
                onChange={(date) => {
                    if (!date?.[0] || !date?.[1]) {
                        saveFilters({
                            startDate: moment().startOf('day').format('YYYY-MM-DDTHH:mm:ss'),
                            endDate: moment().endOf('day').format('YYYY-MM-DDTHH:mm:ss'),
                        });
                        return;
                    }

                    const startDate = moment(date[0]).startOf('day').format('YYYY-MM-DDTHH:mm:ss');
                    const endDate = moment(date[1]).endOf('day').format('YYYY-MM-DDTHH:mm:ss');

                    saveFilters({ startDate, endDate });
                }}
            />
            <TemplateGroupList
                templateGroups={
                    conversationTemplate && dashboardSelected
                        ? [dashboardSelected]
                        : templateGroup
                        ? [templateGroup]
                        : templateGroups
                }
                dashboardSelected={dashboardSelected}
                setDashboardSelected={setDashboardSelected}
                loggedUser={loggedUser}
                setTemplateGroup={setTemplateGroup}
                selectedWorkspace={selectedWorkspace}
                getTemplateGroups={getTemplateGroups}
                conversationTemplates={conversationTemplates}
                children={
                    <ResponsiveGridLayout
                        margin={[10, 10]}
                        breakPoints={{ lg: 1500, md: 1200, sm: 900, xs: 700, xxs: 500 }}
                        cols={{ lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }}
                        rowHeight={10}
                        width={1500}
                        resizeHandles={['se', 'ne', 'sw', 'nw']}
                        useCSSTransforms
                        onLayoutChange={(layout) => {
                            updateLayout(layout);
                        }}
                        style={{ background: '#ffffff', marginTop: '-16px', minHeight: '400px' }}
                    >
                        {!templateGroup &&
                            conversationTemplates[0]?.groupId === dashboardSelected?._id &&
                            conversationTemplates.map((template, index) => {
                                return (
                                    <div
                                        key={`${template._id}${
                                            conversationTemplate?._id === template._id ? index : ''
                                        }`}
                                        data-grid={{
                                            x: conversationTemplate?._id === template._id ? 0 : template.position[0],
                                            y: conversationTemplate?._id === template._id ? 0 : template.position[1],
                                            w: conversationTemplate?._id === template._id ? 4 : template.position[2],
                                            h: conversationTemplate?._id === template._id ? 21 : template.position[3],
                                            minH: 21,
                                            minW: 3,
                                            maxW: 12,
                                            maxH: 35,
                                            isBounded: true,
                                            static: canEdit(template._id),
                                        }}
                                        style={{ background: '#fff', padding: '5px', overflow: 'hidden', zIndex: 3 }}
                                    >
                                        {template.chartType === ChartType.bar ? (
                                            <HighChartColumn
                                                onLoading={onLoading}
                                                selectedPeriod={selectedPeriod}
                                                selectedWorkspace={selectedWorkspace}
                                                teams={teams}
                                                keyGrid={`${template._id}
                                            -${template.position[0]}
                                            -${template.position[1]}
                                            -${template.position[2]}
                                            -${template.position[3]}
                                        `}
                                                template={template}
                                                users={users}
                                                tags={tags}
                                                conversationOutcomes={conversationOutcomes}
                                                conversationObjectives={conversationObjectives}
                                                setConversationTemplate={setConversationTemplate}
                                                deleteConversationTemplate={deleteConversationTemplate}
                                                editingConversationTemplate={template._id !== conversationTemplate?._id}
                                                canEdit={canEdit}
                                                workspaceChannelConfigs={workspaceChannelConfigs}
                                            />
                                        ) : template.chartType === ChartType.pizza ? (
                                            <HighChartPizza
                                                onLoading={onLoading}
                                                selectedPeriod={selectedPeriod}
                                                selectedWorkspace={selectedWorkspace}
                                                teams={teams}
                                                keyGrid={`${template._id}
                                                -${template.position[0]}
                                                -${template.position[1]}
                                                -${template.position[2]}
                                                -${template.position[3]}
                                            `}
                                                template={template}
                                                users={users}
                                                tags={tags}
                                                conversationOutcomes={conversationOutcomes}
                                                conversationObjectives={conversationObjectives}
                                                setConversationTemplate={setConversationTemplate}
                                                deleteConversationTemplate={deleteConversationTemplate}
                                                editingConversationTemplate={template._id !== conversationTemplate?._id}
                                                canEdit={canEdit}
                                                workspaceChannelConfigs={workspaceChannelConfigs}
                                            />
                                        ) : template.chartType === ChartType.line ? (
                                            <HighChartLine
                                                onLoading={onLoading}
                                                selectedPeriod={selectedPeriod}
                                                selectedWorkspace={selectedWorkspace}
                                                teams={teams}
                                                keyGrid={`${template._id}
                                                    -${template.position[0]}
                                                    -${template.position[1]}
                                                    -${template.position[2]}
                                                    -${template.position[3]}
                                                `}
                                                template={template}
                                                users={users}
                                                tags={tags}
                                                conversationOutcomes={conversationOutcomes}
                                                conversationObjectives={conversationObjectives}
                                                setConversationTemplate={setConversationTemplate}
                                                deleteConversationTemplate={deleteConversationTemplate}
                                                editingConversationTemplate={template._id !== conversationTemplate?._id}
                                                canEdit={canEdit}
                                                workspaceChannelConfigs={workspaceChannelConfigs}
                                            />
                                        ) : (
                                            template.chartType === ChartType.table && (
                                                <GraphicTable
                                                    onLoading={onLoading}
                                                    selectedPeriod={selectedPeriod}
                                                    selectedWorkspace={selectedWorkspace}
                                                    teams={teams}
                                                    keyGrid={`${template._id}
                                                        -${template.position[0]}
                                                        -${template.position[1]}
                                                        -${template.position[2]}
                                                        -${template.position[3]}
                                                    `}
                                                    template={template}
                                                    users={users}
                                                    tags={tags}
                                                    conversationOutcomes={conversationOutcomes}
                                                    conversationObjectives={conversationObjectives}
                                                    setConversationTemplate={setConversationTemplate}
                                                    deleteConversationTemplate={deleteConversationTemplate}
                                                    editingConversationTemplate={
                                                        template._id !== conversationTemplate?._id
                                                    }
                                                    canEdit={canEdit}
                                                    workspaceChannelConfigs={workspaceChannelConfigs}
                                                />
                                            )
                                        )}
                                    </div>
                                );
                            })}
                    </ResponsiveGridLayout>
                }
            />
        </Wrapper>
    );
};

export default i18n(GraphicList) as FC<GraphicListProps>;
