import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment';
import { Document, Model } from 'mongoose';
import { getWithAndWithout9PhoneNumber } from 'kissbot-core';
import { WhatsappSession } from '../interfaces/whatsapp-session.interface';

@Injectable()
export class WhatsappSessionControlService {
    constructor(
        @InjectModel('WhatsappSession') public readonly model: Model<WhatsappSession & Document>,
    ){}

    /**
     * Retorna um booleano indicando se é uma nova sessão ou não baseado no campo whatsappExpiration
     * O numero pode ter tido uma sessão já para workspaceId, originNumber, channelConfigId e então apenas atualizar a sessão
     *   e mesmo assim retornar true, pois se a sessão já existente está expirada então retorna true
     * @param session
     * @returns
     */
    async create(session: WhatsappSession): Promise<boolean> {
        const now = moment().valueOf();
        const latestSession = await this.findSessionByWorkspaceAndNumberAndChannelConfigId(
            session.workspaceId,
            session.originNumber,
            session.channelConfigId,
        )

        let isNewSession: boolean = false

        if (!latestSession || (latestSession && now > latestSession.whatsappExpiration)) {
            isNewSession = true;
        }

        const updated = await this.model.updateOne({
            channelConfigId: session.channelConfigId,
            workspaceId: session.workspaceId,
            originNumber: {
                $in: getWithAndWithout9PhoneNumber(session.originNumber)
            },
        }, {
            whatsappExpiration: session.whatsappExpiration,
        });
        if (updated.modifiedCount == 0) {
            await this.model.create({
                ...session,
                originNumber: session.originNumber,
            });
        }
        return isNewSession;
    }

    async findSessionByWorkspaceAndNumberAndChannelConfigId(workspaceId: string, phoneNumber: string, channelConfigId: string) {
        return await this.model.findOne({
            workspaceId,
            originNumber: {
                $in: getWithAndWithout9PhoneNumber(phoneNumber)
            },
            channelConfigId,
        })
        .sort({whatsappExpiration: 1})
        .exec()
    }
}