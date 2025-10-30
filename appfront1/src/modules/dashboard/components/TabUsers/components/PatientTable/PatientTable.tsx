import { message, Table } from 'antd';
import { ColumnType } from 'antd/lib/table';
import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { addNotification } from '../../../../../../utils/AddNotification';
import { Constants } from '../../../../../../utils/Constants';
import { formatDuration } from '../../../../../../utils/formatDuration';
import { useLanguageContext } from '../../../../../i18n/context';
import { DashboardService } from '../../../../services/DashboardService';
import { DurationRangeFilter } from '../../../../utils/duration-range-filter';
import { getBackgroundColor } from '../../../../utils/get-bg-color/get-bg-color';
import { IntegerRangeFilter } from '../../../../utils/integer-range-filter';
import { useAnalyticsRanges } from '../../../../utils/use-analytics-ranges';
import { useRangeFilter } from '../../../../utils/use-range-filter';
import { useConversationAnalytics } from '../../hooks/useConversationAnalytics';
import { ConversationAnalytics } from '../../hooks/useConversationAnalytics/interfaces';
import { PatientTablePatientTable, PatientTableProps, PatientTableRef } from './interfaces';

export const PatientTable = forwardRef<PatientTableRef, PatientTableProps>(({ filters, selectedWorkspace }, ref) => {
    const { getConversationAnalytics, conversationAnalytics, loading } = useConversationAnalytics();
    const { getTranslation } = useLanguageContext();
    const isNotClosed: boolean = filters?.conversationsWith === 'not_closed';

    const { saveAnalyticsRange, initialAnalyticsRanges, removeAnalyticsRange } = useAnalyticsRanges(
        Constants.LOCAL_STORAGE_MAP.DASHBOARD_PERFORMANCE_AGENTS,
        selectedWorkspace
    );
    const initialFilters = initialAnalyticsRanges || {
        countForService: [null, null],
        waitingAverageTime: [null, null],
        countInAttendance: [null, null],
        attendanceAverageTime: [null, null],
        countClosedAttendance: [null, null],
    };

    const { handleSetFilterValues } = useRangeFilter<PatientTablePatientTable>(initialFilters);

    const handleDownload = async (downloadType: string) => {
        if (!conversationAnalytics || conversationAnalytics.length === 0) {
            addNotification({
                type: 'danger',
                duration: 5000,
                title: getTranslation('Error'),
                message: getTranslation('Error downloading report'),
            });
            return;
        }

        try {
            const reportFilter = {
                query: {
                    ...filters,
                    workspaceId: selectedWorkspace._id,
                },
                downloadType: downloadType,
            };

            await DashboardService.getConversationsAnalyticsReport(reportFilter);
        } catch (error) {
            addNotification({
                type: 'danger',
                duration: 5000,
                title: getTranslation('Error'),
                message: getTranslation('Error downloading report'),
            });
        }
    };

    useImperativeHandle(ref, () => ({
        handleDownload,
    }));

    useEffect(() => {
        getConversationAnalytics(filters, selectedWorkspace);
    }, [filters, getConversationAnalytics, selectedWorkspace]);

    useEffect(() => {
        if (isNotClosed) {
            message.warning({
                content: getTranslation('This table does not present data for unfinished attendances'),
                duration: 5,
            });
        }
    }, [getTranslation, isNotClosed]);

    const columns: ColumnType<ConversationAnalytics>[] = [
        {
            title: getTranslation('Agent'),
            dataIndex: 'member_name',
            key: 'member_name',
            defaultSortOrder: 'ascend',
            sortDirections: ['ascend', 'descend', 'ascend'],
            fixed: 'left',
            sorter: (a, b) => a.member_name.localeCompare(b.member_name),
        },
        {
            title: getTranslation('Average patient response time'),
            dataIndex: 'timeUserReplyAvg',
            key: 'timeUserReplyAvg',
            sortDirections: ['ascend', 'descend', 'ascend'],
            sorter: (a, b) => {
                const valueA = Number(a.timeUserReplyAvg);
                const valueB = Number(b.timeUserReplyAvg);
                return valueA - valueB;
            },
            render: (text) => {
                const data = !isNotClosed ? formatDuration(text) : '00';
                const value = text !== null ? Number(text) : 0;
                const backgroundColor = getBackgroundColor(
                    'timeUserReplyAvg',
                    value,
                    initialFilters,
                    'duration-range-filter'
                );
                return {
                    props: {
                        style: {
                            background: isNotClosed ? '#f0f0f0' : backgroundColor,
                            color: isNotClosed ? '#bfbfbf' : 'inherit',
                        },
                    },
                    children: data,
                };
            },
            filterDropdown: (props) => (
                <DurationRangeFilter
                    dataIndex={'timeUserReplyAvg'}
                    initialFilters={initialFilters}
                    {...props}
                    setFilterValues={(min, max) => handleSetFilterValues('timeUserReplyAvg', min, max)}
                />
            ),
        },
        {
            title: getTranslation('Average agent response time'),
            dataIndex: 'timeAgentReplyAvg',
            key: 'timeAgentReplyAvg',
            sortDirections: ['ascend', 'descend', 'ascend'],
            sorter: (a, b) => {
                const valueA = Number(a.timeAgentReplyAvg);
                const valueB = Number(b.timeAgentReplyAvg);
                return valueA - valueB;
            },
            render: (text) => {
                const data = !isNotClosed ? formatDuration(text) : '00';
                const value = text !== null ? Number(text) : 0;
                const backgroundColor = getBackgroundColor(
                    'timeAgentReplyAvg',
                    value,
                    initialFilters,
                    'duration-range-filter'
                );
                return {
                    props: {
                        style: {
                            background: isNotClosed ? '#f0f0f0' : backgroundColor,
                            color: isNotClosed ? '#bfbfbf' : 'inherit',
                        },
                    },
                    children: data,
                };
            },
            filterDropdown: (props) => (
                <DurationRangeFilter
                    dataIndex={'timeAgentReplyAvg'}
                    initialFilters={initialFilters}
                    {...props}
                    setFilterValues={(min, max) => handleSetFilterValues('timeAgentReplyAvg', min, max)}
                />
            ),
        },
        {
            title: getTranslation('Agents (assumed)'),
            dataIndex: 'count',
            key: 'count',
            sortDirections: ['ascend', 'descend', 'ascend'],
            sorter: (a, b) => {
                const valueA = Number(a.count);
                const valueB = Number(b.count);
                return valueA - valueB;
            },
            render: (text, record) => {
                const data = !isNotClosed ? text : '00';
                const value = text !== null ? Number(text) : 0;
                const backgroundColor = getBackgroundColor('count', value, initialFilters, 'integer-range-filter');

                return {
                    props: {
                        style: {
                            background: isNotClosed ? '#f0f0f0' : backgroundColor,
                            color: isNotClosed ? '#bfbfbf' : 'inherit',
                        },
                    },
                    children: data,
                };
            },
            filterDropdown: (props) => (
                <IntegerRangeFilter
                    dataIndex={'count'}
                    initialFilters={initialFilters}
                    {...props}
                    setFilterValues={(min, max) => handleSetFilterValues('count', min, max)}
                />
            ),
        },
        {
            title: getTranslation('Active TME'),
            dataIndex: 'awaitingWorkingTime',
            key: 'awaitingWorkingTime',
            sortDirections: ['ascend', 'descend', 'ascend'],
            sorter: (a, b) => {
                const valueA = Number(a.awaitingWorkingTime);
                const valueB = Number(b.awaitingWorkingTime);
                return valueA - valueB;
            },
            render: (text) => {
                const data = !isNotClosed ? formatDuration(text) : '00';
                const value = text !== null ? Number(text) : 0;
                const backgroundColor = getBackgroundColor(
                    'awaitingWorkingTime',
                    value,
                    initialFilters,
                    'duration-range-filter'
                );
                return {
                    props: {
                        style: {
                            background: isNotClosed ? '#f0f0f0' : backgroundColor,
                            color: isNotClosed ? '#bfbfbf' : 'inherit',
                        },
                    },
                    children: data,
                };
            },
            filterDropdown: (props) => (
                <DurationRangeFilter
                    dataIndex={'awaitingWorkingTime'}
                    initialFilters={initialFilters}
                    {...props}
                    setFilterValues={(min, max) => handleSetFilterValues('awaitingWorkingTime', min, max)}
                />
            ),
        },
        {
            title: getTranslation('TME 1st response'),
            dataIndex: 'timeAgentFirstReplyAvg',
            key: 'timeAgentFirstReplyAvg',
            sortDirections: ['ascend', 'descend', 'ascend'],
            sorter: (a, b) => {
                const valueA = Number(a.timeAgentFirstReplyAvg);
                const valueB = Number(b.timeAgentFirstReplyAvg);
                return valueA - valueB;
            },
            render: (text) => {
                const data = !isNotClosed ? formatDuration(text) : '00';
                const value = text !== null ? Number(text) : 0;
                const backgroundColor = getBackgroundColor(
                    'timeAgentFirstReplyAvg',
                    value,

                    initialFilters,
                    'duration-range-filter'
                );

                return {
                    props: {
                        style: {
                            background: isNotClosed ? '#f0f0f0' : backgroundColor,
                            color: isNotClosed ? '#bfbfbf' : 'inherit',
                        },
                    },
                    children: data,
                };
            },
            filterDropdown: (props) => (
                <DurationRangeFilter
                    dataIndex={'timeAgentFirstReplyAvg'}
                    initialFilters={initialFilters}
                    {...props}
                    setFilterValues={(min, max) => handleSetFilterValues('timeAgentFirstReplyAvg', min, max)}
                />
            ),
        },
        {
            title: getTranslation('TMA'),
            dataIndex: 'timeToCloseAvg',
            key: 'timeToCloseAvg',
            sortDirections: ['ascend', 'descend', 'ascend'],
            sorter: (a, b) => {
                const valueA = Number(a.timeToCloseAvg);
                const valueB = Number(b.timeToCloseAvg);
                return valueA - valueB;
            },
            render: (text) => {
                const data = !isNotClosed ? formatDuration(text) : '00';
                const value = text !== null ? Number(text) : 0;
                const backgroundColor = getBackgroundColor(
                    'timeToCloseAvg',
                    value,
                    initialFilters,
                    'duration-range-filter'
                );

                return {
                    props: {
                        style: {
                            background: isNotClosed ? '#f0f0f0' : backgroundColor,
                            color: isNotClosed ? '#bfbfbf' : 'inherit',
                        },
                    },
                    children: data,
                };
            },
            filterDropdown: (props) => (
                <DurationRangeFilter
                    dataIndex={'timeToCloseAvg'}
                    initialFilters={initialFilters}
                    {...props}
                    setFilterValues={(min, max) => handleSetFilterValues('timeToCloseAvg', min, max)}
                />
            ),
        },
        {
            title: getTranslation('Services completed'),
            dataIndex: 'memberFinished',
            key: 'memberFinished',
            sortDirections: ['ascend', 'descend', 'ascend'],
            sorter: (a, b) => {
                const valueA = Number(a.memberFinished);
                const valueB = Number(b.memberFinished);
                return valueA - valueB;
            },
            render: (text) => {
                const data = !isNotClosed ? text : '00';
                const value = text !== null ? Number(text) : 0;
                const backgroundColor = getBackgroundColor(
                    'memberFinished',
                    value,
                    initialFilters,
                    'integer-range-filter'
                );

                return {
                    props: {
                        style: {
                            background: isNotClosed ? '#f0f0f0' : backgroundColor,
                            color: isNotClosed ? '#bfbfbf' : 'inherit',
                        },
                    },
                    children: data,
                };
            },
            filterDropdown: (props) => (
                <IntegerRangeFilter
                    dataIndex={'memberFinished'}
                    initialFilters={initialFilters}
                    {...props}
                    setFilterValues={(min, max) => handleSetFilterValues('memberFinished', min, max)}
                />
            ),
        },
    ];

    return (
        <Table
            bordered
            dataSource={conversationAnalytics}
            columns={columns}
            loading={loading}
            showSorterTooltip={false}
            scroll={{
                y: 'calc(100vh - 330px)',
            }}
            pagination={false}
        />
    );
});
