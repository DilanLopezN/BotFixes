import Highcharts, { TooltipFormatterContextObject } from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { User } from 'kissbot-core';
import orderBy from 'lodash/orderBy';
import moment from 'moment';
import { FC, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { ChannelConfig } from '../../../../../../../../model/Bot';
import { Team } from '../../../../../../../../model/Team';
import { ModalConfirm } from '../../../../../../../../shared/ModalConfirm/ModalConfirm';
import { Wrapper } from '../../../../../../../../ui-kissbot-v2/common';
import { convertChannelName } from '../../../../../../../../utils/ConvertChannelName';
import { GraphicConvertName } from '../../../../../../../../utils/GraphicConvertName';
import i18n from '../../../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../../../i18n/interface/i18n.interface';
import { Tag } from '../../../../../../../liveAgent/components/TagSelector/props';
import { DashboardService } from '../../../../../../services/DashboardService';
import { ConversationFilterIntervalsGraphics } from '../../../../../ConversationFilter';
import { ConversationFilterInterface } from '../../../../../ConversationFilter/props';
import {
    ConversationTemplate,
    Operator,
    TemplateGroupField,
    TemplateMetrics,
} from '../../../../interfaces/conversation-template-interface';
import { filterTagSystemAnalytics } from '../../../../utils/filterTagSystemAnalytics';
import { handleCsvDownloadChart } from '../../../../utils/handleCsvDownload';
import { PeriodFilterInterface } from '../../../GraphicsWrapper';
import { durationMetrics } from '../../duration-metrics';
import { useFormatYAxisValue } from '../use-format-x-axis-value';
import { useTooltipFormatter } from '../use-tooltip-formatter';
import { v2ResponseModel } from '../../../../../../../../interfaces/v2-response-model';
import { ConversationObjective } from '../../../../../../../liveAgent/interfaces/conversation-objective';
import { Workspace } from '../../../../../../../../model/Workspace';

Highcharts.setOptions({
    credits: {
        enabled: false,
    },
});

require('highcharts/modules/exporting')(Highcharts);
require('highcharts/modules/data')(Highcharts);
require('highcharts/modules/export-data')(Highcharts);
require('highcharts/modules/offline-exporting')(Highcharts);

const HighChartColumn: FC<HighChartColumnProps & I18nProps> = ({
    selectedPeriod,
    teams,
    getTranslation,
    onLoading,
    selectedWorkspace,
    keyGrid,
    template,
    tags,
    users,
    setConversationTemplate,
    deleteConversationTemplate,
    editingConversationTemplate,
    canEdit,
    workspaceChannelConfigs,
    conversationObjectives,
    conversationOutcomes,
}) => {
    const { loggedUser } = useSelector((state: any) => state.loginReducer);
    const [deleteTemplate, setDeleteTemplate] = useState<boolean>(false);
    const [chartOptions, setChartOptions] = useState<any>({});

    const formatYAxisValue = useFormatYAxisValue();
    const { formatTooltip } = useTooltipFormatter();

    const chartComponent = useRef<any>();
    const observeRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        const chart = chartComponent.current?.chart;
        chart?.showLoading(`${getTranslation('Loading')}...`);
    }, []);

    const getChartOptions = async () => {
        let xAxisCategory: any[] = [],
            dataSeries: any[] = [];

        let filter: ConversationFilterInterface = {
            startDate:
                selectedPeriod.startDate || moment().startOf('day').subtract(7, 'day').format('YYYY-MM-DDTHH:mm:ss'),
            endDate: selectedPeriod.endDate || moment().endOf('day').format('YYYY-MM-DDTHH:mm:ss'),
            interval: template.interval,
            workspaceId: selectedWorkspace._id as string,
            timezone: loggedUser.timezone,
        };

        if (!editingConversationTemplate) {
            filter.dashboardConversationTemplate = { ...template, groupId: '' };
        } else {
            filter.dashboardTemplateId = template._id;
        }
        let analytics = await DashboardService.getConversationsAnalytics({ ...filter });

        analytics = filterTagSystemAnalytics(analytics, template.groupField);

        onLoading(false);

        let intervalLabel;
        switch (template.interval) {
            case ConversationFilterIntervalsGraphics.hours.key: {
                intervalLabel = 'DD/MM/YYYY HH:mm';
                break;
            }
            case ConversationFilterIntervalsGraphics.weeks.key:
            case ConversationFilterIntervalsGraphics.days.key: {
                intervalLabel = 'ddd DD/MM/YY';
                break;
            }
            case ConversationFilterIntervalsGraphics.months.key: {
                intervalLabel = 'MMMM';
                break;
            }
            case ConversationFilterIntervalsGraphics.none.key: {
                intervalLabel = `${moment(filter?.startDate).format('DD/MM/YY')} - ${moment(filter?.endDate).format(
                    'DD/MM/YY'
                )}`;
                break;
            }
        }
        if (analytics && analytics.length) {
            const dates = analytics.map((data) => data.date);
            const uniqueDates = dates.filter((ele, i) => dates.indexOf(ele) === i);
            const names = analytics.map((data) => data.agg_field);
            const uniquenames = names.filter((ele, i) => names.indexOf(ele) === i);

            dataSeries = uniquenames.map((name) => {
                const dataName = getTranslation(GraphicConvertName(name, template));
                return {
                    name: dataName,
                    data: [],
                    type: 'column',
                };
            });

            uniqueDates.forEach((date, index) => {
                if (template.interval === ConversationFilterIntervalsGraphics.hours.key) {
                    xAxisCategory.push(moment(date).utc(true).format(intervalLabel));
                } else {
                    xAxisCategory.push(moment(date).utc().format(intervalLabel));
                }
                const dataFiltered = analytics.filter((element) => element.date === date);

                dataSeries = dataSeries.map((element) => {
                    const includes = dataFiltered.find((data) => {
                        const dataName = getTranslation(GraphicConvertName(data.agg_field, template));
                        if (dataName === element.name) {
                            return data;
                        }
                    });

                    if (includes) {
                        if (durationMetrics.includes(template.metric)) {
                            let dataSerie = element;
                            dataSerie.data.push(includes.agg_result === null ? null : Number(includes.agg_result) || 0);
                            return dataSerie;
                        } else if (template.metric === TemplateMetrics.rating_avg) {
                            let dataSerie = element;
                            dataSerie.data.push(Number(Number(includes.agg_result).toFixed(1)));
                            return dataSerie;
                        } else {
                            let dataSerie = element;
                            dataSerie.data.push(Number(includes.agg_result));
                            return dataSerie;
                        }
                    } else {
                        let dataSerie = element;
                        dataSerie.data.push(null);
                        return dataSerie;
                    }
                });
            });

            if (template.groupField === TemplateGroupField.assigned_to_team_id) {
                dataSeries = dataSeries.map((data) => {
                    return {
                        ...data,
                        name: teams.find((team) => team._id === data.name)?.name || data.name,
                    };
                });
            } else if (template.groupField === TemplateGroupField.closed_by) {
                dataSeries = dataSeries.map((data) => {
                    return {
                        ...data,
                        name: users.find((user) => user._id === data.name)?.name || data.name,
                    };
                });
            } else if (template.groupField === TemplateGroupField.created_by_channel) {
                dataSeries = dataSeries.map((data) => {
                    return {
                        ...data,
                        name: convertChannelName(data.name),
                    };
                });
            } else if (template.groupField === TemplateGroupField.token) {
                dataSeries = dataSeries.map((data) => {
                    return {
                        ...data,
                        name:
                            workspaceChannelConfigs.find((channelConfig) => channelConfig.token === data.name)?.name ||
                            data.name,
                    };
                });
            } else if (template.groupField === TemplateGroupField.categorization_objective) {
                dataSeries = dataSeries.map((data) => {
                    return {
                        ...data,
                        name:
                            conversationObjectives?.data.find((objective) => objective.id === data.name)?.name ||
                            data.name,
                    };
                });
            } else if (template.groupField === TemplateGroupField.categorization_outcome) {
                dataSeries = dataSeries.map((data) => {
                    return {
                        ...data,
                        name: conversationOutcomes?.data.find((outcome) => outcome.id === data.name)?.name || data.name,
                    };
                });
            }

            const chart = chartComponent.current?.chart;
            chart?.hideLoading();
        } else {
            const chart = chartComponent.current?.chart;
            chart?.showLoading(`${getTranslation('No Data')}`);
        }

        const options: Highcharts.Options = {
            title: { text: template.name },
            chart: {
                type: 'column',
                parallelCoordinates: true,
            },
            xAxis: { categories: xAxisCategory, crosshair: true },
            yAxis: {
                title: { text: '' },
                type: template.metric !== TemplateMetrics.total ? 'logarithmic' : 'linear',
                labels: {
                    formatter: function () {
                        return formatYAxisValue(template.metric, this.value);
                    },
                },
            },
            plotOptions: {
                series: {
                    animation: { duration: 1000 },
                    dataLabels: {
                        enabled: true,
                        style: { fontWeight: 'normal' },
                        formatter: function () {
                            return formatYAxisValue(template.metric, this.y);
                        },
                    },
                },
                column: {
                    pointPadding: 0.2,
                    borderWidth: 0,
                    groupPadding: 0,
                },
            },
            exporting: {
                enabled: editingConversationTemplate,
                menuItemDefinitions: !canEdit(template._id)
                    ? {
                          edit: {
                              onclick: () => {
                                  return setConversationTemplate({
                                      ...template,
                                      conditions: template.conditions.length
                                          ? template.conditions
                                          : [
                                                {
                                                    field: TemplateGroupField.no_field,
                                                    values: [],
                                                    operator: Operator.in,
                                                },
                                            ],
                                  });
                              },
                              text: getTranslation('Edit chart'),
                          },
                          delete: {
                              onclick: () => {
                                  return setDeleteTemplate(true);
                              },
                              text: getTranslation('Delete chart'),
                          },
                          clone: {
                              onclick: () => {
                                  return setConversationTemplate({
                                      ...template,
                                      _id: undefined,
                                      name: `${template.name} Copy`,
                                      conditions: template.conditions.length
                                          ? template.conditions
                                          : [
                                                {
                                                    field: TemplateGroupField.no_field,
                                                    values: [],
                                                    operator: Operator.in,
                                                },
                                            ],
                                  });
                              },
                              text: getTranslation('Clone chart'),
                          },
                      }
                    : {},
                buttons: {
                    contextButton: {
                        menuItems: [
                            'edit',
                            'clone',
                            'viewFullscreen',
                            'printChart',
                            'separator',
                            'downloadPNG',
                            'downloadJPEG',
                            'downloadPDF',
                            'downloadSVG',
                            'separator',
                            'downloadCSV',
                            'downloadXLS',
                            'separator',
                            'delete',
                        ],
                    },
                },
            },
            tooltip: {
                formatter: function () {
                    return formatTooltip(template, this as TooltipFormatterContextObject, 'column');
                },
                shared: false,
            },

            series: orderBy(dataSeries, 'name'),
        };
        return options;
    };

    useEffect(() => {
        const chart = chartComponent.current?.chart;
        chart?.showLoading(`${getTranslation('Loading')}...`);

        const chartElement = document.getElementById(`chart-${template._id || 'default'}`);

        if (chartElement) {
            observeRef.current?.disconnect();
            setTimeout(() => {
                observeRef.current = new IntersectionObserver((entries, observer) => {
                    entries.forEach((entry) => {
                        if (entry.intersectionRatio > 0) {
                            getAnalytics();
                            observer.disconnect();
                        }
                    });
                });
                observeRef.current.observe(chartElement);
            }, 300);
        } else {
            getAnalytics();
        }
    }, [selectedPeriod, template.interval, template.metric, template.groupField, template.conditions]);

    const getAnalytics = async () => {
        onLoading(true);
        const chartOptions = await getChartOptions();

        if (
            (chartOptions && template.metric === TemplateMetrics.first_agent_reply_avg) ||
            template.metric === TemplateMetrics.time_to_close
        ) {
            return setChartOptions({
                ...chartOptions,
                exporting: {
                    ...chartOptions.exporting,
                    menuItemDefinitions: {
                        ...chartOptions.exporting?.menuItemDefinitions,
                        downloadCSV: {
                            onclick: () => handleCsvDownloadChart(chartOptions, template.name),
                            text: 'Download CSV',
                        },
                    },
                },
            });
        }
        setChartOptions(chartOptions);
    };

    return (
        <Wrapper
            id={`chart-${template?._id || 'default'}`}
            width='100%'
            height='100%'
            boxShadow='rgba(67, 71, 85, 0.27) 0px 0px 0.25em, rgba(90, 125, 188, 0.05) 0px 0.25em 1em'
        >
            <ModalConfirm
                isOpened={deleteTemplate}
                onAction={(action: any) => {
                    if (action) {
                        deleteConversationTemplate(template._id);
                    }
                    setDeleteTemplate(false);
                }}
            >
                <h5 style={{ textAlign: 'center' }}>{getTranslation('Confirm delete')}</h5>
                <p style={{ margin: '10px 0px 17px' }}>
                    {getTranslation('Are you sure you want to delete the chart?')}
                </p>
            </ModalConfirm>

            <HighchartsReact
                key={keyGrid}
                allowChartUpdate
                highcharts={Highcharts}
                options={{ ...chartOptions, title: { text: template.name || 'Chart title' } }}
                ref={chartComponent}
            />
        </Wrapper>
    );
};

export interface HighChartColumnProps {
    selectedPeriod: PeriodFilterInterface;
    teams: Team[];
    onLoading: Function;
    selectedWorkspace: Workspace;
    keyGrid: string;
    template: ConversationTemplate;
    tags: Tag[];
    users: User[];
    setConversationTemplate: Function;
    deleteConversationTemplate: Function;
    editingConversationTemplate: boolean;
    canEdit: (value) => boolean;
    workspaceChannelConfigs: ChannelConfig[];
    conversationOutcomes: v2ResponseModel<ConversationObjective[]> | undefined;
    conversationObjectives: v2ResponseModel<ConversationObjective[]> | undefined;
}

export default i18n(HighChartColumn) as FC<HighChartColumnProps>;
