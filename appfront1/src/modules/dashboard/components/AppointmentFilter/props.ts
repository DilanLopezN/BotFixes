import { User } from 'kissbot-core';
import { Workspace } from '../../../../model/Workspace';
import { typeDownloadEnum } from '../../../../shared/DownloadModal/props';

export interface AppointmentFilterProps {
    selectedWorkspace: Workspace;
    initialFilter: AppointmentFilterInterface;
    onSubmit: (filter: AppointmentFilterInterface) => any;
    loggedUser: User;
    initialConfigState: any;
    setInitialConfigState: any;
    loading: boolean;
    setIsShowAlert: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface AppointmentFilterInterface {
    tags: string[];
    botId: string;
    startDate: string;
    endDate: string;
    teamIds: string[];
    channelIds: string[];
    ommitFields?: boolean;
    downloadType?: typeDownloadEnum;
    timezone?: string;
    pivotConfig?: string[];
    pivotValueFilter?: Record<string, Record<string, boolean>>;
}

export interface FilterSelect {
    [workspaceId: string]: AppointmentFilterInterface;
}
