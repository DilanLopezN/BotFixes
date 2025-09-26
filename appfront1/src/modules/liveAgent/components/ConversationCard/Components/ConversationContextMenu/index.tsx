import { Dropdown, MenuProps } from 'antd';
import { ConversationStatus } from 'kissbot-core';
import { FC, useState } from 'react';
import { FiArrowRight, FiLogOut, FiPauseCircle, FiX } from 'react-icons/fi'; // Import icons
import { Team } from '../../../../../../model/Team';
import { ColorType } from '../../../../../../ui-kissbot-v2/theme';
import { addNotification } from '../../../../../../utils/AddNotification';
import { sleep } from '../../../../../../utils/Timer';
import { isAnySystemAdmin, isWorkspaceAdmin } from '../../../../../../utils/UserPermission';
import I18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { LiveAgentService } from '../../../../service/LiveAgent.service';
import SuspendButton from '../../../ChatContainerHeader/suspendButton';
import { ClosingMessageModal } from '../../../ClosingMessageModal';
import ConfirmPopover from '../../../ConfirmPopover';
import TeamSelectorTemplate, { TransferOptions } from '../../../TeamSelectorTemplate';
import { ConversationContextMenuProps } from './props';
import { StyledSpan } from './styled';
import { useDeactivateReengagement } from '../../../../hooks/use-deactivate-reengagement';

// let debounceTimeoutAssume: any;
// const ASSUME_TIMEOUT = 6000;

