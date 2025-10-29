import { Dropdown, MenuProps, Table } from 'antd';
import { User } from 'kissbot-core';
import { orderBy } from 'lodash';
import moment from 'moment';
import { FC, useEffect, useRef, useState } from 'react';
import { TiThMenu } from 'react-icons/ti';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
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
import { handleCsvAgroupedDownloadTable, handleCsvDownloadTable } from '../../../../utils/handleCsvDownload';
import { PeriodFilterInterface } from '../../../GraphicsWrapper';
import { formatDurationValue } from '../format-utils/format-duration-value';
import { durationMetrics } from '../../duration-metrics';
import { v2ResponseModel } from '../../../../../../../../interfaces/v2-response-model';
import { ConversationObjective } from '../../../../../../../liveAgent/interfaces/conversation-objective';
import { Workspace } from '../../../../../../../../model/Workspace';

const MenuIcon = styled(TiThMenu)`
    cursor: pointer;
    height: 25px;
    width: 40px;
    padding: 3px 0;

    :hover {
        background: #e6e6e6;
    }
`;

interface ColumnData {
    title: string;
    dataIndex: string;
    key: string;
    fixed: boolean;
    align: 'center';
    width: number;
    render?: any;
}
interface ColumnDataSource {
    key: string;
    [key: string]: any;
}

enum GroupField {
    assigned_to_team_id = 'Team',
    closed_by = 'Agent',
    created_by_channel = 'Channel',
    tags = 'Hang tags',
    no_field = 'Conversations',
    token = 'Whatsapp number',
}

interface Props {
    selectedWorkspace: Workspace;
    teams: Team[];
    selectedPeriod: PeriodFilterInterface;
    onLoading: Function;
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

const GraphicTable: FC<Props & I18nProps> = ({
    getTranslation,
    selectedWorkspace,
    teams,
    onLoading,
    users,
    tags,
    keyGrid,
    template,
    selectedPeriod,
    setConversationTemplate,
    deleteConversationTemplate,
    editingConversationTemplate,
    canEdit,
    workspaceChannelConfigs,
    conversationObjectives,
    conversationOutcomes,
}) => {
    const { loggedUser } = useSelector((state: any) => state.loginReducer);
    const [columns, setColumns] = useState<ColumnData[] | undefined>(undefined);
    const [dataSource, setDataSource] = useState<ColumnDataSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteTemplate, setDeleteTemplate] = useState<boolean>(false);
    const observeRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
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
        if (!selectedWorkspace) return;
        onLoading(true);
        setLoading(true);

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

