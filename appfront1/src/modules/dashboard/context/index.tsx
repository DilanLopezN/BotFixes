import React, { createContext, ReactNode, useContext, useState } from 'react';
import { Team } from '../../../model/Team'

export type TeamsContext = {
    teams?: Team[];
    setTeams: React.Dispatch<React.SetStateAction<Team[] | undefined>>;
};

export const TeamsContext = createContext<TeamsContext>({
    teams: undefined,
    setTeams: () => { },
});

export const useTeamsContext = () => useContext(TeamsContext);

export const TeamsContextProvider = ({ children }: { children: ReactNode }) => {
    const [teams, setTeams] = useState<Team[] | undefined>(undefined);

    return (
        <TeamsContext.Provider
            value={{
                teams,
                setTeams,
            }}
        >
            {children}
        </TeamsContext.Provider>
    );
};