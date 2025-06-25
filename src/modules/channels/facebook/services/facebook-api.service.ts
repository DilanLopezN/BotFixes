import { Injectable } from "@nestjs/common";
import axios from 'axios';
import { CatchError } from "./../../../auth/exceptions";

interface OutcomingMessage {
    messaging_type: 'UPDATE' | 'RESPONSE' | 'MESSAGE_TAG',
    recipient: {
        id: string;
    },
    message:{
        text?: string;
        attachment?: {
            type: 'image' | 'video' | 'audio' | 'file', 
            payload:{
                url: string, 
                is_reusable?: boolean,
            }
        }
    }
}

@Injectable()
export class FacebookApiService {

    @CatchError()
    async getProfile(profileId: string, token: string) {
        const r = await axios.get(
            `https://graph.facebook.com/${profileId}?access_token=${token}`
        );
        return r.data;
    }

    @CatchError()
    async sendMessage(payload: OutcomingMessage, token: string) {
        try {
            const r = await axios.post(
                `https://graph.facebook.com/v12.0/me/messages?access_token=${token}`,
                payload
            );
            return r.data;
        } catch (e) {
            console.log('e.response', e.response);
        }
    }
}