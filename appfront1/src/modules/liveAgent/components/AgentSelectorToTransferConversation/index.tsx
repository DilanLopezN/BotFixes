import { SearchOutlined } from '@ant-design/icons';
import { Alert, Button, Checkbox, Col, Empty, Input, InputRef, Modal, Row, Table, Tooltip, Typography } from 'antd';
import { ColumnsType, ColumnType } from 'antd/lib/table';
import { User } from 'kissbot-core';
import { FC, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Team } from '../../../../model/Team';
import { Workspace } from '../../../../model/Workspace';
import { addNotification } from '../../../../utils/AddNotification';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { useDeactivateReengagement } from '../../hooks/use-deactivate-reengagement';
import { LiveAgentService } from '../../service/LiveAgent.service';
import { AgentSelectorToTransferConversationProps } from './props';
import { Content, ContentLabel } from './styled';

type Result = Record<string, { teams: Team[]; teamHistory: Team[] }>;

const AgentSelectorToTransferConversation: FC<AgentSelectorToTransferConversationProps & I18nProps> = ({
    teams,
    users,
    onClose,
    getTranslation,
    opened,
    conversation,
}) => {
    const selectedWorkspace = useSelector((state: any) => state.workspaceReducer.selectedWorkspace) as Workspace;
    const [searchUserValue, setSearchUserValue] = useState('');
    const [searchTeamValue, setSearchTeamValue] = useState('');
    const [teamSelected, setTeamSelected] = useState<Team | undefined>(undefined);
    const [userSelected, setUserSelected] = useState<User | undefined>(undefined);
    const [usersOnTeams, setUsersOnTeams] = useState<Result>({});
    const teamsFiltered = !!userSelected
        ? [
              ...(usersOnTeams?.[userSelected._id as string]?.teams || []),
              ...(usersOnTeams?.[userSelected._id as string]?.teamHistory || []),
          ].filter((team) => team.name.toLowerCase().includes(searchTeamValue.toLowerCase()))
        : [];
    const filteredUsers = users.filter((user) => user.name.toLowerCase().includes(searchUserValue.toLowerCase()));
    const [loading, setLoading] = useState<boolean>(false);
    const { deactivateReengagement } = useDeactivateReengagement();

    useEffect(() => {
        const conversationTeamSelected = teams?.find((team) => team._id === conversation?.assignedToTeamId);

        setUsersOnTeams(transformTeams(teams));
        setTeamSelected(conversationTeamSelected);
    }, [conversation, teams]);

    const transformTeams = (teams: Team[]): Result => {
        return teams.reduce<Result>((acc, team) => {
            team.roleUsers.forEach(({ userId, permission }) => {
                if (!acc[userId]) {
                    acc[userId] = { teams: [], teamHistory: [] };
                }

                if (permission.canViewHistoricConversation) {
                    acc[userId].teamHistory.push(team);
                } else {
                    acc[userId].teams.push(team);
                }
            });
            return acc;
        }, {});
    };

    const searchInput = useRef<InputRef>(null);
    const getColumnSearchProps = (): ColumnType<any> =>
        !userSelected
            ? {}
            : {
                  filterDropdown: ({ setSelectedKeys, selectedKeys }) => (
                      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
                          <Input
                              ref={searchInput}
                              placeholder={getTranslation('Search team')}
                              value={`${selectedKeys[0] || ''}`}
                              onChange={(e) => {
                                  setSearchTeamValue(e.target.value || '');
                                  setSelectedKeys(e.target.value ? [e.target.value] : []);
                              }}
                              allowClear
                              style={{ marginBottom: 8 }}
                          />
                      </div>
                  ),
                  filterIcon: () => (
                      <SearchOutlined
                          style={{
                              color: searchTeamValue?.length ? '#1890ff' : undefined,
                          }}
                      />
                  ),
                  onFilterDropdownOpenChange: (visible) => {
                      if (visible) {
                          setTimeout(() => searchInput.current?.select(), 100);
                      }
                  },
              };

    const columnsUser: ColumnsType<User> = [
        {
            title: <b style={{ color: '#696969' }}>{getTranslation('Agents')}</b>,
            dataIndex: 'name',
            ellipsis: true,
            render: (value, record) => {
                const user = record;
                return (
                    <Row
                        style={{ alignItems: 'center' }}
                        onClick={() => {
                            if (user?._id !== userSelected?._id) {
                                const userIncludeTeamHistory = usersOnTeams?.[user._id as string]?.teamHistory?.some(
                                    (currTeam) => currTeam?._id === teamSelected?._id
                                );
                                const userIncludeTeam = usersOnTeams?.[user._id as string]?.teams?.some(
                                    (currTeam) => currTeam?._id === teamSelected?._id
                                );
                                if (userIncludeTeamHistory || !userIncludeTeam) {
                                    setTeamSelected(undefined);
                                } else {
                                    if (!teamSelected) {
                                        const newTeamSelected = usersOnTeams?.[user._id as string].teams.find(
                                            (team) => team._id === conversation?.assignedToTeamId
                                        );
                                        setTeamSelected(newTeamSelected);
                                    }
                                }
                                setUserSelected(user);
                                setSearchTeamValue('');
                            }
                        }}
                    >
                        <Col span={2}>
                            <Checkbox key={user?._id} checked={!!userSelected && user?._id === userSelected?._id} />
                        </Col>
                        <Col className='antd-span-default-color' span={22}>
                            <Typography.Text title={value} style={{ maxWidth: '100%' }} ellipsis>
                                {value}
                            </Typography.Text>
                        </Col>
                    </Row>
                );
            },
        },
    ];

    const columnsTeam: ColumnsType<Team> = [
        {
            title: <b style={{ color: '#696969' }}>{getTranslation('Teams the agent is part of')}</b>,
            dataIndex: 'name',
            ellipsis: true,
            ...getColumnSearchProps(),
            render: (value, record) => {
                const team = record;

                const disabled = userSelected
                    ? usersOnTeams?.[userSelected._id as string]?.teamHistory?.some(
                          (currTeam) => currTeam._id === team._id
                      )
                    : false;

                const children = (
                    <Row
                        style={{ alignItems: 'center' }}
                        onClick={() => {
                            if (!disabled && team?._id !== teamSelected?._id) {
                                setTeamSelected(team);
                            }
                        }}
                    >
                        <Col span={2}>
                            <Checkbox disabled={disabled} key={team?._id} checked={team?._id === teamSelected?._id} />
                        </Col>
                        <Col className='antd-span-default-color' span={22}>
                            <Typography.Text title={value} style={{ maxWidth: '100%' }} ellipsis>
                                {value}
                            </Typography.Text>
                        </Col>
                        {}
                    </Row>
                );
                return disabled ? (
                    <Tooltip title={getTranslation('The agent is not allowed to take over the team.')}>
                        {children}
                    </Tooltip>
                ) : (
                    children
                );
            },
        },
    ];

    const transfer = async () => {
        if (!teamSelected || !userSelected) {
            return;
        }
        setLoading(true);
        let error: any;

        await LiveAgentService.transferConversationToAgent(
            selectedWorkspace._id,
            conversation._id,
            {
                agentId: userSelected._id as string,
                teamId: teamSelected._id as string,
            },
            (err: any) => {
                error = err;
            }
        );
        setLoading(false);

        if (error) {
            if (error.error === 'MEMBER_WITHOUT_PERMISSION') {
                addNotification({
                    title: getTranslation('Conversation could not be transferred'),
                    message: getTranslation('You do not have permission for this action.'),
                    type: 'danger',
                    duration: 3000,
                });
            } else if (error.error === 'TEAM_INACTIVATED') {
                addNotification({
                    title: getTranslation('Conversation could not be transferred'),
                    message: getTranslation('Team is inactive, try transferring to another team.'),
                    type: 'danger',
                    duration: 3000,
                });
            } else if (error.error === 'TEAM_CANNOT_RECEIVE_CONVERSATION_TRANSFER') {
                addNotification({
                    title: getTranslation('Conversation could not be transferred'),
                    message: getTranslation("This team doesn't allow transfers, try transferring to another team."),
                    type: 'danger',
                    duration: 3000,
                });
            } else if (error.error === 'USER_NOT_HAVE_PERMISSION_ON_TEAM') {
                addNotification({
                    title: getTranslation('Conversation could not be transferred'),
                    message: getTranslation(
                        'This agent does not have permission to take on appointments in this team, select another team.'
                    ),
                    type: 'danger',
                    duration: 3000,
                });
            } else {
                addNotification({
                    title: getTranslation('We get an error, try again'),
                    message: getTranslation('Conversation could not be transferred'),
                    type: 'danger',
                    duration: 3000,
                });
            }
        } else {
            addNotification({
                title: getTranslation('Conversation transferred'),
                message: getTranslation('Conversation transferred'),
                type: 'success',
                duration: 3000,
            });
            onClose();
        }
        if (conversation?.smtReId) {
            await deactivateReengagement(conversation._id, conversation.smtReId);
        }
    };

    const searchInputUser = useRef<InputRef>(null);
    useEffect(() => {
        setTimeout(() => searchInputUser.current?.select(), 200);
    }, []);

    return (
        <Modal
            title={getTranslation('Transfer service to a specific agent')}
            width={680}
            className='custom-modal-transfer'
            open={opened}
            centered
            onCancel={() => onClose()}
            footer={
                <Row style={{ height: 34, alignItems: 'center' }} justify={'space-between'}>
                    <Col>
                        {!!userSelected && !teamSelected ? (
                            <Alert
                                message={getTranslation('Select a team that the agent is part of to continue!')}
                                type='warning'
                                showIcon
                                style={{ padding: '5px 15px' }}
                            />
                        ) : null}
                    </Col>
                    <Col>
                        {teams.length ? (
                            <Button
                                className='antd-span-default-color'
                                type='primary'
                                onClick={() => transfer()}
                                disabled={!teamSelected || !userSelected || loading}
                                children={getTranslation('Transfer')}
                                loading={loading}
                            />
                        ) : null}
                    </Col>
                </Row>
            }
        >
            <>
                <ContentLabel>
                    {getTranslation('Select the agent to whom you want to transfer this service:')}
                </ContentLabel>
                <Input
                    style={{ margin: '0 10px 5px 10px', width: '660px' }}
                    ref={searchInputUser}
                    placeholder={getTranslation('Search agent')}
                    value={searchUserValue}
                    onChange={(e) => setSearchUserValue(e.target.value)}
                    allowClear
                    autoFocus
                />
                <Content>
                    <Table
                        size='small'
                        style={{ width: '50%' }}
                        scroll={{ y: '350px' }}
                        bordered
                        dataSource={filteredUsers}
                        columns={columnsUser}
                        pagination={false}
                        locale={{
                            emptyText: !!searchUserValue ? (
                                <Empty
                                    description={getTranslation(
                                        "We couldn't find any agents with the text you entered. Try searching for another name!"
                                    )}
                                />
                            ) : undefined,
                        }}
                    />
                    <Table
                        size='small'
                        style={{ width: '50%' }}
                        scroll={{ y: '350px' }}
                        bordered
                        dataSource={teamsFiltered}
                        columns={columnsTeam}
                        pagination={false}
                        locale={{
                            emptyText: !userSelected ? (
                                <Empty
                                    description={getTranslation('Select an agent to list the teams they belong to!')}
                                />
                            ) : userSelected && !usersOnTeams?.[userSelected._id as string]?.teams ? (
                                <Empty
                                    description={getTranslation(
                                        'This agent is not included in any team, select another agent.'
                                    )}
                                />
                            ) : undefined,
                        }}
                    />
                </Content>
            </>
        </Modal>
    );
};

export default i18n(AgentSelectorToTransferConversation) as FC<AgentSelectorToTransferConversationProps>;
