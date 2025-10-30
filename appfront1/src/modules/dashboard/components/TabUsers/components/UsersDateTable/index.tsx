import { Checkbox, Space, Table } from 'antd';
import axios, { CancelTokenSource } from 'axios';
import { isEmpty, orderBy } from 'lodash';
import moment from 'moment';
import { FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Team } from '../../../../../../model/Team';
import { Workspace } from '../../../../../../model/Workspace';
import { LabelWrapper } from '../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { DashboardService } from '../../../../services/DashboardService';
import { ConversationFilterIntervals } from '../../../ConversationFilter';
import { ConversationFilterInterface } from '../../../ConversationFilter/props';

let cancelToken: CancelTokenSource | null = null;

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

interface Props {
    selectedWorkspace: Workspace;
    teams: Team[];
    filter: ConversationFilterInterface;
    shouldDownload?: boolean;
    onDownloadComplete?: () => void;
    propSelectedInterval?: string;
    downloadType?: string;
}

const UsersDateTable: FC<Props & I18nProps> = ({
    getTranslation,
    filter,
    selectedWorkspace,
    teams,
    shouldDownload,
    onDownloadComplete,
    propSelectedInterval,
    downloadType = 'CSV',
}) => {
    const { loggedUser } = useSelector((state: any) => state.loginReducer);
    const [columns, setColumns] = useState<ColumnData[] | undefined>(undefined);
    const [dataSource, setDataSource] = useState<ColumnDataSource[]>([]);
    const [selectedInterval, setSelectedInterval] = useState<string>(
        propSelectedInterval || ConversationFilterIntervals.days.key
    );
    const [analyticsState, setAnalyticsState] = useState<any>(undefined);
    const [loading, setLoading] = useState(true);
    const [viewAll, setViewAll] = useState(false);
    const [showCheckbox, setShowCheckbox] = useState(false);

    const handleDownload = async () => {
        if (!dataSource || dataSource.length === 0) {
            if (onDownloadComplete) {
                onDownloadComplete();
            }
            return;
        }

        try {
            const reportFilter = {
                query: {
                    ...filter,
                    timezone: loggedUser.timezone,
                    interval: selectedInterval as any,
                    groupBy: 'user' as const,
                    workspaceId: selectedWorkspace._id,
                },
                downloadType: downloadType,
            };

            await DashboardService.getConversationsAnalyticsReport(reportFilter);
        } catch (error) {
            console.error('Erro no download:', error);
        }

        if (onDownloadComplete) {
            onDownloadComplete();
        }
    };

    useEffect(() => {
        if (shouldDownload) {
            handleDownload();
        }
    }, [shouldDownload]);

    useEffect(() => {
        getAnalytics(filter);

        return () => {
            if (cancelToken) {
                cancelToken.cancel();
            }
        };
    }, [filter, selectedInterval]);

    useEffect(() => {
        if (analyticsState) {
            generateColumns(analyticsState);
            generateDataSource(analyticsState);
        }
    }, [viewAll]);

    useEffect(() => {
        if (analyticsState && columns) {
            generateDataSource(analyticsState);
        }
    }, [columns, analyticsState]);

    useEffect(() => {
        if (propSelectedInterval && propSelectedInterval !== selectedInterval) {
            setSelectedInterval(propSelectedInterval);
        }
    }, [propSelectedInterval]);

    const generateColumns = (analytics) => {
        let _columns: any[] = [];

        analytics?.forEach((e) => {
            if (!_columns.includes(e.date)) {
                _columns.push(e.date);
            }
        });

        _columns = orderBy(_columns);
        _columns = _columns.map((e, index, array) => {
            let label = moment(e).utc().format(getMomentFormat());
            const firstLetterUppercase = (string) => {
                return string.charAt(0).toUpperCase() + string.slice(1);
            };
            return {
                title: firstLetterUppercase(label),
                dataIndex: label,
                key: label,
                align: 'center',
                width: 85,
                sorter: (a: { [key: string]: any }, b: { [key: string]: any }): number => {
                    const valueA = a[label];
                    const valueB = b[label];

                    if (typeof valueA === 'number' && typeof valueB === 'number') {
                        return valueA - valueB;
                    }

                    return String(valueA).localeCompare(String(valueB));
                },
                sortDirections: ['ascend', 'descend', 'ascend'],
            };
        });
        _columns.unshift({
            title: getTranslation('Agent'),
            dataIndex: 'user',
            key: 'user',
            fixed: 'left',
            width: 200,
            sorter: (a, b) => a.user.localeCompare(b.user),
            sortDirections: ['ascend', 'descend', 'ascend'],
            defaultSortOrder: 'ascend',
            render: (user) => (
                <Wrapper title={user} truncate width='170px'>
                    {user}
                </Wrapper>
            ),
        });
        setColumns(_columns);
    };

    const pendingCb = (isPending: boolean): any => {
        if (isPending) {
            setLoading(true);
        } else {
            setLoading(false);
        }
    };

    const getAnalytics = async (filter: ConversationFilterInterface) => {
        if (!selectedWorkspace) return;
        if (cancelToken) {
            cancelToken.cancel();
        }
        let err: any;
        try {
            cancelToken = axios.CancelToken.source();
            const analytics = await DashboardService.getConversationsAnalytics(
                {
                    ...filter,
                    timezone: loggedUser.timezone,
                    interval: selectedInterval as any,
                    groupBy: 'user',
                    workspaceId: selectedWorkspace._id,
                },
                cancelToken,
                (responseError) => (err = responseError),
                pendingCb
            );
            setAnalyticsState(analytics);
            generateColumns(analytics);
        } catch (error) {
        } finally {
        }
    };

    const getMomentFormat = () => {
        switch (selectedInterval) {
            case ConversationFilterIntervals.weeks.key:
            case ConversationFilterIntervals.days.key: {
                return 'DD/MM';
            }
            case ConversationFilterIntervals.months.key: {
                return 'MMMM';
            }
        }
    };

    const filterMemberDuplicatesByDate = (data: any[]) => {
        let obj: any = {};
        let newData: any[] = [];

        data.forEach((e, i) => {
            if (!obj[`${data[i].date}*${data[i].member_id}*`]) {
                obj[`${data[i].date}*${data[i].member_id}*`] = data[i];
                newData.push(data[i]);
            } else {
                const index = newData.findIndex((e) => e.date === data[i].date && e.member_id === data[i].member_id);

                newData.splice(index, 1, { ...newData[index], count: newData[index].count + data[i].count });
            }
        });

        return newData;
    };

    const onShowCheckbox = (teams) => {
        if (isEmpty(filter.teamIds)) {
            return setShowCheckbox(false);
        }

        let obj: any = {};
        if (Array.isArray(analyticsState)) {
            analyticsState?.forEach((e, i) => {
                if (!obj[e.member_id]) {
                    obj[e.member_id] = i;
                }
            });
        }

        const matchUsers = Object.keys(obj).filter((item) => {
            return teams[item];
        });

        setShowCheckbox(!(Object.keys(obj).length === matchUsers.length));
    };

    const generateDataSource = (data: any[]) => {
        if (!Array.isArray(data)) return;

        const teamsUsers: { [key: string]: boolean } = {};

        if (isEmpty(filter.teamIds)) {
            teams.forEach((team) => {
                team.roleUsers.forEach((role) => {
                    teamsUsers[role.userId] = true;
                });
            });
        } else {
            const selectedTeams = teams?.filter((team) => filter?.teamIds?.includes(team._id));
            if (!isEmpty(selectedTeams)) {
                selectedTeams.forEach((selectedTeam) => {
                    selectedTeam.roleUsers.forEach((role) => {
                        teamsUsers[role.userId] = true;
                    });
                });
            }
        }
        onShowCheckbox(teamsUsers);
        const usersData = data.filter((item) => teamsUsers[item.member_id]);
        const newData = filterMemberDuplicatesByDate(viewAll ? usersData : data);

        const dataSource: ColumnDataSource[] = [];

        newData.forEach((uData) => {
            let userName = uData.member_name;
            let date = moment(uData.date).utc().format(getMomentFormat());

            const dataSourceItem: ColumnDataSource = {
                key: uData.member_id,
                user: userName,
            };

            columns?.forEach((col) => {
                if (col.key === 'user') return;

                if (col.key === date) {
                    dataSourceItem[col.key] = uData.count;
                } else {
                    dataSourceItem[col.key] = '-';
                }

                const existingData = dataSource.find((e) => e.key === uData.member_id);
                const index = dataSource.findIndex((e) => e.key === uData.member_id);

                if (!existingData) {
                    dataSource.push(dataSourceItem);
                } else if (index > -1) {
                    if (dataSourceItem[col.key] !== '-')
                        dataSource.splice(index, 1, { ...dataSource[index], [col.key]: uData.count });
                }

                dataSource.forEach((item) => {
                    if (!item[col.key]) {
                        item[col.key] = '-';
                    }
                });
            });
        });
        setDataSource(orderBy(dataSource, 'user'));
    };

    return (
        <>
            {showCheckbox && (
                <Wrapper flexBox alignItems='center'>
                    <Space>
                        <Checkbox checked={viewAll} onChange={(ev) => setViewAll(ev.target.checked)} />
                        <LabelWrapper
                            tooltip={getTranslation(
                                'We identified agents in the table who are no longer on this team.'
                            )}
                            label={getTranslation('Only show agents who are active on this team.')}
                        />
                    </Space>
                </Wrapper>
            )}

            <Table
                bordered
                dataSource={dataSource}
                columns={columns}
                showSorterTooltip={false}
                scroll={{
                    y: 'calc(100vh - 280px)',
                }}
                pagination={false}
                loading={loading}
            />
        </>
    );
};

export default i18n(UsersDateTable) as FC<Props>;
