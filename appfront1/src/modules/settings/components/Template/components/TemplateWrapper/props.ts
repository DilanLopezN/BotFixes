import { Input } from 'antd';
import { User } from 'kissbot-core';

export const { Search } = Input;

export interface TemplateWrapperProps {
    menuSelected: any;
    match: any;
    loggedUser: User;
    workspaceId?: string;
    addNotification: Function;
    history: any;
    location: any;
}
