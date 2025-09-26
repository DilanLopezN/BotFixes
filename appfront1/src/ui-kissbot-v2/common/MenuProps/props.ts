import { PermissionData } from '../../../utils/UserPermission';

export interface MenuList {
    title: string;
    ref: string;
    component: any;
    order?: number;
    roles?: PermissionData[];
    showOnRefPageIs?: string[] | undefined;
    href?: string;
    isAbsolutePath?: boolean;
}

export interface MenuConfig {
    orderBy?: string;
    listPropToCompare: string | number;
}

export interface MenuProps {
    list: MenuList[] | MenuListGroup[];
    itemSelected: any;
    setSelected: Function;
    title: string | any;
    config: MenuConfig;
    customSelector?: any;
}

export interface MenuListGroup {
    title: string;
    list: MenuList[];
}
