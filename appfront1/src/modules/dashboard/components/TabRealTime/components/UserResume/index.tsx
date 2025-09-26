import { Table, Tooltip } from 'antd';
import { ColumnType } from 'antd/es/table';
import { isEmpty, uniq } from 'lodash';
import * as moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
import { FC, Key, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RiChatForwardLine } from 'react-icons/ri';
import { TextLink } from '../../../../../../shared/TextLink/styled';
import { Constants } from '../../../../../../utils/Constants';
import { formatDuration } from '../../../../../../utils/formatDuration';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { WorkspaceUserService } from '../../../../../settings/service/WorkspaceUserService';
import { DashboardService } from '../../../../services/DashboardService';
import { DurationRangeFilter } from '../../../../utils/duration-range-filter';
import { getBackgroundColor } from '../../../../utils/get-bg-color/get-bg-color';
import { IntegerRangeFilter } from '../../../../utils/integer-range-filter';
import { useAnalyticsRanges } from '../../../../utils/use-analytics-ranges';
import { useRangeFilter } from '../../../../utils/use-range-filter';
import { UsersAnalytics } from '../../props';
import '../../style.scss';
import { useGetColumnSearchProps } from '../use-get-column-search/use-get-column-search';
import { FilterValuesUserResume, UserResumeProps } from './interfaces';

