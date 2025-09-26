import { Row } from 'antd';
import { FC, useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Team, TeamPermissionTypes, validateTeamPermission } from '../../../../model/Team';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { isAnySystemAdmin, isWorkspaceAdmin } from '../../../../utils/UserPermission';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { SettingsService } from '../../../settings/service/SettingsService';
import { useDeactivateReengagement } from '../../hooks/use-deactivate-reengagement';
import { useWindowSize } from '../../hooks/use-window-size';
import { LiveAgentService } from '../../service/LiveAgent.service';
import { breakpoint } from '../ChatContainerHeader';
import TeamSelectorTemplate, { TransferOptions } from '../TeamSelectorTemplate';
import { TransferConversationProps } from './props';

const TransferIcon = styled.span<{ disabled: boolean }>`
    font-size: 27px;
    cursor: pointer;

    ${(props) =>
        props.disabled &&
        `
        cursor: default;
        opacity: 0.5;
    `}
`;

const TransferConversation: FC<TransferConversationProps & I18nProps> = ({
    conversation,
    getTranslation,
    loggedUser,
    workspaceId,
    teams: teamList,
    notification,
}) => {
    const [canTransfer, setCanTransfer] = useState(false);
    const [modalSelectTeamOpened, setModalSelectTeamOpened] = useState(false);
    const [teams, setTeams] = useState<Team[]>([]);
    const [teamSelected, setTeamSelected] = useState<Team | undefined>(undefined);
    const [fetchedTeams, setFetchedTeams] = useState<boolean>(false);
    const windowSize = useWindowSize();
    const isSmallScreen = windowSize.width < breakpoint;
    const { deactivateReengagement } = useDeactivateReengagement();

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
        }
        query.filter = {
            $or: [
                {
                    canReceiveTransfer: true,
                },
                {
                    canReceiveTransfer: { $exists: false },
                },
            ],
        };

        // projection esta limitando os campos que seram retornados da api
        query.projection = {
            _id: 1,
            name: 1,
            roleUsers: 1,
            color: 1,
            inactivatedAt: 1,
        };

        const teamList = await SettingsService.getTeams(query, workspaceId);
        const possibleTeams = teamList?.data?.filter(
            (team) => team._id !== conversation.assignedToTeamId && !team.inactivatedAt
        );

        setTeams(possibleTeams || []);
        setFetchedTeams(true);
    };

    const handleOnConfirm = (transferOptions: TransferOptions) => {
        if (!!teamSelected) {
            setModalSelectTeamOpened(false);
            transfer(teamSelected._id, transferOptions);
        }
    };

    useEffect(() => {
        if (conversation.assignedToTeamId) {
            const canTransfer = validateTeamPermission(
                teamList,
                conversation.assignedToTeamId,
                TeamPermissionTypes.canTransferConversations,
                loggedUser,
                workspaceId
            );

            setCanTransfer(canTransfer);
        }
    }, [conversation?.assignedToTeamId]);

    const iconTitles = useCallback((key: number) => {
        return {
            0: getTranslation('You are not allowed to make transfers'),
            1: getTranslation('Transfer conversation to another team'),
        }[key];
    }, []);

    const transfer = async (teamId: string, options: TransferOptions) => {
        setModalSelectTeamOpened(false);
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
            return notification({
                title: getTranslation('Conversation could not be transferred'),
                message: getTranslation('Conversation could not be transferred'),
                type: 'danger',
                duration: 3000,
            });
        }

        if (conversation?.smtReId) {
            await deactivateReengagement(conversation._id, conversation.smtReId);
        }
        return notification({
            title: getTranslation('Conversation transferred'),
            message: getTranslation('Conversation transferred'),
            type: 'success',
            duration: 3000,
        });
    };

    const title = iconTitles(+canTransfer);

    return (
        <Wrapper alignItems='center' flexBox>
            {modalSelectTeamOpened && (
                <TeamSelectorTemplate
                    showLeaveConversation
                    actionName={getTranslation('Transfer')}
                    onCancel={() => setModalSelectTeamOpened(false)}
                    onConfirm={(options) => handleOnConfirm(options)}
                    teams={teams}
                    opened={modalSelectTeamOpened && fetchedTeams}
                    onTeamSelected={(team: Team) => setTeamSelected(team)}
                    teamSelected={teamSelected}
                    emptyMessage={getTranslation(
                        'It seems that there is no team or you are not allowed to make transfers'
                    )}
                />
            )}
            <Row onClick={() => canTransfer && setModalSelectTeamOpened(true)} align={'middle'}>
                <TransferIcon title={title} disabled={!canTransfer} className='mdi mdi-swap-horizontal' />
                {isSmallScreen && <span style={{ marginLeft: 8 }}>{getTranslation('Transferir equipe')}</span>}
            </Row>
        </Wrapper>
    );
};

export default i18n(TransferConversation) as FC<TransferConversationProps>;
