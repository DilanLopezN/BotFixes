import { PrivacyPolicyProps } from './props';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { FC, useEffect, useState } from 'react';
import { useHistory, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import Header from '../../../../shared-v2/Header/Header';
import { Button, Empty, Table, Tag, Tooltip } from 'antd';
import EditPrivacyPolicy from './components/EditPrivacyPolicy';
import { ScrollView } from '../ScrollView';
import { ColumnsType } from 'antd/lib/table';
import { PrivacyPolicyInterface } from '../../interfaces/privacy-policy';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { ChannelConfig } from '../../../../model/Bot';
import { ChannelConfigService } from '../../../newChannelConfig/service/ChannelConfigService';
import { PrivacyPolicyService } from '../../service/PrivacyPolicyService';
import Paragraph from 'antd/lib/typography/Paragraph';
import { formattingWhatsappText } from '../../../../utils/Activity';
import moment from 'moment';

const PrivacyPolicy: FC<PrivacyPolicyProps & I18nProps> = (props) => {
    const { getTranslation, selectedWorkspace, menuSelected } = props;
    const history = useHistory();

    const [editPrivacyPolicy, setEditPrivacyPolicy] = useState(false);
    const [loading, setLoading] = useState(false);
    const [channels, setChannels] = useState<ChannelConfig[]>([]);
    const [data, setData] = useState<PrivacyPolicyInterface[]>([]);
    const locale = {
        emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={getTranslation('No Data')} />,
    };

    const columns: ColumnsType<PrivacyPolicyInterface> = [
        {
            title: <Wrapper fontWeight='bold'>{getTranslation('Text')}</Wrapper>,
            dataIndex: 'text',
            key: 'text',
            width: 200,
            render: (text) => {
                return (
                    <Tooltip
                        title={formattingWhatsappText(text)}
                        placement='bottomLeft'
                        overlayInnerStyle={{ maxWidth: 600, width: 'max-content', fontSize: 13 }}
                    >
                        <Paragraph ellipsis={{ rows: 2, expandable: false }}>{text}</Paragraph>
                    </Tooltip>
                );
            },
        },
        {
            title: <Wrapper fontWeight='bold'>{getTranslation('Channels')} </Wrapper>,
            width: 200,
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
        },
        {
            title: <Wrapper fontWeight='bold'>{getTranslation('Data da última atualização')} </Wrapper>,
            width: 50,
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (createdAt, record) => {
                const date = record.updateAcceptanceAt || createdAt;
                return <span>{moment(date).format('DD/MM/YYYY HH:mm')}</span>
            },
        },
    ];

    const getChannelConfigs = async () => {
        const filter = {
            workspaceId: selectedWorkspace._id,
            enable: true,
        };

        const data = await ChannelConfigService.getChannelsConfig(filter);
        return setChannels(data);
    };

    useEffect(() => {
        getChannelConfigs();
    }, []);

    const getPrivacyPolicyList = async () => {
        setLoading(true);
        const response = await PrivacyPolicyService.getPrivacyPolicyList(selectedWorkspace._id);
        setData(response || []);
        setTimeout(() => setLoading(false), 300);
    };

    useEffect(() => {
        getPrivacyPolicyList();
    }, [selectedWorkspace._id]);

    return (
        <>
            {editPrivacyPolicy ? (
                <EditPrivacyPolicy selectedWorkspace={selectedWorkspace} channelConfigList={channels} />
            ) : (
                <>
                    <Header
                        title={getTranslation(menuSelected.title)}
                        action={
                            <Button
                                type='primary'
                                className='antd-span-default-color'
                                children={getTranslation('Add')}
                                onClick={() => {
                                    setEditPrivacyPolicy(true);
                                }}
                            />
                        }
                    />
                    <ScrollView padding='16px 24px' minWidth='900px' id='content-privacy-policy'>
                        <Table
                            style={{
                                minWidth: '850px',
                                margin: '0 auto',
                                background: '#fff',
                                borderRadius: '5px',
                                padding: '1px',
                                boxShadow: 'rgba(0, 0, 0, 0.16) 0px 1px 4px',
                            }}
                            loading={loading}
                            columns={columns}
                            dataSource={data}
                            pagination={false}
                            size='middle'
                            locale={locale}
                            onRow={(data, index) => {
                                return {
                                    onClick: () => history.push(`/settings/privacy-policy/${data.id}`),
                                    style: {cursor: 'pointer'}
                                };
                            }}
                        />
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
export default i18n(withRouter(connect(mapStateToProps, null)(PrivacyPolicy as FC<PrivacyPolicyProps>)));
