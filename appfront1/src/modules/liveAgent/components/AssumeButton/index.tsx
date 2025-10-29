import { IdentityType } from 'kissbot-core';
import { FC, useEffect, useState } from 'react';
import Loader from '../../../../shared/loader';
import { PrimaryButton, Wrapper } from '../../../../ui-kissbot-v2/common';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { AssumeButtonProps } from './props';
import debounce from 'lodash/debounce';
import TeamSelectorTemplate from '../TeamSelectorTemplate';
import { Team } from '../../../../model/Team';
import { SettingsService } from '../../../settings/service/SettingsService';
import { timeout } from '../../../../utils/Timer';
import { LiveAgentService } from '../../service/LiveAgent.service';
import { isAnySystemAdmin, isWorkspaceAdmin } from '../../../../utils/UserPermission';
import { addNotification } from '../../../../utils/AddNotification';
import { useSelector } from 'react-redux';
import { Workspace } from '../../../../model/Workspace';

let debounceTimeoutAssume: any;
const ASSUME_TIMEOUT = 6000;

const AssumeButton: FC<AssumeButtonProps & I18nProps> = ({
    conversation,
    workspaceId,
    loggedUser,
    getTranslation,
    focusTextArea,
    forceUpdateConversation,
    onUpdatedConversationSelected,
    workspaceTeams,
}) => {
    const selectedWorkspace = useSelector((state: any) => state.workspaceReducer.selectedWorkspace) as Workspace;
    const [modalSelectTeamOpened, setModalSelectTeamOpened] = useState(false);
    const [assumeRequested, setAssumeRequested] = useState(false);
    const [assumed, setAssumed] = useState(conversation.assumed);

    const [teams, setTeams] = useState<Team[]>(workspaceTeams);
    const [teamSelected, setTeamSelected] = useState<Team | undefined>(undefined);
    const [fetchedTeams, setFetchedTeams] = useState<boolean>(false);

    useEffect(() => {
        if (modalSelectTeamOpened) fetchTeams();
    }, [modalSelectTeamOpened]);

    const fetchTeams = async () => {
        const canListAllTeams = isAnySystemAdmin(loggedUser) || isWorkspaceAdmin(loggedUser, workspaceId);
        let query: any = {};

        if (canListAllTeams) {
            query = {
                filter: {},
            };
        } else {
            query = {
                filter: {
                    roleUsers: {
                        $elemMatch: {
                            userId: loggedUser._id,
                        },
                    },
                },
            };
        }

        const response = await SettingsService.getTeams(query, workspaceId);
        setTeams(response?.data ?? []);
        setFetchedTeams(true);

        if (response?.data && response?.data?.length === 1) {
            fetchAssumeConversation(response.data[0]._id);
        }
    };

    const handleOnConfirm = () => {
        if (!!teamSelected) {
            setModalSelectTeamOpened(false);
            fetchAssumeConversation(teamSelected._id);
        }
    };

    const fetchAssumeConversation = async (teamId: string) => {
        if (!conversation || !teamId) return;

        let errorObj;

        setAssumeRequested(true);
        debounceTimeout();

        await LiveAgentService.assumeConversation(
            workspaceId as string,
            conversation._id,
            loggedUser._id as string,
            {
                teamId,
            },
            (err) => {
                errorObj = err;
            }
        );

        if (errorObj?.error === 'USER_NOT_ON_TEAM') {
            setAssumeRequested(false);
            debounceTimeoutAssume && debounceTimeoutAssume.cancel();

            addNotification({
                message: getTranslation(
                    'You are not part of the team which this service was assigned. Contact your supervisor'
                ),
                title: getTranslation('Error'),
                type: 'danger',
            });

            return;
        } else if (errorObj?.error === 'NO_PERMISSION_TO_ACESS_CONVERSATION') {
            setAssumeRequested(false);

            addNotification({
                message: getTranslation(
                    'You do not have permission in the team to which this service has been assigned. Please contact your supervisor'
                ),
                title: getTranslation('Error'),
                type: 'danger',
            });

            return;
        }

        timeout(focusTextArea, 500);
    };

    const debounceTimeout = () => {
        debounceTimeoutAssume = debounce(() => {
            setAssumeRequested(false);
            // busca a conversa na api e atualiza ela na lista e se for a aberta em tela
            forceUpdateConversation();
        }, ASSUME_TIMEOUT);

        debounceTimeoutAssume();
    };

    useEffect(() => {
        validateIsAssumed();
    }, [conversation.members]);

    useEffect(() => {
        conversation.assumed !== assumed && setAssumed(conversation.assumed);
    }, [conversation.assumed]);

    const validateIsAssumed = () => {
        const currMember = conversation.members?.find(
            (member) => member.id === loggedUser._id && member.type === IdentityType.agent
        );

        if (!!currMember) {
            setAssumeRequested(false);
            debounceTimeoutAssume && debounceTimeoutAssume.cancel();
        }

        if (!!currMember && !currMember.disabled) {
            setAssumed(true);
            !conversation.assumed &&
                onUpdatedConversationSelected({
                    _id: conversation._id,
                    assumed: true,
                });
        } else {
            setAssumed(false);
            conversation.assumed &&
                onUpdatedConversationSelected({
                    _id: conversation._id,
                    assumed: false,
                });
        }
    };

    const onClickAssume = () => {
        if (conversation?.assignedToTeamId) {
            return fetchAssumeConversation(conversation.assignedToTeamId);
        }
        setModalSelectTeamOpened(true);
    };

    const getDisabledReason = () => {
        const isAdmin = isAnySystemAdmin(loggedUser) || isWorkspaceAdmin(loggedUser, workspaceId);

        if (conversation?.isWithSmtRe && !isAdmin) {
            return getTranslation('Disabled while REMI is controlling the service.');
        }

        if (selectedWorkspace?.featureFlag?.enableRuleAssumeByPermission) {
            if (conversation?.assignedToTeamId && !!teams?.length) {
                const conversationTeam = teams.find((team) => team._id === conversation.assignedToTeamId);
                const roleUser = conversationTeam?.roleUsers?.find((role) => role.userId === loggedUser._id);

                if (!conversationTeam || !roleUser || !!roleUser?.permission?.canViewHistoricConversation) {
                    return getTranslation('You do not have permission to take over this service.');
                }
            }
        }

        return undefined;
    };

    const canAssumeConversation = () => {
        const isAdmin = isAnySystemAdmin(loggedUser) || isWorkspaceAdmin(loggedUser, workspaceId);

        if (conversation?.isWithSmtRe && !isAdmin) {
            return false;
        }

        // se a flag não estiver ativa todos podem assumir
        if (selectedWorkspace && !selectedWorkspace?.featureFlag?.enableRuleAssumeByPermission) {
            return true;
        }

        if (isAnySystemAdmin(loggedUser) || isWorkspaceAdmin(loggedUser, workspaceId)) {
            return true;
        }

        if (conversation?.assignedToTeamId && !!teams?.length) {
            const conversationTeam = teams.find((team) => team._id === conversation.assignedToTeamId);
            const roleUser = conversationTeam?.roleUsers?.find((role) => role.userId === loggedUser._id);

            // Se é um agente que não esta no time para o qual o atendimento esta assinado
            // ou possui permissão apenas para visualizar historico não deve permitir que assuma o atendimento.
            if (!conversationTeam || !roleUser || !!roleUser?.permission?.canViewHistoricConversation) {
                return false;
            }
        }
        return true;
    };

    return (
        <div>
            {modalSelectTeamOpened && (
                <TeamSelectorTemplate
                    actionName={getTranslation('Assume')}
                    onCancel={() => setModalSelectTeamOpened(false)}
                    onConfirm={() => handleOnConfirm()}
                    teams={teams}
                    opened={modalSelectTeamOpened && (teams.length > 1 || teams.length === 0) && fetchedTeams}
                    onTeamSelected={(team: Team) => setTeamSelected(team)}
                    teamSelected={teamSelected}
                    emptyMessage={getTranslation(
                        'It seems that there is no team or you are not allowed to start new attendances. Talk to your supervisor!'
                    )}
                />
            )}
            {assumeRequested && (
                <Wrapper>
                    <Wrapper
                        bottom='15%'
                        left='50%'
                        position='absolute'
                        style={{
                            zIndex: '1',
                            transform: 'translateY(-50%) translateX(-50%)',
                        }}
                    >
                        <Loader />
                    </Wrapper>
                </Wrapper>
            )}
            {!assumed && !assumeRequested ? (
                <div>
                    <Wrapper
                        bottom='15%'
                        left='50%'
                        position='absolute'
                        style={{
                            zIndex: '1',
                            transform: 'translateY(-50%) translateX(-50%)',
                        }}
                    >
                        <PrimaryButton
                            title={getDisabledReason()}
                            disabled={!canAssumeConversation()}
                            id='assumeButton'
                            margin='auto'
                            onClick={onClickAssume}
                        >
                            {(conversation.members || []).find(
                                (member) => member.id === loggedUser._id && member.disabled
                            )
                                ? getTranslation('Reassume conversation')
                                : getTranslation('Assume conversation')}
                        </PrimaryButton>
                    </Wrapper>
                </div>
            ) : null}
        </div>
    );
};

export default i18n(AssumeButton) as FC<AssumeButtonProps>;
