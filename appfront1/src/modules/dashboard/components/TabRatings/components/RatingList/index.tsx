import { Rate, Table, Tag } from 'antd';
import { ColumnProps } from 'antd/lib/table';
import axios, { CancelTokenSource } from 'axios';
import moment from 'moment';
import { FC, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import DownloadModal from '../../../../../../shared/DownloadModal';
import { typeDownloadEnum } from '../../../../../../shared/DownloadModal/props';
import { Modal } from '../../../../../../shared/Modal/Modal';
import { ModalPosition } from '../../../../../../shared/Modal/ModalProps';
import { TextLink } from '../../../../../../shared/TextLink/styled';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { addNotification } from '../../../../../../utils/AddNotification';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { DashboardService } from '../../../../services/DashboardService';
import '../../style.scss';
import InfoAvgRatings from '../InfoAvgRatings';
import InfoRating from '../InfoRating';
import { RatingFilterInterface } from '../RatingFilter/props';
import { AvgRating, Filters, RatingListProps } from './props';

let cancelToken: CancelTokenSource | null = null;
const emptyAvg: AvgRating = {
    avg: 0,
    count: 0,
    values: {
        note1: 0,
        note2: 0,
        note3: 0,
        note4: 0,
        note5: 0,
    },
};

const RatingList: FC<RatingListProps & I18nProps> = ({
    getTranslation,
    selectedWorkspace,
    appliedFilters,
    teams,
    users,
    onLoading,
}) => {
    const [filters, setFilters] = useState<Filters | undefined>(undefined);
    const [dataSource, setDataSource] = useState<any[]>([]);
    const [modalInfoRating, setModalInfoRating] = useState<any>(undefined);
    const [loading, setLoading] = useState(true);
    const [infoAvgRating, setInfoAvgRating] = useState<AvgRating>(emptyAvg);
    const { loggedUser } = useSelector((state: any) => state.loginReducer);

    const pendingCb = (isPending: boolean): any => {
        if (isPending) {
            setLoading(true);
        } else {
            setLoading(false);
        }
    };

    const formatData = (ratingList) => {
        const data = ratingList?.map((rating, index) => {
            return {
                key: index,
                rating: {
                    value: rating.value,
                    id: rating.id,
                },
                feedback: rating.ratingFeedback,
                tags: rating.tags,
                date: rating.ratingAt,
                action: {
                    workspaceId: rating.workspaceId,
                    conversationId: rating.conversationId,
                },
                modalInfo: {
                    userId: rating.closedBy,
                    teamId: rating.teamId,
                    value: rating.value,
                    feedback: rating.ratingFeedback,
                    ratingAt: rating.ratingAt,
                    createdAt: rating.createdAt,
                },
            };
        });

        return setDataSource(data);
    };

    const getRatings = useCallback(
        async (filters: Filters) => {
            if (cancelToken) {
                cancelToken.cancel();
            }
            let err: any;
            cancelToken = axios.CancelToken.source();
            const response: any = await DashboardService.getRatings(
                selectedWorkspace._id as string,
                filters.skip,
                { ...appliedFilters, timezone: loggedUser?.timezone },
                cancelToken,
                (responseError) => (err = responseError),
                pendingCb
            );

            if (response) {
                setInfoAvgRating({
                    avg: response.avg,
                    count: response.count,
                    values: response.values || emptyAvg.values,
                });
                setFilters({ total: response.count, skip: filters.skip });
                formatData(response.data);
            }
        },
        [appliedFilters, loggedUser?.timezone, selectedWorkspace._id]
    );

    const downloadRating = async (downloadType: string) => {
        if (!appliedFilters.rangeDate?.length) {
            addNotification({
                type: 'warning',
                duration: 3000,
                title: getTranslation('Error'),
                message: getTranslation('Selecione um perído para realizar o download'),
            });
            return;
        }

        if (moment(appliedFilters.rangeDate[1]).diff(moment(appliedFilters.rangeDate[0]), 'days') > 90) {
            addNotification({
                type: 'warning',
                duration: 3000,
                title: getTranslation('Error'),
                message: getTranslation('Perído Máximo de 90 dias para download'),
            });
            return;
        }

        const filter: RatingFilterInterface = {
            ...appliedFilters,
            timezone: loggedUser?.timezone,
            downloadType: downloadType === 'XLSX' ? typeDownloadEnum.XLSX : typeDownloadEnum.CSV,
        };

        await DashboardService.getRatingCsv(selectedWorkspace._id as string, filter);
    };

    useEffect(() => {
        getRatings({ total: 0, skip: 0 });
    }, [getRatings]);

    useEffect(() => {
        onLoading(loading);
    }, [loading, onLoading]);

    useEffect(() => {
        return () => {
            if (cancelToken) {
                cancelToken.cancel();
            }
        };
    }, []);

    const columns: ColumnProps<any>[] = [
        {
            className: 'columnHeader',
            width: '200px',
            title: getTranslation('Rating'),
            dataIndex: 'rating',
            key: 'rating',
            render: (rating) => <Rate key={rating.id} disabled defaultValue={rating.value} />,
        },
        {
            className: 'columnHeader',
            ellipsis: true,
            title: getTranslation('Feedback'),
            dataIndex: 'feedback',
            key: 'feedback',
            render: (text) => (
                <div
                    style={{
                        width: '100%',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                    }}
                    title={text}
                >
                    {text}
                </div>
            ),
        },
        {
            className: 'columnHeader',
            title: 'Tags',
            dataIndex: 'tags',
            key: 'tags',
            render: (tags) => (
                <>
                    {tags.map((tag) => {
                        return (
                            <Tag
                                style={{
                                    textOverflow: 'ellipsis',
                                    maxWidth: '70px',
                                    overflow: 'hidden',
                                }}
                                title={tag}
                                color='blue'
                                key={tag}
                            >
                                {tag}
                            </Tag>
                        );
                    })}
                </>
            ),
        },
        {
            className: 'columnHeader',
            width: '120px',
            title: getTranslation('Date'),
            dataIndex: 'date',
            key: 'date',
            render: (text) => <div>{moment(parseFloat(text)).format('DD/MM/YYYY')}</div>,
        },
        {
            className: 'columnHeader',
            width: '100px',
            align: 'center',
            title: getTranslation('Actions'),
            dataIndex: 'action',
            key: 'action',
            render: (value) => (
                <TextLink
                    style={{ color: '#696969' }}
                    title={getTranslation('Ir para conversa')}
                    className='mdi mdi-share mdi-18px goToConversation'
                    href={`/live-agent?workspace=${value.workspaceId}&conversation=${value.conversationId}`}
                    target='_blank'
                />
            ),
        },
    ];

    return (
        <Wrapper flexBox flexDirection='column'>
            {modalInfoRating && (
                <Modal
                    position={ModalPosition.center}
                    isOpened={modalInfoRating ? true : false}
                    className='confirmationModal'
                    onClickOutside={() => setModalInfoRating(undefined)}
                    height='auto'
                    width='500px'
                >
                    <InfoRating users={users} teams={teams} info={modalInfoRating} />
                </Modal>
            )}

            <InfoAvgRatings loading={loading} infoAvgRating={infoAvgRating} />
            {dataSource && dataSource.length ? (
                <Wrapper
                    flexBox
                    justifyContent='flex-end'
                    width='100%'
                    maxWidth='1300px'
                    minWidth='1000px'
                    padding='0 0 1rem 0'
                    margin='auto'
                >
                    <>
                        <DownloadModal onDownload={downloadRating} />
                    </>
                </Wrapper>
            ) : null}
            <Table
                loading={loading}
                columns={columns}
                dataSource={dataSource}
                style={{
                    margin: 'auto',
                    background: '#fff',
                    border: '1px solid #e8e8e8',
                    borderBottom: 'none',
                    borderRadius: '3px',
                    maxWidth: '1300px',
                    minWidth: '1000px',
                }}
                className='mb-4 ratingTable'
                onRow={(record) => ({
                    onClick: () => {
                        setModalInfoRating(record.modalInfo);
                    },
                })}
                pagination={{
                    total: filters?.total,
                    onChange: (page) => {
                        setFilters({ total: filters?.total as number, skip: page - 1 });
                        getRatings({
                            total: filters?.total as number,
                            skip: (page - 1) * 10,
                        });
                    },
                    showSizeChanger: false,
                }}
            />
        </Wrapper>
    );
};

export default i18n(RatingList) as FC<RatingListProps>;