const ConversationContextMenuComponent: FC<ConversationContextMenuProps & I18nProps> = (props) => {
    const {
        conversation,
        channels,
        getTranslation,
        teams,
        onUpdatedConversationSelected,
        children,
        loggedUser,
        workspaceId,
        disabled,
    } = props;
    const isAdmin = isAnySystemAdmin(loggedUser) || isWorkspaceAdmin(loggedUser, workspaceId);
    const isBlockedByRemi = conversation?.isWithSmtRe && !isAdmin;
    const [teamSelected, setTeamSelected] = useState<Team | undefined>(undefined);
    const { deactivateReengagement } = useDeactivateReengagement();
    const [modalState, setModalState] = useState({
        modalLeaveTheConversation: false,
        modalTransferConversation: false,
        modalEndConversation: false,
        modalToSuspendConversation: false,
        modalAssumeConversation: false,
    });

    const shouldDisplayAction = (conversation) => {
        return !!conversation.assumed && conversation.state === ConversationStatus.open;
    };

    const items: MenuProps['items'] = [
        shouldDisplayAction(conversation) &&
            !isBlockedByRemi && {
                label: (
                    <StyledSpan>
                        <FiLogOut title={getTranslation('Leave conversation')} />
                        {getTranslation('Leave conversation')}
                    </StyledSpan>
                ),
                key: '1',
                onClick: () => {
                    setModalState({ ...modalState, modalLeaveTheConversation: true });
                },
            },
        shouldDisplayAction(conversation) &&
            !isBlockedByRemi && {
                label: (
                    <StyledSpan>
                        <FiArrowRight title={getTranslation('Transfer conversation to another team')} />
                        {getTranslation('Transfer conversation')}
                    </StyledSpan>
                ),
                key: '2',
                onClick: () => {
                    setModalState({ ...modalState, modalTransferConversation: true });
                },
            },
        shouldDisplayAction(conversation) &&
            !isBlockedByRemi && {
                label: (
                    <StyledSpan>
                        <FiPauseCircle title={getTranslation('Suspend attendance')} />
                        {getTranslation('Suspend attendance')}
                    </StyledSpan>
                ),
                key: '3',
                onClick: () => {
                    setModalState({ ...modalState, modalToSuspendConversation: true });
                },
            },
        shouldDisplayAction(conversation) && {
            label: (
                <StyledSpan>
                    <FiX title={getTranslation('Close')} />
                    {getTranslation('Close')}
                </StyledSpan>
            ),
            key: '4',
            onClick: () => {
                setModalState({ ...modalState, modalEndConversation: true });
            },
        },
    ].filter(Boolean) as NonNullable<MenuProps['items']>;

    const handleOnConfirm = (transferOptions: TransferOptions) => {
        if (!!teamSelected) {
            setModalState({
                ...modalState,
                modalTransferConversation: false,
            });

            transfer(teamSelected._id, transferOptions);
        }
    };

    const transfer = async (teamId: string, options: TransferOptions) => {
        setModalState({
            ...modalState,
            modalTransferConversation: false,
        });

        let error: any;

        await LiveAgentService.transfer(
            workspaceId,
            teamId,
            loggedUser._id as string,
            conversation._id,
            {
                leaveConversation: options.leaveConversation,
            },
            (err: any) => {
                error = err;
            }
        );

        if (error) {
            return addNotification({
                title: getTranslation('Conversation could not be transferred'),
                message: getTranslation('Conversation could not be transferred'),
                type: 'danger',
                duration: 3000,
            });
        }

        return addNotification({
            title: getTranslation('Conversation transferred'),
            message: getTranslation('Conversation transferred'),
            type: 'success',
            duration: 3000,
        });
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
                return addNotification({
                    title: getTranslation('Error'),
                    message: getTranslation('You cannot leave this conversation'),
                    type: 'danger',
                    duration: 3000,
                });
            }
        } catch (error) {
            return addNotification({
                title: getTranslation('Error'),
                message: getTranslation('An error has occurred. Try again'),
                type: 'danger',
                duration: 3000,
            });
        }
    };

    const onCloseConversation = async (message: string) => {
        if (!workspaceId || !loggedUser || !conversation || disabled) return;

        const body = {} as { message?: string };

        if (message && message !== '') {
            body.message = message.trim();
        }

        LiveAgentService.changeStateConversation(workspaceId, loggedUser._id as string, conversation._id, body);
        await sleep(100);
        if (onUpdatedConversationSelected) {
            onUpdatedConversationSelected({ _id: conversation._id, state: 'closed' });
        }
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

    return (
        <Dropdown menu={{ items }} trigger={['contextMenu']}>
            <div
                onContextMenu={() =>
                    setModalState({
                        ...modalState,
                        modalLeaveTheConversation: false,
                    })
                }
            >
                {children}
                {modalState.modalLeaveTheConversation && (
                    <div style={{ marginLeft: 200 }}>
                        <ConfirmPopover
                            onConfirm={handleLeaveConversation}
                            confirmColorType={ColorType.danger}
                            text={getTranslation('Confirm attendance exit?')}
                            opened
                            placements='rightBottom'
                            setIsModalVisible={(newState) => {
                                setModalState({
                                    ...modalState,
                                    modalLeaveTheConversation: newState,
                                });
                            }}
                        />
                    </div>
                )}
                {modalState.modalTransferConversation && (
                    <TeamSelectorTemplate
                        showLeaveConversation={modalState.modalAssumeConversation ? false : true}
                        actionName={getTranslation('Transfer')}
                        onCancel={() =>
                            setModalState({
                                ...modalState,
                                modalTransferConversation: false,
                            })
                        }
                        onConfirm={(options) => handleOnConfirm(options)}
                        teams={teams}
                        opened={modalState.modalTransferConversation}
                        onTeamSelected={(team: Team) => setTeamSelected(team)}
                        teamSelected={teamSelected}
                        emptyMessage={getTranslation(
                            'It seems that there is no team or you are not allowed to make transfers'
                        )}
                    />
                )}
                <SuspendButton
                    setIsOpenedModal={(isOpen) => setModalState({ ...modalState, modalToSuspendConversation: isOpen })}
                    isOpenedModal={modalState.modalToSuspendConversation}
                    addNotification={addNotification}
                    conversation={conversation}
                    loggedUser={loggedUser}
                    onSuspendConversation={onSuspendConversation}
                    workspaceId={workspaceId as string}
                />
                {modalState.modalEndConversation && (
                    <ClosingMessageModal
                        opened={modalState.modalEndConversation}
                        conversation={conversation}
                        channels={channels}
                        setOpened={(newState) => {
                            setModalState({
                                ...modalState,
                                modalEndConversation: newState,
                            });
                        }}
                        workspaceId={workspaceId}
                        loggedUser={loggedUser}
                        closeConversation={(newState) => {
                            setModalState({
                                ...modalState,
                                modalEndConversation: newState,
                            });
                            onCloseConversation(newState);
                        }}
                        teams={teams}
                        addNotification={addNotification}
                        onUpdatedConversationSelected={onUpdatedConversationSelected}
                    />
                )}
            </div>
        </Dropdown>
    );
};

export const ConversationContextMenu = I18n(ConversationContextMenuComponent) as FC<ConversationContextMenuProps>;
