import { FC, useEffect, useState } from 'react';
import { EmailSendingSettingListProps } from './props';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import i18n from '../../../../../i18n/components/i18n';
import Header from '../../../../../../shared-v2/Header/Header';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { ScrollView } from '../../../../../settings/components/ScrollView';
import { Button, Empty, Table, Tag } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { useHistory } from 'react-router-dom';
import EmailSendingSettingForm from '../EmailSendingSettingForm';
import { APP_TYPE_PORT, getBaseUrl } from '../../../../../../utils/redirectApp';
import { EmailSendingSettingService } from '../../../../service/EmailSendingSettingService/EmailSendingSettingService';
import { EmailSendingSetting } from '../../../../service/EmailSendingSettingService/interface';

const EmailSendingSettingList: FC<EmailSendingSettingListProps & I18nProps> = (props) => {
    const { getTranslation, loggedUser, selectedWorkspace } = props;
    const history = useHistory();

    const [data, setData] = useState<EmailSendingSetting[]>([]);
    const [loading, setLoading] = useState(false);
    const [createEmailSendingSetting, setCreateEmailSendingSetting] = useState(false);

    const locale = {
        emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={getTranslation('No Data')} />,
    };

    const columns: ColumnsType<EmailSendingSetting> = [
        {
            title: <Wrapper fontWeight='bold'>{getTranslation('Name')}</Wrapper>,
            dataIndex: 'settingName',
            key: 'settingName',
            width: 200,
            render: (value) => {
                return value || getTranslation('Setting');
            },
        },
        {
            title: <Wrapper fontWeight='bold'>{getTranslation('Active')}</Wrapper>,
            dataIndex: 'enabled',
            key: 'enabled',
            width: 200,
            render: (value) => {
                return <Tag color={!!value ? 'green' : 'red'}>{getTranslation(!!value ? 'Yes' : 'No')}</Tag>;
            },
        },
    ];

    const getEmailSendingSettingList = async () => {
        setLoading(true);
        const response = await EmailSendingSettingService.listEmailSendingSetting(selectedWorkspace._id);
        setData(response || []);
        setTimeout(() => setLoading(false), 300);
    };


    useEffect(() => {
        getEmailSendingSettingList();
    }, [selectedWorkspace._id]);

    return (
        <>
            {createEmailSendingSetting ? (
                <EmailSendingSettingForm selectedWorkspace={selectedWorkspace} loggedUser={loggedUser} />
            ) : (
                <>
                    <Header
                        title={getTranslation('Lista de configurações de envio de E-mail')}
                        action={
                            <Button
                                type='primary'
                                className='antd-span-default-color'
                                children={getTranslation('Add')}
                                onClick={() => {
                                    setCreateEmailSendingSetting(true);
                                }}
                            />
                        }
                    />
                    <ScrollView padding='16px 24px' minWidth='900px' id='content-email-sending-setting'>
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
                                    onMouseDown: (e) => {
                                        if (e.ctrlKey || e.button === 1) {
                                            window.open(
                                                getBaseUrl({
                                                    appTypePort: APP_TYPE_PORT.APP,
                                                    pathname: `/campaigns/email-sending-settings/${data.id}`,
                                                }),
                                                '_blank'
                                            );
                                        } else {
                                            history.push(`/campaigns/email-sending-settings/${data.id}`);
                                        }
                                    },
                                    style: { cursor: 'pointer' },
                                };
                            }}
                        />
                    </ScrollView>
                </>
            )}
        </>
    );
};

export default i18n(EmailSendingSettingList) as FC<EmailSendingSettingListProps>;
