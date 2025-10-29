import { FC, useEffect, useState } from 'react';
import { Wrapper } from '../../../../../../../../ui-kissbot-v2/common';
import { I18nProps } from '../../../../../../../i18n/interface/i18n.interface';
import i18n from '../../../../../../../i18n/components/i18n';
import { ChannelData, TemplatePermissionsProps } from './props';
import { TeamService } from '../../../../../../../teams/services/TeamService';
import { LabelWrapper } from '../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { Team } from '../../../../../../../../model/Team';
import { ChannelConfigService } from '../../../../../../../newChannelConfig/service/ChannelConfigService';
import { ChannelConfig } from '../../../../../../../../model/Bot';
import { Button, Popover, Select, Switch, Table, Tag, Tooltip } from 'antd';
import { ChannelIdConfig } from 'kissbot-core';
import {
    TemplateButtonType,
    TemplateCategory,
    TemplateStatus,
} from '../../../../../../../liveAgent/components/TemplateMessageList/interface';
import styled from 'styled-components';
import { MdBookmarkRemove, MdDelete, MdOutlineSyncProblem } from 'react-icons/md';
import { IoLogoWhatsapp } from 'react-icons/io';
import { SettingsService } from '../../../../../../service/SettingsService';
import { addNotification } from '../../../../../../../../utils/AddNotification';
import { useSelector } from 'react-redux';
import { isAnySystemAdmin, isSystemAdmin, isSystemDevAdmin } from '../../../../../../../../utils/UserPermission';
import { FaSyncAlt } from 'react-icons/fa';

const TitleTable = styled('b')`
    color: #696969;
`;

const DeleteTemplateChannel = styled(MdDelete)`
    font-size: 18px;
    color: #696969;
    cursor: pointer;
    margin: 0 5px;

    &:hover {
        color: #ff6262;
    }
`;

const SubmitTemplateChannel = styled(IoLogoWhatsapp)`
    font-size: 18px;
    color: #696969;
    cursor: pointer;
    margin: 0 5px;

    &:hover {
        color: #34af23;
    }
`;

const SincTemplateChannel = styled(MdOutlineSyncProblem)`
    font-size: 20px;
    color: #696969;
    cursor: pointer;
    margin: 0 5px;

    &:hover {
        color: #3768ff;
    }
`;

const SyncGupshupTemplate = styled(FaSyncAlt)`
    font-size: 16px;
    color: #696969;
    cursor: pointer;
    margin: 0 15px;

    &:hover {
        color: #3768ff;
    }
`;

const ChangeStatusToRejected = styled(MdBookmarkRemove)`
    font-size: 20px;
    color: #696969;
    cursor: pointer;

    &:hover {
        color: #ff3737;
    }
`;