const UserResume: FC<UserResumeProps & I18nProps> = ({
    getTranslation,
    selectedWorkspace,
    selectedTeamId,
    expanded,
}) => {
    const timeoutRef: React.MutableRefObject<NodeJS.Timeout | number | null> = useRef(null);

    const { saveAnalyticsRange, initialAnalyticsRanges, removeAnalyticsRange } = useAnalyticsRanges(
        Constants.LOCAL_STORAGE_MAP.DASHBOARD_REAL_TIME_AGENTS,
        selectedWorkspace
    );
    const initialFilters = useMemo(
        () =>
            initialAnalyticsRanges || {
                countForService: [null, null],
                waitingAverageTime: [null, null],
                countInAttendance: [null, null],
                attendanceAverageTime: [null, null],
                countClosedAttendance: [null, null],
                selectedKeysData: [],
            },
        [initialAnalyticsRanges]
    );

    const { handleSetFilterValues } = useRangeFilter<FilterValuesUserResume>(initialFilters);
    const [data, setData] = useState<UsersAnalytics[]>([]);
    const [selectedKeysData, setSelectedKeysData] = useState<Key[]>([]);

    const filteredData = useMemo(() => {
        if (!selectedKeysData || isEmpty(selectedKeysData)) {
            return data;
        }

        return data.filter((row) => {
            return selectedKeysData.includes(row.key);
        });
    }, [data, selectedKeysData]);

    const formatUserData = (userIdList: string[], userList: any, data: any): UsersAnalytics[] => {
        return userIdList
            .map((userId) => {
                const selectedUser = userList?.data.find((user) => user._id === userId);

                if (!selectedUser) {
                    return null;
                }

                const waitingAverageTimeObj = data.waitingAverageTime.find((time) => time._id === userId);
                const attendanceAverageTime = data.attendanceAverageTime.find((time) => time._id === userId);
                const closedToday = data.closedToday.find((time) => time._id === userId);
                return {
                    key: userId,
                    user: selectedUser.name,
                    countForService: waitingAverageTimeObj?.count || 0,
                    countInAttendance: attendanceAverageTime?.count || 0,
                    waitingAverageTime: waitingAverageTimeObj?.averageTime || 0,
                    attendanceAverageTime: attendanceAverageTime?.averageTime || 0,
                    closedToday: closedToday?.count || 0,
                };
            })
            .filter((item): item is UsersAnalytics => item !== null);
    };

    const fetchData = useCallback(async () => {
        try {    
            setLoading(true);
            const teamId = selectedTeamId !== 'ALL_TEAMS' ? selectedTeamId : undefined;

            const data = await DashboardService.getConversationsResume(selectedWorkspace._id, 'user-resume', teamId);

            const userIdList = uniq([
                ...data?.waitingAverageTime.map((e) => e._id),
                ...data?.attendanceAverageTime.map((e) => e._id),
                ...data?.closedToday.map((e) => e._id),
            ]);
            
            if (isEmpty(userIdList)) {
                setData([]);
                setLoading(false);
                return;
            }

            let userList: any = { data: [] };

            userList = await WorkspaceUserService.getAll(selectedWorkspace._id, undefined, {
                _id: {
                    $in: userIdList,
                },
            });

            momentDurationFormatSetup(moment);
            moment.locale('pt-br');

            const formattedData = formatUserData(userIdList, userList, data);

            setData(formattedData);

            setLoading(false);
        } catch (error) {}
    }, [selectedTeamId, selectedWorkspace._id]);

    const doIntervalFetchData = useCallback(() => (timeoutRef.current = setInterval(fetchData, 10000)), [fetchData]);

    useEffect(() => {
        fetchData();

        return () => {
            if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = null;
            return;
        };
    }, [fetchData]);

    useEffect(() => {
        if (!expanded) {
            return;
        }

        doIntervalFetchData();
    }, [doIntervalFetchData, expanded]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setLoading(false);
        }, 2000);
    }, [loading]);

    useEffect(() => {
        if (initialAnalyticsRanges?.selectedKeysData) {
            setSelectedKeysData(initialAnalyticsRanges.selectedKeysData);
        }
    }, [initialAnalyticsRanges]);

    const searchProps = useGetColumnSearchProps<UsersAnalytics>({
        dataFilter: data,
        selectedKeysData,
        setSelectedKeysData,
        data,
        saveAnalyticsRange,
    });

    const columns: ColumnType<UsersAnalytics>[] = useMemo(
        () => [
            {
                className: 'columnHeader',
                title: <Tooltip title={getTranslation('Registered agents')}>{getTranslation('Agent')}</Tooltip>,
                dataIndex: 'user',
                width: '20%',
                sorter: (a, b) => a.user.localeCompare(b.user),
                sortDirections: ['descend', 'ascend', 'descend'],
                defaultSortOrder: 'ascend',

                ...searchProps,
                filtered: selectedKeysData.length > 0,
                filteredValue: selectedKeysData,
            },
            {
                className: 'columnHeader',
                title: (
                    <Tooltip
                        title={getTranslation(
                            'Appointments that have been taken over by the agent (no longer waiting for service) and are in their inbox, awaiting the agent response'
                        )}
                    >
                        {getTranslation('Waiting for response')}
                    </Tooltip>
                ),
                dataIndex: 'countForService',
                width: '15%',
                sorter: (a, b) => a.countForService - b.countForService,
                sortDirections: ['descend', 'ascend', 'descend'],
                filtered: initialFilters?.countForService?.some((val) => val !== null),
                filteredValue: initialFilters?.countForService,
                render: (text) => {
                    const value = text || 0;
                    const backgroundColor = getBackgroundColor(
                        'countForService',
                        value,
                        initialFilters,
                        'integer-range-filter'
                    );
                    return {
                        props: {
                            style: {
                                background: backgroundColor,
                                color: 'inherit',
                            },
                        },
                        children: value,
                    };
                },
                filterDropdown: (props) => (
                    <IntegerRangeFilter
                        removeFilterFromLocalStorage={removeAnalyticsRange}
                        dataIndex={'countForService'}
                        initialFilters={initialFilters}
                        saveLocalFilter={saveAnalyticsRange}
                        {...props}
                        setFilterValues={(min, max) => handleSetFilterValues('countForService', min, max)}
                    />
                ),
            },
            {
                className: 'columnHeader',
                title: (
                    <Tooltip
                        title={getTranslation(
                            'Average time taken for the agent\'s services to be initiated by him (taken over)'
                        )}
                    >
                        {getTranslation('Waiting average time')}
                    </Tooltip>
                ),
                dataIndex: 'waitingAverageTime',
                width: '15%',
                sorter: (a, b) => a.waitingAverageTime - b.waitingAverageTime,
                sortDirections: ['descend', 'ascend', 'descend'],
                filtered: initialFilters?.waitingAverageTime?.some((val) => val !== null),
                filteredValue: initialFilters?.waitingAverageTime,
                render: (text) => {
                    const data = formatDuration(text);
                    const value = text !== null ? Number(text) : 0;
                    const backgroundColor = getBackgroundColor(
                        'waitingAverageTime',
                        value,
                        initialFilters,
                        'duration-range-filter'
                    );
                    return {
                        props: {
                            style: {
                                background: backgroundColor,
                                color: 'inherit',
                            },
                        },
                        children: data,
                    };
                },
                filterDropdown: (props) => (
                    <DurationRangeFilter
                        removeFilterFromLocalStorage={removeAnalyticsRange}
                        dataIndex={'waitingAverageTime'}
                        initialFilters={initialFilters}
                        saveLocalFilter={saveAnalyticsRange}
                        {...props}
                        setFilterValues={(min, max) => handleSetFilterValues('waitingAverageTime', min, max)}
                    />
                ),
            },
            {
                className: 'columnHeader',
                title: (
                    <Tooltip title={getTranslation('Total number of appointments currently handled by the agent')}>
                        {getTranslation('Total in attendance')}
                    </Tooltip>
                ),
                dataIndex: 'countInAttendance',
                width: '15%',
                sorter: (a, b) => a.countInAttendance - b.countInAttendance,
                sortDirections: ['descend', 'ascend', 'descend'],
                filtered: initialFilters?.countInAttendance?.some((val) => val !== null),
                filteredValue: initialFilters?.countInAttendance,
                render: (count: number) => {
                    const value = count !== null ? Number(count) : 0;
                    const backgroundColor = getBackgroundColor(
                        'countInAttendance',
                        value,
                        initialFilters,
                        'integer-range-filter'
                    );
                    return {
                        props: {
                            style: {
                                background: backgroundColor,
                                color: 'inherit',
                            },
                        },
                        children: value,
                    };
                },
                filterDropdown: (props) => (
                    <IntegerRangeFilter
                        removeFilterFromLocalStorage={removeAnalyticsRange}
                        dataIndex={'countInAttendance'}
                        initialFilters={initialFilters}
                        saveLocalFilter={saveAnalyticsRange}
                        {...props}
                        setFilterValues={(min, max) => handleSetFilterValues('countInAttendance', min, max)}
                    />
                ),
            },
            {
                className: 'columnHeader',
                title: (
                    <Tooltip
                        title={getTranslation(
                            'Average time the agent appointments took from being transferred to the team until the session was completed'
                        )}
                    >
                        {getTranslation('Attendance average time')}
                    </Tooltip>
                ),
                dataIndex: 'attendanceAverageTime',
                width: '15%',
                sorter: (a, b) => a.attendanceAverageTime - b.attendanceAverageTime,
                sortDirections: ['descend', 'ascend', 'descend'],
                filtered: initialFilters?.attendanceAverageTime?.some((val) => val !== null),
                filteredValue: initialFilters?.attendanceAverageTime,
                render: (text) => {
                    const data = formatDuration(text);
                    const value = text !== null ? Number(text) : 0;
                    const backgroundColor = getBackgroundColor(
                        'attendanceAverageTime',
                        value,
                        initialFilters,
                        'duration-range-filter'
                    );
                    return {
                        props: {
                            style: {
                                background: backgroundColor,
                                color: 'inherit',
                            },
                        },
                        children: data,
                    };
                },
                filterDropdown: (props) => (
                    <DurationRangeFilter
                        removeFilterFromLocalStorage={removeAnalyticsRange}
                        dataIndex={'attendanceAverageTime'}
                        initialFilters={initialFilters}
                        saveLocalFilter={saveAnalyticsRange}
                        {...props}
                        setFilterValues={(min, max) => handleSetFilterValues('attendanceAverageTime', min, max)}
                    />
                ),
            },
            {
                className: 'columnHeader',
                title: (
                    <Tooltip title={getTranslation('Appointments that were completed by the agent on the day')}>
                        {getTranslation('Finished of the day')}
                    </Tooltip>
                ),
                dataIndex: 'closedToday',
                width: '15%',
                sorter: (a, b) => a.countClosedAttendance - b.countClosedAttendance,
                sortDirections: ['descend', 'ascend', 'descend'],
                filtered: initialFilters?.closedToday?.some((val) => val !== null),
                filteredValue: initialFilters?.closedToday,
                render: (text) => {
                    const value = text || 0;
                    const backgroundColor = getBackgroundColor(
                        'closedToday',
                        value,
                        initialFilters,
                        'integer-range-filter'
                    );
                    return {
                        props: {
                            style: {
                                background: backgroundColor,
                                color: 'inherit',
                            },
                        },
                        children: value,
                    };
                },
                filterDropdown: (props) => (
                    <IntegerRangeFilter
                        removeFilterFromLocalStorage={removeAnalyticsRange}
                        dataIndex={'closedToday'}
                        initialFilters={initialFilters}
                        saveLocalFilter={saveAnalyticsRange}
                        {...props}
                        setFilterValues={(min, max) => handleSetFilterValues('closedToday', min, max)}
                    />
                ),
            },
            {
                className: 'columnHeader',
                dataIndex: 'dashboardGuidedChat',
                width: '4%',
                render: (_, record) => (
                    <TextLink
                        type='link'
                        href={`/live-agent?workspace=${selectedWorkspace._id}&filter=${record.key}`}
                        target='_blank'
                        title={getTranslation('View calls from this agent')}
                        rel='noopener noreferrer'
                    >
                        <RiChatForwardLine color='#5d5d5d' size={26} />
                    </TextLink>
                ),
            },
        ],
        [
            getTranslation,
            searchProps,
            selectedKeysData,
            initialFilters,
            removeAnalyticsRange,
            saveAnalyticsRange,
            handleSetFilterValues,
            selectedWorkspace._id,
        ]
    );

    return (
        <>
            <Table
                style={{
                    marginBottom: '10px',
                    background: '#fff',
                    border: '1px solid #e8e8e8',
                    borderBottom: 'none',
                    borderRadius: '3px',
                }}
                showSorterTooltip={false}
                columns={columns}
                dataSource={filteredData}
                pagination={false}
                className='mb-4'
                loading={loading}
            />
        </>
    );
};

export default i18n(UserResume);
