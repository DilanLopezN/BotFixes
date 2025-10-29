import { Col, Row } from 'antd';
import { ColumnProps } from 'antd/lib/table';
import { FC, useEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { formatDuration } from '../../../../utils/formatDuration';
import { sumTime } from '../../../../utils/sumTime';
import I18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { PublicService } from '../../services/PublicService';
import { TeamData } from './interfaces';
import { Card, Content, ContentImg, ImgStyle, Table } from './styled';

const PublicDashboard: FC<I18nProps> = ({ getTranslation }) => {
    const location = useLocation();
    const history = useHistory();
    const search = new URLSearchParams(location.search);
    const timeoutRef: any = useRef(null);

    const [loading, setLoading] = useState<boolean>(true);
    const [data, setData] = useState<TeamData[]>([]);

    useEffect(() => {
        if (!search.get('workspaceId')) {
            return history.push('/home');
        }
        getResume();
        doIntervalFetchData();

        return () => {
            clearInterval(timeoutRef.current);
            timeoutRef.current = null;
        };
    }, []);

    const doIntervalFetchData = () => (timeoutRef.current = setInterval(getResume, 30000));

    const getResume = async () => {
        const workspaceId = search.get('workspaceId');
        let response = await PublicService.getResumeTeamRealTime(workspaceId!);
        const newData = response?.map((item: TeamData) => {
            return {
                ...item,
                waitingAverageTime: formatDuration(item.waitingAverageTimeValue || 0),
                attendanceAverageTime: formatDuration(item.averageTimeValue || 0),
                waitingAverageTimeValue: item.waitingAverageTimeValue || 0,
                attendanceAverageTimeValue: item.averageTimeValue || 0,
            };
        });

        setData(newData);
        setLoading(false);
    };

    const columns: ColumnProps<any>[] = [
        {
            className: 'columnHeader',
            title: getTranslation('Team'),
            dataIndex: 'team',
            ellipsis: true,
            width: '30%',
            sorter: (a, b) => a.team.localeCompare(b.team),
            sortDirections: ['descend', 'ascend'],
            defaultSortOrder: 'ascend',
        },
        {
            className: 'columnHeader',
            title: getTranslation('Awaiting'),
            dataIndex: 'countForService',
            width: '15%',
            sorter: (a, b) => a.countForService - b.countForService,
            sortDirections: ['descend', 'ascend'],
        },
        {
            className: 'columnHeader',
            title: 'TME',
            dataIndex: 'waitingAverageTime',
            width: '18%',
            sorter: (a, b) => sumTime(a.waitingAverageTime) - sumTime(b.waitingAverageTime),
            sortDirections: ['descend', 'ascend'],
        },
        {
            className: 'columnHeader',
            title: getTranslation('In attendance'),
            dataIndex: 'countInAttendance',
            width: '20%',
            sorter: (a, b) => a.countInAttendance - b.countInAttendance,
            sortDirections: ['descend', 'ascend'],
        },
        {
            className: 'columnHeader',
            title: 'TMA',
            dataIndex: 'attendanceAverageTime',
            width: '18%',
            sorter: (a, b) => sumTime(a.attendanceAverageTime) - sumTime(b.attendanceAverageTime),
            sortDirections: ['descend', 'ascend'],
        },
    ];

    return (
        <Content className='Public'>
            {loading ? (
                <>
                    <img
                        alt='loading'
                        src={'/assets/img/loading.gif'}
                        style={{
                            height: '70px',
                            padding: '0 10px',
                            width: '100px',
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                        }}
                    />
                </>
            ) : (
                <>
                    <Table
                        style={{
                            borderBottom: 'none',
                            borderRadius: '3px',
                            minWidth: '1200px',
                            width: '100%',
                        }}
                        rowClassName={(record, index) => (index % 2 === 0 ? 'table-row-light' : 'table-row-dark')}
                        size='large'
                        showSorterTooltip={false}
                        columns={columns}
                        dataSource={data}
                        loading={loading}
                        pagination={false}
                        title={(data: any) => {
                            let count = 0;
                            let attendanceAverageTimeTotal = 0;
                            let waitingAverageTimeTotal = 0;

                            data.forEach((item) => {
                                count += item?.countClosedAttendance || 0;
                                attendanceAverageTimeTotal += item?.attendanceAverageTimeValueClose || 0;
                                waitingAverageTimeTotal += item?.waitingAverageTimeValueClose || 0;
                            });

                            return (
                                <Row style={{ margin: '0 -15px 0 -15px' }} gutter={[16, 16]}>
                                    <Col span={8}>
                                        <Card>
                                            <span>{getTranslation('Finished on the day')}</span>
                                            <div>{count}</div>
                                        </Card>
                                    </Col>
                                    <Col style={{ display: 'flex', justifyContent: 'center' }} span={8}>
                                        <Card>
                                            <span>TME</span>
                                            <div>{formatDuration(waitingAverageTimeTotal / data.length)}</div>
                                        </Card>
                                    </Col>
                                    <Col style={{ display: 'flex', justifyContent: 'flex-end' }} span={8}>
                                        <Card>
                                            <span>TMA</span>
                                            <div>{formatDuration(attendanceAverageTimeTotal / data.length)}</div>
                                        </Card>
                                    </Col>
                                </Row>
                            );
                        }}
                        summary={(data: any) => {
                            let countInAttendanceTotal = 0;
                            let countForServiceTotal = 0;
                            let attendanceAverageTimeTotal = 0;
                            let waitingAverageTimeTotal = 0;

                            data.forEach((item) => {
                                countInAttendanceTotal += item.countInAttendance;
                                countForServiceTotal += item.countForService;
                                attendanceAverageTimeTotal += item.attendanceAverageTimeValue;
                                waitingAverageTimeTotal += item.waitingAverageTimeValue;
                            });

                            return data.length ? (
                                <>
                                    <Table.Summary.Row
                                        style={{ background: '#152d4c', color: '#fff', fontWeight: 'bold' }}
                                    >
                                        <Table.Summary.Cell index={0}>{getTranslation('Total')}</Table.Summary.Cell>
                                        <Table.Summary.Cell index={1}>{countForServiceTotal}</Table.Summary.Cell>
                                        <Table.Summary.Cell index={2}>
                                            {formatDuration(waitingAverageTimeTotal / data.length)}
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={3}>{countInAttendanceTotal}</Table.Summary.Cell>
                                        <Table.Summary.Cell index={4}>
                                            {formatDuration(attendanceAverageTimeTotal / data.length)}
                                        </Table.Summary.Cell>
                                    </Table.Summary.Row>
                                </>
                            ) : null;
                        }}
                    />
                    <ContentImg>
                        <ImgStyle src={'/assets/img/logo-horizontal-bot-RGB-2.svg'} />
                    </ContentImg>
                </>
            )}
        </Content>
    );
};

export default I18n(PublicDashboard);
