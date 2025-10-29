import Highcharts, { SeriesPieOptions, TooltipFormatterContextObject } from 'highcharts';
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
import { useFormattedLabel } from '../use-formatted-label';
import { useTooltipFormatter } from '../use-tooltip-formatter';
import { durationMetrics } from '../../duration-metrics';
import { ConversationObjective } from '../../../../../../../liveAgent/interfaces/conversation-objective';
import { v2ResponseModel } from '../../../../../../../../interfaces/v2-response-model';
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

const HighChartPizza: FC<HighChartPizzaProps & I18nProps> = ({
    selectedPeriod,
    teams,
    getTranslation,
    onLoading,
    selectedWorkspace,
    keyGrid,
    template,
    users,
    tags,
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

    const { formatTooltip } = useTooltipFormatter();
    const getFormattedLabel = useFormattedLabel();

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
            filter.dashboardConversationTemplate = template;
        } else {
            filter.dashboardTemplateId = template._id;
        }

        let analytics = await DashboardService.getConversationsAnalytics({ ...filter });

        analytics = filterTagSystemAnalytics(analytics, template.groupField);

        onLoading(false);

        if (analytics && analytics.length) {
            const dates = analytics.map((data) => data.date);
            const uniqueDates = dates.filter((ele, i) => dates.indexOf(ele) === i);
            const names = analytics.map((data) => data.agg_field);
            const uniquenames = names.filter((ele, i) => names.indexOf(ele) === i);

            dataSeries = uniquenames.map((name) => {
                const dataName = getTranslation(GraphicConvertName(name, template));
                return {
                    name: dataName,
                    y: [],
                };
            });

            uniqueDates.forEach((date, index) => {
                xAxisCategory.push(moment(date).utc().format('MMMM'));
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
                            dataSerie.y.push(includes.agg_result === null ? null : Number(includes.agg_result) || 0);
                            return dataSerie;
                        } else if (template.metric === TemplateMetrics.rating_avg) {
                            let dataSerie = element;
                            dataSerie.y.push(Number(Number(includes.agg_result).toFixed(1)));
                            return dataSerie;
                        } else {
                            let dataSerie = element;
                            dataSerie.y.push(Number(includes.agg_result));
                            return dataSerie;
                        }
                    } else {
                        let dataSerie = element;
                        dataSerie.y.push(null);
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

            dataSeries = dataSeries.map((data) => {
                if (template.metric === TemplateMetrics.rating_avg) {
                    return {
                        ...data,
                        y: Number(
                            Number(
                                data.y.reduce((previousValue, currentValue) => previousValue + currentValue) /
                                    data.y.length
                            ).toFixed(1)
                        ),
                    };
                }
                return {
                    ...data,
                    y: data.y.reduce((previousValue, currentValue) => previousValue + currentValue),
                };
            });

            const chart = chartComponent.current?.chart;
            chart?.hideLoading();
        } else {
            const chart = chartComponent.current?.chart;
            chart?.showLoading(`${getTranslation('No Data')}`);
        }

        const options: Highcharts.Options = {
            title: { text: template.name },
            chart: {
                plotShadow: false,
                type: 'pie',
            },
            xAxis: { categories: xAxisCategory },
            yAxis: {
                title: { text: '' },
                type: template.metric !== TemplateMetrics.total ? 'logarithmic' : 'linear',
            },
            plotOptions: {
                series: {
                    animation: { duration: 1000 },
                    dataLabels: {
                        enabled: true,
                        style: { fontWeight: 'normal' },
                        formatter: function () {
                            return `${this.y}`;
                        },
                    },
                },
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        formatter: function () {
                            return getFormattedLabel(template, this as TooltipFormatterContextObject);
                        },
                    },
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
                    return formatTooltip(template, this as TooltipFormatterContextObject, 'pie');
                },
            },

            series: [
                {
                    name: getTranslation('Conversations'),
                    colorByPoint: true,
                    data: orderBy(dataSeries, 'name'),
                    type: 'pie',
                } as SeriesPieOptions,
            ],
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
    }, [selectedPeriod, template.metric, template.groupField, template.conditions]);

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
                            onclick: () => handleCsvDownloadChart(chartOptions, template.name, template.chartType),
                            text: getTranslation('Download CSV'),
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
                options={{
                    ...chartOptions,
                    title: {
                        text:
                            `${template.name} </br>
                    (${moment(selectedPeriod.startDate).format('DD/MM/YYYY')} - 
                    ${moment(selectedPeriod.endDate).format('DD/MM/YYYY')})` || getTranslation('título do gráfico'),
                    },
                }}
                ref={chartComponent}
            />
        </Wrapper>
    );
};

export interface HighChartPizzaProps {
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

export default i18n(HighChartPizza) as FC<HighChartPizzaProps>;
