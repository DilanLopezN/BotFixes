import { Workspace } from '../../../../../../model/Workspace';
import { FallbackFilterInterface } from '../FallbackFilter/props';

export interface FallbackListProps {
    selectedWorkspace: Workspace;
    appliedFilters: FallbackFilterInterface;
}
