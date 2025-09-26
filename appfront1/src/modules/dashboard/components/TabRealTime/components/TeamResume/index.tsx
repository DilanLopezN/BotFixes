import { Col, Row, Table, Tooltip } from 'antd';
import { ColumnType } from 'antd/es/table';
import * as moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
import { FC, Key, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Constants } from '../../../../../../utils/Constants';
import { formatDuration } from '../../../../../../utils/formatDuration';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { DashboardService } from '../../../../services/DashboardService';
import { DurationRangeFilter } from '../../../../utils/duration-range-filter';
import { getBackgroundColor } from '../../../../utils/get-bg-color/get-bg-color';
import { IntegerRangeFilter } from '../../../../utils/integer-range-filter';
import { useAnalyticsRanges } from '../../../../utils/use-analytics-ranges';
import { useRangeFilter } from '../../../../utils/use-range-filter';
import { TeamsAnalytics } from '../../props';
import '../../style.scss';
import { useGetColumnSearchProps } from '../use-get-column-search';
import { FilterValuesTeamResume, TeamResumeProps } from './interfaces';
import { isEmpty } from 'lodash';

const TeamResume: FC<TeamResumeProps & I18nProps> = ({ getTranslation, selectedWorkspace, teams, expanded }) => {
    const { saveAnalyticsRange, initialAnalyticsRanges, removeAnalyticsRange } = useAnalyticsRanges(
        Constants.LOCAL_STORAGE_MAP.DASHBOARD_REAL_TIME_TEAMS,
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

    const [loading, setLoading] = useState(true);
    const timeoutRef: any = useRef(null);
    const [data, setData] = useState<TeamsAnalytics[]>([]);
    const [selectedKeysData, setSelectedKeysData] = useState<Key[]>([]);

    const { handleSetFilterValues } = useRangeFilter<FilterValuesTeamResume>(initialFilters);

    const filteredData = useMemo(() => {
        if (!selectedKeysData || isEmpty(selectedKeysData)) {
            return data;
        }

        return data.filter((row) => {
            return selectedKeysData.includes(row.key);
        });
    }, [data, selectedKeysData]);

    const formatData = useCallback(
        (data: any[]): any[] => {
            momentDurationFormatSetup(moment);
            moment.locale('pt-br');

            return teams.map((team) => {
                const item = data?.find((item) => item._id === team._id);
                return {
                    key: team._id,
                    team: team.name,
                    count: item?.count || 0,
                    averageTimeValue: item?.averageTime || 0,
                    averageTime: item?.averageTime || 0,
                };
            });
        },
        [teams]
    );

    const fetchData = useCallback(async () => {
        try {
            const data = await DashboardService.getConversationsResume(selectedWorkspace._id, 'team-resume');
            const dataClosedDay = await DashboardService.getConversationsResume(
                selectedWorkspace._id,
                'team-resume-closed-day'
            );

            if (data) {
                const waitingAverageTime = formatData(data.waitingAverageTime || []);
                const attendanceAverageTime = formatData(data.attendanceAverageTime || []);
                const teamData = {};
                if (waitingAverageTime.length > 0 || attendanceAverageTime.length > 0) {
                    waitingAverageTime?.forEach((item) => {
                        teamData[item.key] = {
                            key: item.key,
                            team: item.team,
                            countForService: item.count,
                            countInAttendance: 0,
                            waitingAverageTime: item.averageTime,
                            waitingAverageTimeValue: item.averageTimeValue,
                            attendanceAverageTime: '00:00:00',
                            attendanceAverageTimeValue: 0,
                        };
                    });
                    attendanceAverageTime?.forEach((item) => {
                        teamData[item.key] = {
                            key: teamData?.[item.key]?.key || item.key,
                            team: teamData?.[item.key]?.team || item.team,
                            countForService: teamData?.[item.key]?.countForService,
                            countInAttendance: item.count,
                            waitingAverageTime: teamData?.[item.key]?.waitingAverageTime || 0,
                            waitingAverageTimeValue: teamData?.[item.key]?.waitingAverageTimeValue || 0,
                            attendanceAverageTime: item.averageTime,
                            attendanceAverageTimeValue: item.averageTimeValue || 0,
                        };
                    });
                    if (dataClosedDay?.metricsTeamClosedDay?.length) {
                        dataClosedDay.metricsTeamClosedDay?.forEach((element) => {
                            if (teamData[element._id]) {
                                teamData[element._id] = {
                                    ...teamData[element._id],
                                    attendanceAverageTimeValueClose: element.attendanceAverageTime,
                                    waitingAverageTimeValueClose: element.waitingAverageTime,
                                    countClosedAttendance: element.count,
                                };
                            }
                        });
                    }
                }
                const newData = Object.values(teamData) as TeamsAnalytics[];
                setData(newData);
            }

            if (data.waitingAverageTime.length === 0 && data.attendanceAverageTime.length === 0) {
                setLoading(true);
            } else {
                setLoading(false);
            }
        } catch (error) {}
    }, [formatData, selectedWorkspace._id]);

    useEffect(() => {
        fetchData();

        return () => {
            clearInterval(timeoutRef.current);
            timeoutRef.current = null;
            return;
        };
    }, [fetchData]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const doIntervalFechData = () => (timeoutRef.current = setInterval(fetchData, 10000));

    useEffect(() => {
        if (!expanded) {
            return;
        }

        doIntervalFechData();
    }, [doIntervalFechData, expanded]);

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

    const searchProps = useGetColumnSearchProps<TeamsAnalytics>({
        dataFilter: teams,
        saveAnalyticsRange,
        selectedKeysData,
        setSelectedKeysData,
        data,
        showOnlyWith: true,
    });

    const columns: ColumnType<TeamsAnalytics>[] = useMemo(
        () => [
            {
                className: 'columnHeader',
                title: <Tooltip title={getTranslation('Registered teams')}>{getTranslation('Team')}</Tooltip>,
                dataIndex: 'team',
                width: '20%',
                ellipsis: true,
                sorter: (a, b) => a.team.localeCompare(b.team),
                sortDirections: ['descend', 'ascend', 'descend'],
                defaultSortOrder: 'ascend',
                filtered: selectedKeysData.length > 0,
                filteredValue: selectedKeysData,
                ...searchProps,
            },
            {
                className: 'columnHeader',
                title: (
                    <Tooltip
                        title={getTranslation(
                            'Appointments that were transferred to a team and are waiting for an agent to take over'
                        )}
                    >
                        {getTranslation('Awaiting agent')}
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
                            'Average time it takes for the team pending appointments to be initiated (taken over)'
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
                    <Tooltip
                        title={getTranslation('Total number of appointments currently handled by the team agents')}
                    >
                        {getTranslation('Total in attendance')}
                    </Tooltip>
                ),
                dataIndex: 'countInAttendance',
                width: '15%',
                sorter: (a, b) => a.countInAttendance - b.countInAttendance,
                sortDirections: ['descend', 'ascend', 'descend'],
                filtered: initialFilters?.countInAttendance?.some((val) => val !== null),
                filteredValue: initialFilters?.countInAttendance,
                render: (text) => {
                    const value = text || 0;
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
                            'Average time the team appointments take from being transferred to the team until the session is completed'
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
                    <Tooltip title={getTranslation('Number of appointments completed by the team on the day')}>
                        {getTranslation('Finished of the day')}
                    </Tooltip>
                ),
                dataIndex: 'countClosedAttendance',
                width: '15%',
                sorter: (a, b) => (a.countClosedAttendance || 0) - (b.countClosedAttendance || 0),
                sortDirections: ['descend', 'ascend', 'descend'],
                filtered: initialFilters?.countClosedAttendance?.some((val) => val !== null),
                filteredValue: initialFilters?.countClosedAttendance,
                render: (text) => {
                    const value = text || 0;
                    const backgroundColor = getBackgroundColor(
                        'countClosedAttendance',
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
                        dataIndex={'countClosedAttendance'}
                        initialFilters={initialFilters}
                        saveLocalFilter={saveAnalyticsRange}
                        {...props}
                        setFilterValues={(min, max) => handleSetFilterValues('countClosedAttendance', min, max)}
                    />
                ),
            },
        ],
        [
            getTranslation,
            selectedKeysData,
            searchProps,
            initialFilters,
            removeAnalyticsRange,
            saveAnalyticsRange,
            handleSetFilterValues,
        ]
    );

    return (
        <>
            <Table
                style={{
                    marginBottom: '10px',
                    minWidth: '1000px',
                    background: '#fff',
                    border: '1px solid #e8e8e8',
                    borderBottom: 'none',
                    borderRadius: '3px',
                }}
                showSorterTooltip={false}
                columns={columns}
                dataSource={filteredData}
                loading={loading}
                pagination={false}
                className='mb-4'
                footer={(data) => {
                    let attendanceAverageTimeTotal = 0;
                    let waitingAverageTimeTotal = 0;

                    data.forEach((item) => {
                        attendanceAverageTimeTotal += item?.attendanceAverageTimeValueClose || 0;
                        waitingAverageTimeTotal += item?.waitingAverageTimeValueClose || 0;
                    });

                    return (
                        <Row style={{ fontWeight: 'bold', fontSize: '15px' }} gutter={[16, 16]}>
                            <Col span={8} offset={6}>
                                {`${getTranslation('TME average total')}: ${formatDuration(
                                    waitingAverageTimeTotal / data.length
                                )}`}
                            </Col>
                            <Col span={8}>
                                {`${getTranslation('TMA average total')}: ${formatDuration(
                                    attendanceAverageTimeTotal / data.length
                                )}`}
                            </Col>
                        </Row>
                    );
                }}
                summary={(data) => {
                    let countClosedAttendance = 0;
                    let countInAttendanceTotal = 0;
                    let countForServiceTotal = 0;
                    let attendanceAverageTimeTotal = 0;
                    let waitingAverageTimeTotal = 0;

                    data.forEach((item) => {
                        countClosedAttendance += item?.countClosedAttendance || 0;
                        countInAttendanceTotal += item.countInAttendance;
                        countForServiceTotal += item.countForService;
                        attendanceAverageTimeTotal += item.attendanceAverageTimeValue;
                        waitingAverageTimeTotal += item.waitingAverageTimeValue;
                    });

                    return (
                        <>
                            <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                                <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
                                <Table.Summary.Cell index={1}>{countForServiceTotal}</Table.Summary.Cell>
                                <Table.Summary.Cell index={2}>
                                    {formatDuration(waitingAverageTimeTotal / data.length)}
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={3}>{countInAttendanceTotal}</Table.Summary.Cell>
                                <Table.Summary.Cell index={4}>
                                    {formatDuration(attendanceAverageTimeTotal / data.length)}
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={5}>{countClosedAttendance}</Table.Summary.Cell>
                            </Table.Summary.Row>
                        </>
                    );
                }}
            />
        </>
    );
};

export default i18n(TeamResume);
