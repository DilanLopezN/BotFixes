import { ChannelTypes } from './channel'

export interface User {
    _id: string;
    id?: string;
    name: String;
    avatar?: string;
    type?: string;
    channelId: ChannelTypes;
    email?: string;
    phone?: string;
    streamUrl?: any;
}