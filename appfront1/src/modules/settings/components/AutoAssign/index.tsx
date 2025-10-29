import { Button, Col, Empty, Input, Row, Space, Table, Tag } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { FC, useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useHistory, withRouter } from 'react-router-dom';
import styled from 'styled-components';
import { ChannelConfig } from '../../../../model/Bot';
import { Team } from '../../../../model/Team';
import { Workspace } from '../../../../model/Workspace';
import Header from '../../../../shared-v2/Header/Header';
import { LabelWithTooltip } from '../../../../shared-v2/LabelWithToltip';
import { TextLink } from '../../../../shared/TextLink/styled';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { timeout } from '../../../../utils/Timer';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { ScrollView } from '../../../newChannelConfig/components/ScrollView';
import { ChannelConfigService } from '../../../newChannelConfig/service/ChannelConfigService';
import { AutoAssignConversation } from '../../interfaces/auto-assign-conversation.interface';
import { SearchFilters } from '../../interfaces/search-filters.interface';
import { AutoAssignService } from '../../service/AutoAssignService';
import { SettingsService } from '../../service/SettingsService';
import EditAutoAssign from './components/EditAutoAssign';

interface SelfSingProps {
    selectedWorkspace: Workspace;
}

const { Search } = Input;

const Title = styled.span`
    font-size: 16px;
    font-weight: 700;
`;

