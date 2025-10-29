import { useEffect, FC, useState } from 'react';
import isEmpty from 'lodash/isEmpty';
import { I18nProps } from '../../modules/i18n/interface/i18n.interface';
import I18n from '../../modules/i18n/components/i18n';
import { CustomCreatableSelect } from '../StyledForms/CustomCreatableSelect/CustomCreatableSelect';
import { Team } from '../../model/Team';
import { TeamService } from '../../modules/teams/services/TeamService';
import { ShowError } from '../StyledForms/ShowError/ShowError';

export interface TeamSelectProps {
    currentValue: string;
    workspaceId: string;
    onChange: (team: Team) => any;
}

const TeamSelect = ({ getTranslation, currentValue, onChange, workspaceId }: TeamSelectProps & I18nProps) => {
    const [teams, setTeams] = useState<Team[] | undefined>(undefined);
    const [value, setValue] = useState<{ label: string; value: string } | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchTeams();
    }, [workspaceId]);

    const fetchTeams = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await TeamService.getTeams(workspaceId);

            if (response?.data && response.data.length > 0) {
                setTeams(response.data);
                setCurrentValue(response.data);
            } else {
                setTeams([]);
                setValue(undefined);
                setError(getTranslation('Cannot found any team'));
            }
        } catch (e) {
            setTeams([]);
            setValue(undefined);
            setError(getTranslation('Cannot found any team'));
        } finally {
            setIsLoading(false);
        }
    };

    const renderOptions = () => {
        if (!teams) return [];
        return teams.map((team) => ({
            label: team.name,
            value: team._id,
        }));
    };

    const onValueChange = (team: Team) => {
        if (!team) {
            setValue(undefined);
            return;
        }

        setError(null);
        setValue({
            label: team.name,
            value: team._id,
        });
        onChange(team);
    };

    const setCurrentValue = (receivedTeams: Team[]) => {
        if (!receivedTeams || receivedTeams.length === 0 || !currentValue) {
            setValue(undefined);
            return;
        }

        const team = receivedTeams.find((team) => team._id === currentValue);

        if (team) {
            setValue({
                label: team.name,
                value: team._id,
            });
            setError(null);
        } else {
            setValue(undefined);
            setError(getTranslation('Selection of an existing team in this workspace is required'));
        }
    };

    return (
        <div>
            <CustomCreatableSelect
                options={renderOptions()}
                placeholder={getTranslation('Select a team')}
                value={value}
                disabled={isLoading}
                onCreateOption={(ev) => {
                    onChange(ev);
                }}
                onChange={(ev) => {
                    if (!teams) {
                        return;
                    }

                    if (ev === null || isEmpty(ev)) {
                        setValue(undefined);
                        return;
                    }

                    const team = teams.find((t) => t._id === ev.value);
                    if (team) {
                        onValueChange(team);
                    } else {
                        setError(getTranslation('Cannot found any team'));
                    }
                }}
            />
            {error && <ShowError>{error}</ShowError>}
        </div>
    );
};

export default I18n(TeamSelect) as FC<TeamSelectProps>;
