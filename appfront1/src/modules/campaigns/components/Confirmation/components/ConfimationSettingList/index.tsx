import { CopyOutlined } from '@ant-design/icons';
import { Alert, Button, Empty, Input, Modal, Space, Table, Tag, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { FC, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { HealthIntegration } from '../../../../../../model/Integrations';
import Header from '../../../../../../shared-v2/Header/Header';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { addNotification } from '../../../../../../utils/AddNotification';
import { APP_TYPE_PORT, getBaseUrl } from '../../../../../../utils/redirectApp';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { HealthService } from '../../../../../integrations/services/HealthService';
import { ScrollView } from '../../../../../settings/components/ScrollView';
import { ScheduleSetting } from '../../../../interfaces/schedule-setting';
import { ConfirmationSettingService } from '../../../../service/ConfirmationService';
import ConfirmationSettingForm from '../ConfirmationSettingForm';
import { ConfirmationSettingListProps } from './props';

const ConfirmationSettingList: FC<ConfirmationSettingListProps & I18nProps> = (props) => {
    const { getTranslation, loggedUser, selectedWorkspace } = props;
    const history = useHistory();

    const [data, setData] = useState<ScheduleSetting[]>([]);
    const [integrations, setIntegrations] = useState<HealthIntegration[]>([]);
    const [loading, setLoading] = useState(false);
    const [createConfirmationSetting, setCreateConfirmationSetting] = useState(false);
    const [cloneModalVisible, setCloneModalVisible] = useState(false);
    const [cloning, setCloning] = useState(false);
    const [configurationToClone, setConfigurationToClone] = useState<ScheduleSetting | null>(null);
    const [cloneName, setCloneName] = useState('');

    const { Text } = Typography;

    const locale = {
        emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={getTranslation('No Data')} />,
    };

    const generateCloneName = (originalName: string, existingNames: string[]): string => {
        let originalConfigName = `${originalName} - Cópia`;
        let duplicateCounter = 1;
        let currentCloneName = originalConfigName;

        while (existingNames.includes(currentCloneName)) {
            duplicateCounter++;
            currentCloneName = `${originalConfigName} (${duplicateCounter})`;
        }

        return currentCloneName;
    };

    const openCloneModal = (configurationToClone: ScheduleSetting) => {
        setConfigurationToClone(configurationToClone);

        const existingNames = data.map((item) => item.name);
        const uniqueName = generateCloneName(configurationToClone.name, existingNames);

        setCloneName(uniqueName);
        setCloneModalVisible(true);
    };

    const executeClone = async () => {
        if (!configurationToClone || !cloneName.trim()) {
            addNotification({
                type: 'warning',
                title: getTranslation('Attention'),
                message: getTranslation('Please provide a name for the cloned configuration'),
            });
            return;
        }
        setCloning(true);

        try {
            const response = await ConfirmationSettingService.cloneConfirmationSetting(
                selectedWorkspace._id,
                configurationToClone.id,
                cloneName.trim()
            );

            if (response) {
                addNotification({
                    type: 'success',
                    title: getTranslation('Success'),
                    message: getTranslation('Configuration cloned successfully'),
                });
                await getConfirmationSettingList();

                setCloneModalVisible(false);
                setConfigurationToClone(null);
                setCloneName('');
            }
        } catch (error) {
            addNotification({
                type: 'danger',
                title: getTranslation('Error'),
                message: getTranslation('Error cloning configuration'),
            });
        }
        return setCloning(false);
    };

    const handleCancelClone = () => {
        setCloneModalVisible(false);
        setConfigurationToClone(null);
        setCloneName('');
    };

    const columns: ColumnsType<ScheduleSetting> = [
        {
            title: <Wrapper fontWeight='bold'>{getTranslation('Name')}</Wrapper>,
            dataIndex: 'name',
            key: 'name',
            width: 200,
            render: (value) => {
                return value || getTranslation('Setting');
            },
        },
        {
            title: <Wrapper fontWeight='bold'>{getTranslation('Integration')}</Wrapper>,
            dataIndex: 'integrationId',
            key: 'integrationId',
            width: 200,
            render: (value) => {
                return integrations?.find((integration) => integration._id === value)?.name || value;
            },
        },
        {
            title: <Wrapper fontWeight='bold'>{getTranslation('Active')}</Wrapper>,
            dataIndex: 'active',
            key: 'active',
            width: 200,
            render: (value) => {
                return <Tag color={!!value ? 'green' : 'red'}>{getTranslation(!!value ? 'Yes' : 'No')}</Tag>;
            },
        },
        {
            title: <Wrapper fontWeight='bold'>{getTranslation('Clone')}</Wrapper>,
            key: 'clone',
            width: 80,
            align: 'center',
            render: (_, record) => (
                <Tooltip title={getTranslation('Clone configuration')}>
                    <Button
                        icon={<CopyOutlined />}
                        disabled={loading}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openCloneModal(record);
                        }}
                    />
                </Tooltip>
            ),
        },
    ];

    const getConfirmationSettingList = async () => {
        setLoading(true);
        const response = await ConfirmationSettingService.listScheduleSetting(selectedWorkspace._id);
        setData(response || []);
        setTimeout(() => setLoading(false), 300);
    };

    const getIntegrationList = async () => {
        if (!selectedWorkspace._id) {
            return;
        }

        const response = await HealthService.getHealthIntegrations(selectedWorkspace._id);

        setIntegrations(response.data || []);
    };

    useEffect(() => {
        getIntegrationList();
        getConfirmationSettingList();
    }, [selectedWorkspace._id]);

    return (
        <>
            {createConfirmationSetting ? (
                <ConfirmationSettingForm
                    selectedWorkspace={selectedWorkspace}
                    loggedUser={loggedUser}
                    setCreateConfirmationSetting={setCreateConfirmationSetting}
                />
            ) : (
                <>
                    <Header
                        title={getTranslation('List of automatic send configurations')}
                        action={
                            <Button
                                type='primary'
                                className='antd-span-default-color'
                                children={getTranslation('Add')}
                                onClick={() => {
                                    setCreateConfirmationSetting(true);
                                }}
                            />
                        }
                    />
                    <ScrollView padding='16px 24px' minWidth='900px' id='content-confirmation-setting'>
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
                            onRow={(rowData) => {
                                return {
                                    onClick: (e) => {
                                        const target = e.target as Element;
                                        const isButton =
                                            target.closest('.ant-btn') ||
                                            target.closest('.anticon') ||
                                            target.closest('[role="button"]');

                                        if (isButton) {
                                            return;
                                        }
                                        if (e.ctrlKey || e.button === 1) {
                                            window.open(
                                                getBaseUrl({
                                                    appTypePort: APP_TYPE_PORT.APP,
                                                    pathname: `/campaigns/confirmation-settings/${rowData.id}`,
                                                }),
                                                '_blank'
                                            );
                                        } else {
                                            history.push(`/campaigns/confirmation-settings/${rowData.id}`);
                                        }
                                    },
                                    style: { cursor: 'pointer' },
                                };
                            }}
                        />
                    </ScrollView>
                    <Modal
                        title={
                            <span style={{ fontWeight: 'bold' }}>
                                {getTranslation('Clone automatic send configuration')}
                            </span>
                        }
                        open={cloneModalVisible}
                        onCancel={handleCancelClone}
                        width={500}
                        footer={[
                            <Button
                                key='cancel'
                                className='antd-span-default-color'
                                type='primary'
                                ghost
                                onClick={handleCancelClone}
                            >
                                {getTranslation('Cancel')}
                            </Button>,
                            <Button
                                key='clone'
                                className='antd-span-default-color'
                                type='primary'
                                loading={cloning}
                                onClick={executeClone}
                            >
                                {getTranslation('Clone')}
                            </Button>,
                        ]}
                    >
                        <Space direction='vertical' size='middle' style={{ width: '100%' }}>
                            <Space direction='vertical' size='small'>
                                <Text>{getTranslation('You are copying the configuration list:')}</Text>
                                <Text strong>{configurationToClone?.name}</Text>
                            </Space>

                            <Space direction='vertical' size='small' style={{ width: '100%' }}>
                                <Text>{getTranslation('Name of the new configuration clone:')}</Text>
                                <Input
                                    value={cloneName}
                                    onChange={(e) => setCloneName(e.target.value)}
                                    placeholder={getTranslation('Enter a name for the new configuration')}
                                    maxLength={200}
                                />
                                <Alert
                                    message={getTranslation(
                                        'The cloned configuration will be created inactivated. Review and adjust the settings, then activate it to start using!'
                                    )}
                                    type='warning'
                                    showIcon
                                    style={{ marginTop: '12px' }}
                                />
                            </Space>
                        </Space>
                    </Modal>
                </>
            )}
        </>
    );
};

export default i18n(ConfirmationSettingList) as FC<ConfirmationSettingListProps>;