const AutoAssignWrapper: FC<SelfSingProps & I18nProps> = (props) => {
    const { getTranslation, selectedWorkspace } = props;
    const history = useHistory();
    const [data, setData] = useState<AutoAssignConversation[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [teams, setTeams] = useState<Team[]>([]);
    const [channels, setChannels] = useState<ChannelConfig[]>([]);
    const [editAddingContact, setEditAddingContact] = useState(false);
    const [currentPage, setCurrentPage] = useState<number>(1);

    const [filters, setFilters] = useState<SearchFilters>({
        search: '',
        skip: 0,
        limit: 10,
        origin: '',
        total: 0,
    });

    const locale = {
        emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={getTranslation('No Data')} />,
    };

    const columns: ColumnsType<AutoAssignConversation> = [
        {
            title: (
                <Wrapper fontWeight='bold'>
                    <LabelWithTooltip
                        placementText='top'
                        color='primary'
                        label={getTranslation('Name')}
                        tooltipText={getTranslation('Auto assign name')}
                    />
                </Wrapper>
            ),
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            width: 200,
            render: (name, record) => <TextLink onClick={() => editAutoAssign(record)}> {name} </TextLink>,
        },
        {
            title: (
                <Wrapper fontWeight='bold'>
                    <LabelWithTooltip
                        placementText='top'
                        color='primary'
                        label={getTranslation('Contacts')}
                        tooltipText={getTranslation('Number of contacts')}
                    />
                </Wrapper>
            ),
            dataIndex: 'contactCount',
            key: 'contactCount',
            width: 100,
        },
        {
            title: (
                <Wrapper fontWeight='bold'>
                    <LabelWithTooltip
                        placementText='top'
                        color='primary'
                        label={getTranslation('Team')}
                        tooltipText={getTranslation('Which team will transfer as soon as the number starts a service')}
                    />
                </Wrapper>
            ),
            dataIndex: 'teamId',
            key: 'teamId',
            width: 150,
            render: (_, record) => {
                const team = teams?.find((team) => team._id === record.teamId);
                return (
                    <div
                        style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '200px',
                        }}
                    >
                        {team?.name || '--'}
                    </div>
                );
            },
        },
        {
            title: (
                <Wrapper fontWeight='bold'>
                    <LabelWithTooltip
                        placementText='top'
                        color='primary'
                        label={getTranslation('Channels')}
                        tooltipText={getTranslation('Channels that will auto-assign')}
                    />
                </Wrapper>
            ),
            dataIndex: 'channelConfigIds',
            key: 'channelConfigIds',
            render: (channelsIds: string[]) => (
                <>
                    {channelsIds.map((channelId) => {
                        const channel = channels?.find((channel) => channel._id === channelId);

                        const channelTitle = channel?.name || '--';

                        return (
                            <Tag color='blue' key={channelId}>
                                {channelTitle}
                            </Tag>
                        );
                    })}
                </>
            ),
            width: 200,
        },
    ];

    const getTeams = async () => {
        const filter = {
            limit: 40,
        };

        const response = await SettingsService.getTeams(filter, selectedWorkspace._id);
        return setTeams(response?.data);
    };

    const getChannelConfigs = async () => {
        const filter = {
            workspaceId: selectedWorkspace._id,
            enable: true,
        };

        const data = await ChannelConfigService.getChannelsConfig(filter);
        return setChannels(data);
    };

    useEffect(() => {
        getTeams();
        getChannelConfigs();
    }, []);

    const onSearch = (filter: SearchFilters) => {
        setFilters({
            ...filter,
            origin: 'search',
            skip: 0,
        });
        setCurrentPage(1);
    };

    const handleSearch = (value: string) => {
        const filter: SearchFilters = {
            ...filters,
            search: value,
            origin: 'search',
            skip: 0,
        };
        onSearch(filter);
    };

    const editAutoAssign = (record: AutoAssignConversation) => {
        history.push(`/settings/auto-assigns/${record.id}`, { channels, teams });
    };

    const getAutoAssignConversations = useCallback(async () => {
        const response = await AutoAssignService.getAutoAssignConversations(filters, selectedWorkspace._id);
        setData(response?.data || []);
        setFilters((prevFilters) => ({
            ...prevFilters,
            total: response?.count || 0,
        }));
        timeout(() => setLoading(false), 100);
    }, [filters, selectedWorkspace._id]);

    useEffect(() => {
        getAutoAssignConversations();
    }, [filters.search, selectedWorkspace._id, currentPage]);

    const modalEditAutoAssign = (
        <EditAutoAssign
            {...{
                teams,
                channels,
                workspaceId: selectedWorkspace._id,
                selectedWorkspace,
                history,
            }}
        />
    );

    return (
        <>
            {editAddingContact ? (
                modalEditAutoAssign
            ) : (
                <>
                    <Header
                        title={`${getTranslation('Automatically assigned')}`}
                        action={
                            <Button
                                type='primary'
                                className='antd-span-default-color'
                                children={getTranslation('Add new list')}
                                onClick={() => setEditAddingContact(true)}
                            />
                        }
                    />
                    <ScrollView padding='16px 24px' minWidth='900px' id='content-teams'>
                        <Space direction={'vertical'} size='middle'>
                            <Row justify={'space-between'}>
                                <Col>
                                    <Title>{getTranslation('Contact list')}</Title>
                                </Col>
                                <Col>
                                    <Search
                                        placeholder={getTranslation('Search the list')}
                                        onSearch={handleSearch}
                                        allowClear
                                        style={{ width: 300 }}
                                    />
                                </Col>
                            </Row>
                            {!loading && (
                                <Table
                                    style={{
                                        minWidth: '850px',
                                        margin: '0 auto',
                                        background: '#F4F4FB',
                                        borderRadius: '5px',
                                        padding: '1px',
                                        boxShadow: 'rgba(0, 0, 0, 0.16) 0px 1px 4px',
                                    }}
                                    columns={columns}
                                    dataSource={data.map((row) => ({ ...row, key: row.id }))}
                                    size='middle'
                                    pagination={{
                                        current: Math.floor(filters.skip / filters.limit) + 1,
                                        onChange: (page, pageSize) => {
                                            const newFilters: SearchFilters = {
                                                ...filters,
                                                skip: (page - 1) * filters.limit,
                                                limit: pageSize,
                                            };
                                            setFilters(newFilters);
                                            setCurrentPage(page);
                                        },

                                        total: filters.total || 0,
                                        pageSize: filters.limit,
                                    }}
                                    locale={locale}
                                />
                            )}
                        </Space>
                    </ScrollView>
                </>
            )}
        </>
    );
};
const mapStateToProps = (state: any, ownProps: any) => ({
    loggedUser: state.loginReducer.loggedUser,
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
});
export default i18n(withRouter(connect(mapStateToProps, null)(AutoAssignWrapper)));