const TemplatePermissions: FC<TemplatePermissionsProps & I18nProps> = ({
    getTranslation,
    template,
    workspaceId,
    setFieldValue,
    errors,
    touched,
    values,
    submitted,
    loadingRequest,
    setLoadingRequest,
    user,
}) => {
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const isAdmin = isSystemAdmin(user);
    const isAnyAdmin = isAnySystemAdmin(user);
    const iDevAdmin = isSystemDevAdmin(user);

    const [showTeams, setShowTeams] = useState<boolean>(!!template.teams?.length);
    const [showChannels, setShowChannels] = useState<boolean>(!!template?.channels?.length);
    const [workspaceChannelConfigs, setWorkspaceChannelConfigs] = useState<ChannelConfig[]>([]);
    const [workspaceTeams, setWorkspaceTeams] = useState<Team[]>([]);
    const [dataSource, setDataSource] = useState<any[]>([]);
    const [category, setCategory] = useState<TemplateCategory>(TemplateCategory.UTILITY);
    const [openChannelIds, setOpenChannelIds] = useState(new Set());

    const handlePopoverOpen = (channelConfigId) => {
        setOpenChannelIds((prevSet) => new Set(prevSet).add(channelConfigId));
    };

    const handlePopoverClose = (channelConfigId) => {
        setOpenChannelIds((prevSet) => {
            const newSet = new Set(prevSet);
            newSet.delete(channelConfigId);
            return newSet;
        });
    };

    useEffect(() => {
        if (template) {
            if (template.teams?.length) {
                getWorkspaceTeams();
                setShowTeams(true);
            }
            if (template.channels?.length) {
                setShowChannels(true);
            }
        }
    }, [template]);

    const getWorkspaceTeams = async () => {
        if (workspaceTeams.length) {
            return;
        }
        const response = await TeamService.getTeams(workspaceId);
        if (response?.data?.length) {
            setWorkspaceTeams(response.data);
        }
    };

    const getWorkspaceChannels = async () => {
        const filter = {
            workspaceId,
            enable: true,
        };
        const data = await ChannelConfigService.getChannelsConfig(filter);

        setWorkspaceChannelConfigs(data || []);
    };

    useEffect(() => {
        getWorkspaceTeams();
        getWorkspaceChannels();
    }, []);

    useEffect(() => {
        getData();
    }, [workspaceChannelConfigs, values._id]);

    const deleteChannelTemplate = async (channelConfigId: string) => {
        if (!values._id || !values.workspaceId) {
            return;
        }
        setLoadingRequest(true);

        let error;
        const response = await SettingsService.deleteChannelTemplate(
            values.workspaceId,
            values._id,
            channelConfigId,
            (err) => (error = err)
        );

        setLoadingRequest(false);
        if (response?.ok) {
            const newWabaResult = values.wabaResult;
            const newChannels = values?.channels?.filter((currChannel) => currChannel !== channelConfigId);
            if (newWabaResult?.[channelConfigId]) {
                delete newWabaResult[channelConfigId];
            }
            setFieldValue('wabaResult', newWabaResult);
            values.wabaResult = newWabaResult;
            setFieldValue('channels', newChannels);
            values.channels = newChannels;

            getData();
            addNotification({
                type: 'success',
                message: getTranslation('Success'),
                title: getTranslation('Success'),
            });
        } else {
            if (error?.error === 'TEMPLATE_CHANNEL_APPNAME_NOT_FOUND') {
                addNotification({
                    type: 'warning',
                    message: getTranslation('Channel not found, contact your supervisor'),
                    title: getTranslation('Error'),
                });
                return;
            }
            addNotification({
                type: 'warning',
                message: getTranslation('Error. Try again in a few minutes'),
                title: getTranslation('Error'),
            });
        }
    };

    const updateChannelTemplate = async (channelConfigId: string, category: TemplateCategory) => {
        if (!values._id || !values.workspaceId) {
            return;
        }
        setLoadingRequest(true);

        const response = await SettingsService.updateChannelTemplate(
            values.workspaceId,
            values._id,
            channelConfigId,
            category
        );

        setLoadingRequest(false);
        if (response) {
            setFieldValue('wabaResult', response.wabaResult);
            values.wabaResult = response.wabaResult;
            setFieldValue('channels', response.channels);
            values.channels = response.channels;

            getData();
            addNotification({
                type: 'success',
                message: getTranslation('Success'),
                title: getTranslation('Success'),
            });
        } else {
            addNotification({
                type: 'warning',
                message: getTranslation('Error'),
                title: getTranslation('Error'),
            });
        }
    };

    const changeStatusToRejected = async (channelConfigId?: string) => {
        if (!values._id || !values.workspaceId) {
            return;
        }
        setLoadingRequest(true);

        const response = await SettingsService.changeStatus(values.workspaceId, values._id, channelConfigId);

        setLoadingRequest(false);
        if (response) {
            setFieldValue('wabaResult', response.wabaResult);
            values.wabaResult = response.wabaResult;
            setFieldValue('active', response.active);
            values.active = response.active;
            setFieldValue('channels', response.channels);
            values.channels = response.channels;

            getData();
            addNotification({
                type: 'success',
                message: getTranslation('Success'),
                title: getTranslation('Success'),
            });
        } else {
            addNotification({
                type: 'warning',
                message: getTranslation('Error'),
                title: getTranslation('Error'),
            });
        }
    };

    const syncStatusWabaResult = async (channelConfigId?: string) => {
        if (!values._id || !values.workspaceId) {
            return;
        }
        setLoadingRequest(true);

        const response = await SettingsService.syncStatus(values.workspaceId, values._id, channelConfigId);

        setLoadingRequest(false);
        if (response) {
            setFieldValue('wabaResult', response.wabaResult);
            values.wabaResult = response.wabaResult;
            setFieldValue('channels', response.channels);
            values.channels = response.channels;

            getData();
            addNotification({
                type: 'success',
                message: getTranslation('Success'),
                title: getTranslation('Success'),
            });
        } else {
            addNotification({
                type: 'warning',
                message: getTranslation('Error'),
                title: getTranslation('Error'),
            });
        }
    };

    const getData = () => {
        const allActiveChannels = workspaceChannelConfigs.filter(
            (channelConfig) =>
                channelConfig._id &&
                channelConfig.channelId === ChannelIdConfig.gupshup &&
                channelConfig.enable === true
        );

        if (!allActiveChannels.length) {
            setDataSource([]);
            return;
        }

        const notFeatureFlagTemplate = !selectedWorkspace?.featureFlag?.createTemplateWhatsappOfficial && !isAdmin;

        const data = allActiveChannels.map((channelConfig) => {
            const channelId = channelConfig._id!;
            const isChannelInTemplate = values.channels?.includes(channelId) || false;
            const channelWabaResult = values?.wabaResult?.[channelId];
            const isWabaResultTemplate = channelWabaResult && channelWabaResult.channelConfigId === channelId;

            let statusTemplateChannelActive = 'NOT_SUBMITTED';
            let categoryValue = '';

            if (isWabaResultTemplate) {
                statusTemplateChannelActive = channelWabaResult.status?.toLowerCase() || 'NOT_SUBMITTED';
                categoryValue = channelWabaResult.category || '';
            }

            const wabaResultChannel = {
                channelName: channelConfig.name,
                status: statusTemplateChannelActive,
                category: categoryValue,
                actions: {
                    wabaResult: {
                        channelConfigId: channelId,
                        status: statusTemplateChannelActive,
                        elementName: values._id,
                        rejectedReason: isWabaResultTemplate ? channelWabaResult.rejectedReason : undefined,
                        category: categoryValue,
                        isChannelInTemplate: isChannelInTemplate,
                    },
                    qtdChannels: allActiveChannels.length,
                },
            };

            if (isWabaResultTemplate) {
                wabaResultChannel.actions.wabaResult = {
                    ...channelWabaResult,
                    category: channelWabaResult.category || '',
                    rejectedReason:
                        channelWabaResult.rejectedReason !== undefined ? channelWabaResult.rejectedReason : undefined,
                    isChannelInTemplate: isChannelInTemplate,
                };
                wabaResultChannel.category = channelWabaResult?.category || '';
            }

            if (notFeatureFlagTemplate) {
                if (wabaResultChannel.actions.wabaResult.category) {
                    wabaResultChannel.actions.wabaResult.category = getTranslation(
                        wabaResultChannel.actions.wabaResult.category
                    );
                }

                if (wabaResultChannel.category) {
                    wabaResultChannel.category = getTranslation(wabaResultChannel.category);
                }

                if (!isChannelInTemplate && isWabaResultTemplate) {
                    wabaResultChannel.status = statusTemplateChannelActive;
                    wabaResultChannel.category = getTranslation(channelWabaResult.category || '');
                }
            }

            return wabaResultChannel;
        });

        setDataSource(data);
    };

    const getColumns = () => {
        let columns = [
            {
                title: <TitleTable>{getTranslation('Channel')}</TitleTable>,
                dataIndex: 'channelName',
                key: 'channelName',
                width: isAdmin ? '30%' : '50%',
            },
            {
                title: (
                    <div>
                        <TitleTable>{getTranslation('template status')}</TitleTable>
                        {isAdmin || iDevAdmin ? (
                            <span>
                                <SyncGupshupTemplate
                                    title={'Sincronizar status do template com Whatsapp'}
                                    onClick={() => syncStatusWabaResult()}
                                />
                                <ChangeStatusToRejected
                                    title={'Marcar status para Reprovado'}
                                    onClick={() => changeStatusToRejected()}
                                />
                            </span>
                        ) : null}
                    </div>
                ),
                dataIndex: 'status',
                key: 'status',
                width: '40%',
                render: (value, data) => {
                    let rejectedReason = data.actions.wabaResult?.rejectedReason;
                    const statusMapping = {
                        [TemplateStatus.APPROVED]: { color: 'success', label: 'Approved' },
                        [TemplateStatus.AWAITING_APPROVAL]: { color: 'warning', label: 'Pending' },
                        [TemplateStatus.PENDING]: { color: 'warning', label: 'Pending' },
                        [TemplateStatus.DISABLED]: { color: 'default', label: 'Disabled' },
                        [TemplateStatus.DELETED]: { color: 'error', label: 'Deleted' },
                        [TemplateStatus.REJECTED]: { color: 'error', label: 'Rejected' },
                        [TemplateStatus.ERROR_ONSUBMIT]: { color: 'error', label: 'Error' },
                        NOT_SUBMITTED: { color: 'default', label: 'Not submitted for approval' },
                        DISAPPROVED: { color: 'error', label: 'Disapproved' },
                    };

                    const status = statusMapping[value] || statusMapping.DISAPPROVED;

                    const label = getTranslation(status.label);

                    return isAnyAdmin && rejectedReason ? (
                        <Tooltip placement='top' title={rejectedReason}>
                            <Tag color={status.color} key={value}>
                                {label}
                            </Tag>
                        </Tooltip>
                    ) : (
                        <Tag color={status.color} key={value}>
                            {label}
                        </Tag>
                    );
                },
            },
        ];

        if (isAnyAdmin) {
            columns.push({
                title: <TitleTable>{getTranslation('Category')}</TitleTable>,
                dataIndex: 'category',
                key: 'category',
                width: '20%',
            });
        }

        if (isAnyAdmin) {
            columns.push({
                title: <TitleTable>{getTranslation('Actions')}</TitleTable>,
                dataIndex: 'actions',
                key: 'actions',
                width: '10%',
                render: (value: ChannelData) => {
                    const channelDelete = {
                        [TemplateStatus.APPROVED]: true,
                        [TemplateStatus.DISABLED]: true,
                        [TemplateStatus.REJECTED]: true,
                        [TemplateStatus.ERROR_ONSUBMIT]: true,
                    };
                    const channelCategory = value.wabaResult?.category || '';

                    const canDeleteChannel = channelDelete[value.wabaResult.status?.toLowerCase()];
                    const canSubmitChannel = value.wabaResult.status === 'NOT_SUBMITTED';
                    const canTryAgain = value.wabaResult.status === TemplateStatus.ERROR_ONSUBMIT;

                    return (
                        <div>
                            {canDeleteChannel && (
                                <DeleteTemplateChannel
                                    onClick={() => {
                                        if (loadingRequest) {
                                            return;
                                        }
                                        deleteChannelTemplate(value.wabaResult.channelConfigId);
                                    }}
                                    title={getTranslation('Delete template from this channel')}
                                />
                            )}
                            {canSubmitChannel && (
                                <Popover
                                    key={value.wabaResult.channelConfigId}
                                    title={getTranslation('Selecione uma categoria')}
                                    trigger={'click'}
                                    placement='top'
                                    open={openChannelIds.has(value.wabaResult.channelConfigId)}
                                    onOpenChange={(visible) => {
                                        if (visible) {
                                            handlePopoverOpen(value.wabaResult.channelConfigId);
                                        } else {
                                            handlePopoverClose(value.wabaResult.channelConfigId);
                                        }
                                    }}
                                    content={
                                        <div
                                            style={{ width: '300px' }}
                                            onBlur={(event) => event.stopPropagation()}
                                            onChange={(event) => event.stopPropagation()}
                                        >
                                            <LabelWrapper label={getTranslation('Category')}>
                                                <Select
                                                    style={{ width: '100%' }}
                                                    value={channelCategory || category}
                                                    options={[
                                                        {
                                                            label: TemplateCategory.UTILITY,
                                                            value: TemplateCategory.UTILITY,
                                                        },
                                                        {
                                                            label: TemplateCategory.MARKETING,
                                                            value: TemplateCategory.MARKETING,
                                                        },
                                                        {
                                                            label: TemplateCategory.AUTHENTICATION,
                                                            value: TemplateCategory.AUTHENTICATION,
                                                        },
                                                    ]}
                                                    onChange={(value) => {
                                                        setCategory(value);
                                                    }}
                                                />
                                            </LabelWrapper>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'flex-end',
                                                    marginTop: '8px',
                                                }}
                                            >
                                                <Button
                                                    size='small'
                                                    className='antd-span-default-color'
                                                    onClick={() => {
                                                        if (loadingRequest) {
                                                            return;
                                                        }
                                                        updateChannelTemplate(
                                                            value.wabaResult.channelConfigId,
                                                            category
                                                        );
                                                        handlePopoverClose(value.wabaResult.channelConfigId);
                                                    }}
                                                    type='primary'
                                                >
                                                    OK
                                                </Button>
                                            </div>
                                        </div>
                                    }
                                >
                                    <SubmitTemplateChannel
                                        onClick={() => handlePopoverOpen(value.wabaResult.channelConfigId)}
                                        title={getTranslation('Submit template for Whatsapp approval')}
                                    />
                                </Popover>
                            )}
                            {canTryAgain && (
                                <SincTemplateChannel
                                    onClick={() => {
                                        if (loadingRequest) {
                                            return;
                                        }
                                        updateChannelTemplate(
                                            value.wabaResult.channelConfigId,
                                            TemplateCategory.UTILITY
                                        );
                                    }}
                                    title={getTranslation('Try to resubmit the template')}
                                />
                            )}
                        </div>
                    );
                },
            });
        }

        return columns;
    };

    useEffect(() => {
        if (values._id && values.channels?.length && workspaceChannelConfigs.length) {
            const allActiveChannels = values.channels.filter((channelId) => {
                return workspaceChannelConfigs.some((config) => config._id === channelId && config.enable === true);
            });

            if (allActiveChannels.length !== values.channels.length) {
                setFieldValue('channels', allActiveChannels);
                values.channels = allActiveChannels;
            }
        }
    }, [workspaceChannelConfigs, values._id]);

    const optionsChannels = () => {
        if (values.isHsm) {
            return workspaceChannelConfigs
                ?.filter((curr) => curr.channelId === ChannelIdConfig.gupshup && curr.enable === true)
                ?.map((channelConfig) => ({
                    label: channelConfig.name,
                    value: channelConfig._id,
                }));
        }
        return workspaceChannelConfigs
            ?.filter((curr) => curr.enable === true)
            ?.map((channelConfig) => ({
                label: channelConfig.name,
                value: channelConfig._id,
            }));
    };

    return (
        <>
            <Wrapper margin='10px 0 15px 0'>{getTranslation('Permissions')}</Wrapper>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <Switch
                    checked={!showTeams}
                    onChange={() => {
                        setShowTeams(!showTeams);
                        getWorkspaceTeams();

                        if (!showTeams) {
                            setFieldValue('teams', []);
                            values.teams = [];
                        }
                    }}
                    style={{ margin: '0 10px 10px 0' }}
                />
                {getTranslation('All teams can use this template')}
            </div>

            {showTeams && (
                <Wrapper margin='0 0 10px 0'>
                    <LabelWrapper
                        validate={{
                            touched,
                            errors,
                            isSubmitted: submitted,
                            fieldName: `teams`,
                        }}
                        label={`${getTranslation('Teams')}:`}
                    >
                        <Select
                            mode='multiple'
                            style={{ width: '100%' }}
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            size='large'
                            allowClear
                            placeholder={getTranslation('Select the teams that can use the template')}
                            options={workspaceTeams?.map((team) => ({ label: team.name, value: team._id }))}
                            value={values.teams}
                            onChange={(value) => {
                                setFieldValue('teams', value);
                                values.teams = value;
                            }}
                        />
                    </LabelWrapper>
                </Wrapper>
            )}

            {((!values._id && values.isHsm) || !values.isHsm) && workspaceChannelConfigs.length > 1 && (
                <>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Switch
                            checked={!showChannels}
                            disabled={
                                (!!template._id && template.isHsm) ||
                                template?.buttons?.[0]?.type === TemplateButtonType.FLOW
                            }
                            onChange={() => {
                                setShowChannels(!showChannels);

                                if (!showChannels) {
                                    setFieldValue('channels', []);
                                    values.channels = [];
                                }
                            }}
                            style={{ margin: '0 10px 10px 0' }}
                        />
                        {getTranslation('All channels can use this template')}
                    </div>

                    {showChannels && (!values.isHsm ? true : !values?._id) && (
                        <Wrapper margin='0 0 10px 0'>
                            <LabelWrapper
                                validate={{
                                    touched,
                                    errors,
                                    isSubmitted: submitted,
                                    fieldName: `channels`,
                                }}
                                label={`${getTranslation('Channels')}:`}
                            >
                                <Select
                                    mode='multiple'
                                    style={{ width: '100%' }}
                                    filterOption={(input, option) =>
                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                    size='large'
                                    disabled={
                                        (!!template._id && template.isHsm) ||
                                        template?.buttons?.[0]?.type === TemplateButtonType.FLOW
                                    }
                                    allowClear
                                    placeholder={getTranslation('Select the channels that can use the template')}
                                    options={optionsChannels()}
                                    value={values.channels}
                                    onChange={(value) => {
                                        setFieldValue('channels', value);
                                        values.channels = value;
                                    }}
                                />
                            </LabelWrapper>
                        </Wrapper>
                    )}
                </>
            )}
            {!!values._id && !!values.isHsm ? (
                <>
                    <Table
                        style={{ marginTop: '10px' }}
                        size='small'
                        bordered
                        columns={getColumns()}
                        dataSource={dataSource}
                        pagination={false}
                    />
                </>
            ) : null}
        </>
    );
};

export default i18n(TemplatePermissions) as FC<TemplatePermissionsProps>;
