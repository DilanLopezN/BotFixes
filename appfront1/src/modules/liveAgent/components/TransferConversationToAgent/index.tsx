import { Row } from 'antd';
import { User, UserRoles } from 'kissbot-core';
import { FC, useEffect, useState } from 'react';
import { AiOutlineUserSwitch } from 'react-icons/ai';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { PaginatedModel } from '../../../../model/PaginatedModel';
import { Team } from '../../../../model/Team';
import { Workspace } from '../../../../model/Workspace';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { SettingsService } from '../../../settings/service/SettingsService';
import { WorkspaceUserService } from '../../../settings/service/WorkspaceUserService';
import { useWindowSize } from '../../hooks/use-window-size';
import AgentSelectorToTransferConversation from '../AgentSelectorToTransferConversation';
import { breakpoint } from '../ChatContainerHeader';
import { TransferConversationToAgentProps } from './props';

const TransferIcon = styled(AiOutlineUserSwitch)`
    font-size: 25px;
    cursor: pointer;
    color: #696969;
`;

const TransferConversationToAgent: FC<TransferConversationToAgentProps & I18nProps> = ({
    conversation,
    getTranslation,
    modalOpened,
    setModalOpened,
}) => {
    const selectedWorkspace = useSelector((state: any) => state.workspaceReducer.selectedWorkspace) as Workspace;
    const [teams, setTeams] = useState<Team[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [fetchedTeams, setFetchedTeams] = useState<boolean>(false);
    const [fetchedUsers, setFetchedUsers] = useState<boolean>(false);
    const windowSize = useWindowSize();
    const isSmallScreen = windowSize.width < breakpoint;

    useEffect(() => {
        if (modalOpened) {
            fetchTeams();
            fetchWorkspaceUsers();
        }
    }, [modalOpened]);

    const fetchTeams = async () => {
        let query: any = {};

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

        const teamList = await SettingsService.getTeams(query, selectedWorkspace._id);
        const possibleTeams = teamList?.data?.filter((team) => !team.inactivatedAt);

        setTeams(possibleTeams || []);
        setFetchedTeams(true);
    };

    async function fetchWorkspaceUsers() {
        if (selectedWorkspace._id) {
            const query: any = {
                roles: {
                    $elemMatch: {
                        role: { $ne: UserRoles.WORKSPACE_INACTIVE },
                        resourceId: { $eq: selectedWorkspace._id },
                    },
                },
            };
            const response: PaginatedModel<User> = await WorkspaceUserService.getAll(
                selectedWorkspace._id,
                'name',
                query
            );

            setUsers(response?.data || []);
            setFetchedUsers(true);
        }
    }

    return (
        <Wrapper alignItems='center' flexBox>
            {modalOpened && (
                <AgentSelectorToTransferConversation
                    onClose={() => {
                        setModalOpened(false);
                    }}
                    teams={teams}
                    users={users}
                    opened={modalOpened && fetchedTeams && fetchedUsers}
                    conversation={conversation}
                />
            )}
            <Row onClick={() => setModalOpened(true)} style={{ width: '100%' }}>
                <TransferIcon title={getTranslation('Transferir para agente específico')} />
                {isSmallScreen && <span style={{ marginLeft: 8 }}>{getTranslation('Transferir para agente')}</span>}
            </Row>
        </Wrapper>
    );
};

export default i18n(TransferConversationToAgent) as FC<TransferConversationToAgentProps>;