        if (!analytics) {
            setLoading(true);
        } else {
            generateDataSource(analytics);
            setLoading(false);
        }
    };

    const getMomentFormat = () => {
        switch (template.interval) {
            case ConversationFilterIntervalsGraphics.hours.key: {
                return 'DD/MM/YY HH:mm';
            }
            case ConversationFilterIntervalsGraphics.weeks.key:
            case ConversationFilterIntervalsGraphics.days.key: {
                return 'DD/MM';
            }
            case ConversationFilterIntervalsGraphics.months.key: {
                return 'MMMM';
            }
            case ConversationFilterIntervalsGraphics.none.key: {
                return `${moment(selectedPeriod?.startDate).format('DD/MM/YY')} - ${moment(
                    selectedPeriod?.endDate
                ).format('DD/MM/YY')}`;
            }
        }
    };

    const generateDataSource = (analytics) => {
        let _columns: any[] = [],
            dataSeries: any[] = [];

        const dates = analytics.map((data) => data.date);
        const uniqueDates = dates.filter((ele, i) => dates.indexOf(ele) === i);
        const names = analytics.map((data) => data.agg_field);
        const uniquenames = names.filter((ele, i) => names.indexOf(ele) === i);

        dataSeries = uniquenames.map((name) => {
            const dataName = getTranslation(GraphicConvertName(name, template));
            return {
                name: dataName,
                data: [],
            };
        });

        uniqueDates.forEach((date, index) => {
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
                        dataSerie.data.push(
                            includes.agg_result === null ? '-' : formatDurationValue(Number(includes.agg_result))
                        );
                        return dataSerie;
                    } else if (template.metric === TemplateMetrics.rating_avg) {
                        let dataSerie = element;
                        dataSerie.data.push(
                            includes.agg_result === null ? '-' : Number(Number(includes.agg_result).toFixed(1))
                        );
                        return dataSerie;
                    } else {
                        let dataSerie = element;
                        dataSerie.data.push(Number(includes.agg_result));
                        return dataSerie;
                    }
                } else {
                    let dataSerie = element;
                    dataSerie.data.push('-');
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
                        conversationObjectives?.data.find((objective) => objective.id === data.name)?.name || data.name,
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

        _columns = uniqueDates.map((e, index) => {
            let label = moment(e).utc().format(getMomentFormat());
            if (template.interval === ConversationFilterIntervalsGraphics.hours.key) {
                label = moment(e).utc(true).format(getMomentFormat());
            }
            const firstLetterUppercase = (string) => {
                return string.charAt(0).toUpperCase() + string.slice(1);
            };
            return {
                title: firstLetterUppercase(label),
                dataIndex: uniqueDates[index],
                key: uniqueDates[index],
                align: 'center',
                width: 85,
            };
        });
        _columns.unshift({
            title: getTranslation(GroupField[template.groupField]),
            dataIndex: 'groupField',
            key: 'groupField',
            fixed: 'left',
            width: 200,
            render: (groupField) => (
                <Wrapper title={groupField} truncate width='170px'>
                    {groupField}
                </Wrapper>
            ),
        });

        const newDataSource: any = [];

        orderBy(dataSeries, 'name').forEach((data, index) => {
            newDataSource.push({
                key: index,
                groupField: data.name,
            });
            uniqueDates.forEach((date, i) => {
                newDataSource[index][date] = data.data[i];
            });
        });

        setColumns(_columns);
        setDataSource(newDataSource);
    };

    useEffect(() => {
        setTimeout(() => {
            setLoading(false);
        }, 2000);
    }, [loading]);

    const items: MenuProps['items'] = [
        {
            key: '1',
            label: getTranslation('Edit chart'),
            onClick: () =>
                setConversationTemplate({
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
                }),
            style: { fontSize: '12px' },
        },
        {
            key: '2',
            label: getTranslation('Clone chart'),
            onClick: () =>
                setConversationTemplate({
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
                }),
            style: { fontSize: '12px' },
        },
        {
            key: '3',
            label: getTranslation('Download CSV'),
            onClick: () => handleCsvDownloadTable(template, columns, dataSource),
            style: { fontSize: '12px' },
        },
        {
            key: '4',
            label: getTranslation('Bundled CSV download'),
            onClick: () => handleCsvAgroupedDownloadTable(template, columns, dataSource),
            style: { fontSize: '12px' },
        },
        {
            key: '5',
            label: getTranslation('Delete chart'),
            onClick: () => setDeleteTemplate(true),
            style: { fontSize: '12px' },
        },
    ];

    return (
        <Wrapper
            id={`chart-${template?._id || 'default'}`}
            width='100%'
            height='100%'
            cursor='move'
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
            {
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Wrapper width='100%' flexBox justifyContent='center' padding='10px'>
                        <Wrapper fontSize='16px' fontWeight='bold'>
                            {template.name}
                        </Wrapper>
                    </Wrapper>
                    {!canEdit(template._id) && (
                        <Dropdown menu={{ items }} placement='bottomRight' trigger={['click']}>
                            <MenuIcon />
                        </Dropdown>
                    )}
                </div>
            }
            <Table
                style={{ cursor: 'initial' }}
                key={keyGrid}
                dataSource={dataSource}
                loading={loading}
                columns={columns}
                scroll={{ y: template.position[3] > 23 ? 400 : 320, x: 'max-content' }}
                pagination={false}
            />
        </Wrapper>
    );
};

export default i18n(GraphicTable) as FC<Props>;
