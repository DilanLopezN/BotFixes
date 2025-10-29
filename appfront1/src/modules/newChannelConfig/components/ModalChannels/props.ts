import { I18nProps } from './../../../i18n/interface/i18n.interface';
import { ChannelConfig } from '../../../../model/Bot';

export interface ModalChannelsProps extends I18nProps{
    opened: boolean;
    onClose: () => void;
    addNotification: Function;
    channelConfigId: string;
    updateChannel: Function;
    channelList: ChannelConfig[];
    deleteChannelConfig: Function;
    referencePage: string;
}
