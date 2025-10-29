import { FC, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Team } from '../../../../../../model/Team';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import CardWrapper from '../CardWrapper';
import { Label } from '../Common/common';
import { AssignedTeamProps } from './props';

const Content = styled(CardWrapper)`
    display: flex;
    align-items: center;
`;

const AssignedTeam: FC<AssignedTeamProps & I18nProps> = ({ teamId, teams, getTranslation }) => {
    const [currentTeam, setCurrentTeam] = useState<Team | undefined>(undefined);

    useEffect(() => {
        const team = teams.find((team) => team._id === teamId);
        setCurrentTeam(team);
    }, [teamId]);

    return currentTeam ? (
        <Content>
            <Label title={`${currentTeam.name}`}>{`${getTranslation('Team')}: ${currentTeam.name}`}</Label>
        </Content>
    ) : null;
};

export default i18n(AssignedTeam) as FC<AssignedTeamProps>;
