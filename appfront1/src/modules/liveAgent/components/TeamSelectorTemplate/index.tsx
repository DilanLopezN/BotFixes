import { Button, Checkbox, Col, Form, Input, Modal, Row } from 'antd';
import { FC, useEffect, useState } from 'react';
import { Team } from '../../../../model/Team';
import { timeout } from '../../../../utils/Timer';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { TeamSelectorTemplateProps } from './props';
import { Color, Content, EmptyDataInfo, TeamItem, TeamItemName } from './styled';

export interface TransferOptions {
    leaveConversation: boolean;
}

export interface TeamItemSelectProps {
    teamSelected: Team | undefined;
    team: Team;
    setTeamSelected: Function;
}

export const TeamItemSelect: FC<TeamItemSelectProps> = ({ teamSelected, team, setTeamSelected }) => {
    return (
        <TeamItem selected={teamSelected?._id === team._id} key={team._id} onClick={() => setTeamSelected(team)}>
            <Color style={{ background: team.color }} />
            <TeamItemName>
                <span>{team.name}</span>
            </TeamItemName>
        </TeamItem>
    );
};

const TeamSelectorTemplate: FC<TeamSelectorTemplateProps & I18nProps> = ({
    teams,
    teamSelected,
    onCancel,
    getTranslation,
    onConfirm,
    actionName,
    opened,
    onTeamSelected,
    emptyMessage,
    showLeaveConversation,
}) => {
    const [transferOptions, setTransferOptions] = useState<TransferOptions>({
        leaveConversation: true,
    });

    const handleKeyChanged = (value: any, key: string) =>
        setTransferOptions((prevState) => ({
            ...prevState,
            [key]: value,
        }));

    const [searchValue, setSearchValue] = useState('');
    const filteredTeams = teams.filter((team) => team.name.toLowerCase().includes(searchValue.toLowerCase()));

    useEffect(() => {
        const element = document.getElementById('input-team');
        timeout(() => element?.focus(), 100);
    }, []);

    return (
        <Modal
            title={getTranslation('Select a team')}
            width={420}
            className='custom-modal-transfer'
            open={opened}
            centered
            bodyStyle={{ height: 330 }}
            onCancel={() => onCancel()}
            footer={
                <Row style={{ height: 34 }} justify={'space-between'}>
                    <Col>
                        {teams.length && showLeaveConversation ? (
                            <Form.Item
                                colon={false}
                                label={
                                    <span>
                                        <Checkbox
                                            style={{ marginRight: 8 }}
                                            checked={transferOptions.leaveConversation}
                                            onChange={(e) => handleKeyChanged(e.target.checked, 'leaveConversation')}
                                        />
                                        {getTranslation('Leave conversation')}
                                    </span>
                                }
                            />
                        ) : null}
                    </Col>
                    <Col>
                        {teams.length ? (
                            <Button
                                className='antd-span-default-color'
                                type='primary'
                                onClick={() => onConfirm(transferOptions)}
                                disabled={!teamSelected}
                                children={actionName}
                            />
                        ) : null}
                    </Col>
                </Row>
            }
        >
            {teams.length ? (
                <Row justify={'center'} gutter={[16, 16]}>
                    {teams.length > 5 && (
                        <Input
                            style={{ width: '400px' }}
                            id='input-team'
                            placeholder={getTranslation('Search teams')}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            allowClear
                            autoFocus
                        />
                    )}
                    {filteredTeams.length === 0 && <span>{getTranslation('Team not found.')}</span>}
                </Row>
            ) : null}
            <Content>
                {teams.length ? (
                    <>
                        {filteredTeams.map((team) => {
                            return (
                                <TeamItemSelect
                                    key={team._id}
                                    setTeamSelected={(team: Team) => onTeamSelected(team)}
                                    team={team}
                                    teamSelected={teamSelected}
                                />
                            );
                        })}
                    </>
                ) : (
                    <EmptyDataInfo>
                        <p>{emptyMessage}</p>
                    </EmptyDataInfo>
                )}
            </Content>
        </Modal>
    );
};

export default i18n(TeamSelectorTemplate) as FC<TeamSelectorTemplateProps>;
