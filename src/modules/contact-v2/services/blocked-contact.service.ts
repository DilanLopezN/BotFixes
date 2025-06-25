import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CONTACT_CONNECTION } from '../ormconfig';
import { BlockedContactEntity } from '../entities/blocked-contact.entity';
import { convertPhoneNumber } from 'kissbot-core';
import * as moment from 'moment';
import { castObjectIdToString } from '../../../common/utils/utils';

@Injectable()
export class BlockedContactService {
    constructor(
        @InjectRepository(BlockedContactEntity, CONTACT_CONNECTION)
        private readonly repository: Repository<BlockedContactEntity>,
    ) {}

    public async getBlockedContactByWhatsapp(workspaceId: string, phone: string): Promise<BlockedContactEntity> {
        workspaceId = castObjectIdToString(workspaceId);

        if (!phone?.length) {
            return undefined;
        }

        const parsedNumber = convertPhoneNumber(phone);
        const parsedNumber2 = parsedNumber
            .split('')
            .filter((_, index) => index !== 4)
            .join('');

        const phonesToValidate: string[] = [parsedNumber, parsedNumber2, phone];

        const whereOptions = [...new Set(phonesToValidate)].map((phoneVar) => ({
            whatsapp: phoneVar,
            workspaceId,
        }));

        return await this.repository.findOne({ where: whereOptions });
    }

    public async getBlockedContactByContactId(contactId: string, workspaceId: string): Promise<BlockedContactEntity> {
        contactId = castObjectIdToString(contactId);
        workspaceId = castObjectIdToString(workspaceId);

        return await this.repository.findOne({
            where: {
                workspaceId,
                contactId,
            },
        });
    }

    public async createBlockedContact(
        workspaceId: string,
        data: Partial<BlockedContactEntity>,
    ): Promise<BlockedContactEntity> {
        workspaceId = castObjectIdToString(workspaceId);

        const blockedContact = this.repository.create({
            ...data,
            blockedAt: moment().valueOf(),
            workspaceId,
        });

        return await this.repository.save(blockedContact);
    }

    public async delete(workspaceId: string, blockedContactId: string) {
        workspaceId = castObjectIdToString(workspaceId);
        blockedContactId = castObjectIdToString(blockedContactId);

        const result = await this.repository.delete({
            id: blockedContactId,
            workspaceId,
        });

        return result.affected > 0 ? { ok: true } : { ok: false };
    }
}
