import { Workspace } from '../../../../../../model/Workspace';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';

export interface BillingsProps extends I18nProps {
    menuSelected: any;
    selectedWorkspace: Workspace;
    addNotification: Function;
}