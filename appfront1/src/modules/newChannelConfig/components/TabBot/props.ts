import { Workspace } from './../../../../model/Workspace';
import { User } from 'kissbot-core/lib';
import { OptionsMenuChannel } from './../ChannelsMenu/props';
import { I18nProps } from './../../../i18n/interface/i18n.interface';
import { FormikProps } from 'formik';
import { ChannelConfig } from '../../../../model/Bot';

export interface TabBotProps extends I18nProps, FormikProps<any> {
    channel: ChannelConfig;
    onChange: Function;
    selectedMenu: OptionsMenuChannel;
    addNotification: Function;
    loggedUser: User;
    workspaceList: Workspace[];
 }