import { OptionsMenuChannel } from './../ChannelsMenu/props';
import { I18nProps } from './../../../i18n/interface/i18n.interface';
import { FormikProps } from 'formik';
import { ChannelConfig } from '../../../../model/Bot';

export interface TabAppearanceProps extends I18nProps, FormikProps<any> {
    channel: ChannelConfig;
    onChange: Function;
    selectedMenu: OptionsMenuChannel;
    setFile: Function;
}