import { MenuOutlined } from '@ant-design/icons';
import { Badge, Button, Col, Dropdown, MenuProps, message, Row, Space, Tooltip, Typography } from 'antd';
import { ChannelIdConfig, ConversationStatus } from 'kissbot-core';
import moment from 'moment';
import React, { FC, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Copy from '../../../../shared/Copy';
import { Icon, UserAvatar, Wrapper } from '../../../../ui-kissbot-v2/common';
import { ColorType, getColor } from '../../../../ui-kissbot-v2/theme';
import { sleep } from '../../../../utils/Timer';
import { isAnySystemAdmin, isWorkspaceAdmin } from '../../../../utils/UserPermission';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { useContactContext } from '../../context/contact.context';
import { useRemiOptimistic } from '../../context/RemiOptimisticContext';
import { useDeactivateReengagement } from '../../hooks/use-deactivate-reengagement';
import { useWindowSize } from '../../hooks/use-window-size';
import { Identity } from '../../interfaces/conversation.interface';
import { LiveAgentService } from '../../service/LiveAgent.service';
import ConfirmPopover from '../ConfirmPopover';
import { ConversationRemiSelector } from '../ConversationRemiSelector';
import ShareConversation from '../ShareConversation';
import TransferConversation from '../TransferConversation';
import TransferConversationToAgent from '../TransferConversationToAgent';
import { CloseButton } from './closeButton';
import NewAttendanceButton from './newAttendanceButton';
import { ActionableElement, ChatContainerHeaderProps } from './props';
import { Header } from './styled';
import SuspendButton from './suspendButton';
const ExportConversationButton = React.lazy(() => import('../ExportConversationButton'));

const channelsToRestartConversation = [
    ChannelIdConfig.whatsapp,
    ChannelIdConfig.gupshup,
    ChannelIdConfig.liveagent,
    ChannelIdConfig.campaign,
    ChannelIdConfig.confirmation,
    ChannelIdConfig.reminder,
    ChannelIdConfig.nps,
    ChannelIdConfig.nps_score,
    ChannelIdConfig.recover_lost_schedule,
    ChannelIdConfig.schedule_notification,
    ChannelIdConfig.documents_request,
    ChannelIdConfig.active_mkt,
    ChannelIdConfig.medical_report,
    ChannelIdConfig.ads,
    ChannelIdConfig.kissbot,
    ChannelIdConfig.api,
];
export const breakpoint = 1460;
const ChatContainerHeaderComponent: FC<ChatContainerHeaderProps & I18nProps> = ({
    readingMode,
    conversation,
    getTranslation,
    workspaceId,
    loggedUser,
    notification,
    teams,
    disabled,
    groupedMessages,
    onUpdatedConversationSelected,
    channels,
}) => {
    const { contactSelected } = useContactContext();
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const { deactivateReengagement } = useDeactivateReengagement();
    const [isOpenedModal, setIsOpenedModal] = useState<boolean>(false);
    const isAdmin = isWorkspaceAdmin(loggedUser, workspaceId!) || isAnySystemAdmin(loggedUser);
    const { getOptimisticState, allRemiRules } = useRemiOptimistic();
    const { isWithSmtRe: finalisWithSmtRe } = getOptimisticState(conversation._id, conversation);

    const windowSize = useWindowSize();

    const isSmallScreen = windowSize.width < breakpoint;

    const enabledRemiWorkspace =
        selectedWorkspace?.userFeatureFlag?.enableRemi && selectedWorkspace?.featureFlag?.enableRemi;

    const canApplySmartRemi: boolean = useMemo<boolean>(() => {
        const now = moment().valueOf();

        const isWhatsappActive = Boolean(conversation.whatsappExpiration) && now < conversation.whatsappExpiration;

        const isValidChannel = ![
            ChannelIdConfig.webemulator,
            ChannelIdConfig.webchat,
            ChannelIdConfig.telegram,
        ].includes(conversation.createdByChannel);

        const isConversationOpen = conversation.state === ConversationStatus.open;

        const isUserMemberActive = conversation.members.some(
            (member: Identity) => member.id === loggedUser?._id && !member.disabled
        );

        const hasCompatibleRemiRule = () => {
            if (!allRemiRules || !conversation?.assignedToTeamId) return false;

            return allRemiRules.some((rule) => {
                const teamIds = rule.teamIds || [];
                return teamIds.length === 0 || teamIds.includes(conversation.assignedToTeamId);
            });
        };

        const finalResult =
            isWhatsappActive && isValidChannel && isConversationOpen && isUserMemberActive && hasCompatibleRemiRule();

        return finalResult;
    }, [
        conversation.whatsappExpiration,
        conversation.createdByChannel,
        conversation.state,
        conversation.members,
        conversation.assignedToTeamId,
        loggedUser?._id,
        allRemiRules,
    ]);

    const enabledRemi = isAdmin || (enabledRemiWorkspace && canApplySmartRemi);

    const onCloseConversation = async (message: string) => {
        if (!workspaceId || !loggedUser || !conversation || disabled) return;

        const body = {} as { message?: string };

        if (message && message !== '') {
            body.message = message.trim();
        }

        LiveAgentService.changeStateConversation(workspaceId, loggedUser._id as string, conversation._id, body);
        await sleep(100);
        onUpdatedConversationSelected({ _id: conversation._id, state: 'closed' });
    };

    const onSuspendConversation = async (until: number) => {
        if (!workspaceId || !loggedUser || !conversation || disabled) return;

        const result = await LiveAgentService.suspendConversation(
            workspaceId,
            loggedUser._id as string,
            conversation._id,
            until
        );
        if (conversation?.smtReId) {
            await deactivateReengagement(conversation._id, conversation.smtReId);
        }

        return result;
    };

    const handleLeaveConversation = async () => {
        if (!workspaceId || !loggedUser || !conversation || disabled) {
            return;
        }
        if (conversation?.smtReId) {
            await deactivateReengagement(conversation._id, conversation.smtReId);
        }
        try {
            const result = await LiveAgentService.leaveConversation(
                workspaceId,
                conversation._id,
                loggedUser._id as string
            );

            if (result && result.status === 404) {
                return notification({
                    title: getTranslation('Error'),
                    message: getTranslation('You cannot leave this conversation'),
                    type: 'danger',
                    duration: 3000,
                });
            }
        } catch (error) {
            return notification({
                title: getTranslation('Error'),
                message: getTranslation('An error has occurred. Try again'),
                type: 'danger',
                duration: 3000,
            });
        }
    };

    const getColorByStatus: any = () => {
        if (!conversation) return;
        switch (conversation.state) {
            case ConversationStatus.open:
                return '#65cc3b';
            case ConversationStatus.closed:
                return '#f12727';
            default:
                return getColor(ColorType.primary);
        }
    };

    const handleCopyClick = () => {
        const text = conversation._id;
        navigator.clipboard
            .writeText(text)
            .then(() => {
                message.success('ID da conversa copiado com sucesso!');
            })
            .catch(() => {
                message.error('Falha ao copiar o ID da conversa');
            });
    };

    const canTransferConversationToAgent = (): boolean => {
        // const isSupervisor = !!teams?.find(team => team._id === conversation?.assignedToTeamId)?.roleUsers?.find(roleUser => roleUser.userId === loggedUser._id && roleUser.isSupervisor);
        if (
            !!readingMode ||
            conversation.state !== ConversationStatus.open ||
            !isAdmin ||
            finalisWithSmtRe
            // && !isSupervisor
        ) {
            return false;
        }
        return true;
    };
    const [modalOpened, setModalOpened] = useState(false);
    const isSuspended = conversation.suspendedUntil && conversation.suspendedUntil > moment().valueOf();

    const actionableElements: ActionableElement[] = [
        canTransferConversationToAgent() && {
            key: 'transfer-agent',
            element: (
                <TransferConversationToAgent
                    setModalOpened={setModalOpened}
                    modalOpened={modalOpened}
                    conversation={conversation}
                    teams={teams}
                />
            ),
        },
        isAnySystemAdmin(loggedUser) && {
            key: 'copy',
            element: (
                <>
                    <Copy
                        id='copy'
                        title={getTranslation('Copiar ID da conversa')}
                        duration={1000}
                        placement='bottomRight'
                        onClick={handleCopyClick}
                        style={{ cursor: 'pointer', fontSize: '20px' }}
                    />
                    {isSmallScreen && (
                        <span onClick={handleCopyClick} style={{ marginLeft: 8 }}>
                            {getTranslation('Copiar ID da conversa')}
                        </span>
                    )}
                </>
            ),
        },
        {
            key: 'export',
            element: (
                <React.Suspense
                    fallback={<Icon title={getTranslation('Download conversation')} name='file-download' size='20px' />}
                >
                    <ExportConversationButton conversation={conversation} groupedMessages={groupedMessages} />
                </React.Suspense>
            ),
        },
        !readingMode &&
            conversation.assignedToTeamId &&
            conversation.assumed &&
            !finalisWithSmtRe &&
            conversation.state === ConversationStatus.open && {
                key: 'transfer-team',
                element: (
                    <TransferConversation
                        conversation={conversation}
                        teams={teams}
                        loggedUser={loggedUser}
                        workspaceId={workspaceId as string}
                        notification={notification}
                    />
                ),
            },
        {
            key: 'share',
            element: <ShareConversation conversation={conversation} workspaceId={workspaceId} />,
        },
        !isSmallScreen &&
            enabledRemi && {
                key: 'remi-selector',
                element: (
                    <ConversationRemiSelector
                        conversation={conversation}
                        workspaceId={workspaceId}
                        onUpdate={onUpdatedConversationSelected}
                    />
                ),
            },
    ].filter(Boolean);

    const menuItems: MenuProps['items'] = actionableElements.map(({ key, element }) => ({
        key,
        label: <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>{element}</div>,
    }));

    return (
        <Header className={disabled ? 'disabled' : ''}>
            <Row align={'middle'} justify={'space-between'} style={{ width: '100%', minWidth: 680 }}>
                <Col flex='1 1 0'>
                    <Row>
                        <Space>
                            <Col>
                                <Space>
                                    <UserAvatar
                                        size={32}
                                        user={conversation.user}
                                        hashColor={`${conversation.user.id}${conversation._id}`}
                                    />
                                    <div>
                                        <Row align='middle' wrap={false}>
                                            <Col>
                                                <Space className='antd-span-default-color'>
                                                    <Typography.Text style={{ maxWidth: 160, fontSize: 17 }} ellipsis>
                                                        {conversation.user.name}
                                                    </Typography.Text>
                                                    <Typography.Text
                                                        ellipsis
                                                        style={{ fontSize: 16 }}
                                                    >{`#${conversation.iid}`}</Typography.Text>
                                                </Space>
                                            </Col>
                                            {isSuspended ? (
                                                <Col>
                                                    <Badge
                                                        count={getTranslation('suspended')}
                                                        style={{ backgroundColor: '#faad14', marginLeft: 6 }}
                                                        title={getTranslation('Service suspended')}
                                                    />
                                                </Col>
                                            ) : (
                                                ''
                                            )}
                                        </Row>
                                        <Space size='small'>
                                            <Col style={{ marginLeft: 16 }}>
                                                {moment(conversation?.createdAt).format('DD/MM/YYYY - HH:mm')}
                                            </Col>
                                            <Col>
                                                <Badge
                                                    count={getTranslation(conversation.state)}
                                                    style={{ backgroundColor: getColorByStatus(), marginLeft: 8 }}
                                                />
                                            </Col>
                                        </Space>
                                    </div>
                                </Space>
                            </Col>
                            <Col>
                                {readingMode && (
                                    <Wrapper flexBox alignItems='center' margin='0 10px'>
                                        <Wrapper
                                            cursor='pointer'
                                            title={getTranslation('Go to conversation')}
                                            margin='0 0 0 15px'
                                        >
                                            <Link
                                                to={`/live-agent?workspace=${workspaceId}&conversation=${conversation._id}`}
                                                target='_blank'
                                            >
                                                <Button
                                                    className='antd-span-default-color'
                                                    ghost
                                                    style={{
                                                        color: '#555555',
                                                        borderColor: '#555555',
                                                    }}
                                                >
                                                    {getTranslation('Go to conversation')}
                                                </Button>
                                            </Link>
                                        </Wrapper>
                                    </Wrapper>
                                )}
                                {!readingMode &&
                                    !!conversation.assumed &&
                                    conversation.state === ConversationStatus.open && (
                                        <Space>
                                            <ConfirmPopover
                                                disabled={finalisWithSmtRe}
                                                onConfirm={handleLeaveConversation}
                                                confirmColorType={ColorType.danger}
                                                text={getTranslation('Confirm attendance exit?')}
                                            >
                                                <Tooltip
                                                    title={
                                                        finalisWithSmtRe
                                                            ? 'Desativado enquanto o REMI estiver controlando o atendimento.'
                                                            : undefined
                                                    }
                                                >
                                                    <Button
                                                        disabled={finalisWithSmtRe}
                                                        className='antd-span-default-color'
                                                        ghost
                                                        style={{
                                                            color: '#555555',
                                                            borderColor: '#555555',
                                                        }}
                                                    >
                                                        {getTranslation('Leave')}
                                                    </Button>
                                                </Tooltip>
                                            </ConfirmPopover>
                                            <Tooltip
                                                title={
                                                    finalisWithSmtRe
                                                        ? 'Desativado enquanto o REMI estiver controlando o atendimento.'
                                                        : undefined
                                                }
                                            >
                                                <Button
                                                    disabled={finalisWithSmtRe}
                                                    className='antd-span-default-color'
                                                    ghost
                                                    style={{
                                                        color: '#faad14',
                                                        borderColor: '#faad14',
                                                    }}
                                                    onClick={() => setIsOpenedModal(true)}
                                                >
                                                    {getTranslation('Suspend')}
                                                </Button>
                                            </Tooltip>
                                            <SuspendButton
                                                setIsOpenedModal={setIsOpenedModal}
                                                isOpenedModal={isOpenedModal}
                                                addNotification={notification}
                                                conversation={conversation}
                                                loggedUser={loggedUser}
                                                onSuspendConversation={onSuspendConversation}
                                                workspaceId={workspaceId as string}
                                            />

                                            <CloseButton
                                                addNotification={notification}
                                                conversation={conversation}
                                                channels={channels}
                                                loggedUser={loggedUser}
                                                onCloseConversation={onCloseConversation}
                                                workspaceId={workspaceId as string}
                                                onUpdatedConversationSelected={onUpdatedConversationSelected}
                                                teams={teams}
                                            />
                                        </Space>
                                    )}
                                {!readingMode &&
                                    conversation.state === ConversationStatus.closed &&
                                    !contactSelected?.blockedAt &&
                                    channelsToRestartConversation.includes(conversation.createdByChannel) && (
                                        <Wrapper flexBox margin='0 10px 0 15px' alignItems='center'>
                                            <NewAttendanceButton
                                                workspaceId={workspaceId as string}
                                                contactId={contactSelected?._id}
                                                contactPhone={contactSelected?.phone}
                                                notification={notification}
                                            />
                                        </Wrapper>
                                    )}
                            </Col>
                        </Space>
                    </Row>
                </Col>

                <Col style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    {isSmallScreen ? (
                        <Space size='middle'>
                            {enabledRemi && (
                                <ConversationRemiSelector
                                    key='remi-selector'
                                    conversation={conversation}
                                    workspaceId={workspaceId}
                                    onUpdate={onUpdatedConversationSelected}
                                />
                            )}
                            <Dropdown menu={{ items: menuItems }} trigger={['hover']} placement='bottomRight'>
                                <Button type='text' icon={<MenuOutlined style={{ fontSize: '20px' }} />} />
                            </Dropdown>
                        </Space>
                    ) : (
                        <Space size='middle'>
                            {actionableElements.map(({ key, element }) => (
                                <span key={key}>{element}</span>
                            ))}
                        </Space>
                    )}
                </Col>
            </Row>
        </Header>
    );
};

export const ChatContainerHeader = i18n(ChatContainerHeaderComponent) as FC<ChatContainerHeaderProps>;
