import { Moment } from "moment";
import { Workspace } from "../../../../../../model/Workspace";
import { typeDownloadEnum } from "../../../../../../shared/DownloadModal/props";

export interface FiltersProps {
    selectedWorkspace?: Workspace;
    initialFilter: FallbackFilterInterface;
    onSubmit: (filter: FallbackFilterInterface) => any;
    disable: boolean;
}

export interface FallbackFilterInterface {
        tags?: string[] | undefined;
        rangeDate?: Moment[] | string[];
        status?: 'new' | 'ignored' | 'solved' | undefined;
}

export interface FallbackExportInterface {
    rangeDate?: string[];
    downloadType?: typeDownloadEnum;
}
