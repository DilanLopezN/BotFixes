import { BlockedContactModel } from './../schema/blocked-contact.schema';
import { convertPhoneNumber } from 'kissbot-core';
import { InjectModel } from '@nestjs/mongoose';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import * as moment from 'moment';
import { IBlockedContact, BlockedContact } from '../interface/blocked-contact.interface';
import { BlockedContactService as BlockedContactServiceV2 } from '../../contact-v2/services/blocked-contact.service';
import { WorkspacesService } from '../../workspaces/services/workspaces.service';

@Injectable()
export class BlockedContactService {
    private readonly logger = new Logger(BlockedContactService.name);

    constructor(
        @InjectModel('BlockedContact') protected readonly model: Model<BlockedContact>,
        @Inject(forwardRef(() => BlockedContactServiceV2))
        private blockedContactServiceV2: BlockedContactServiceV2,
        private workspaceService: WorkspacesService,
    ) {}

    private async isPostgresEnabled(workspaceId: string): Promise<boolean> {
        const workspace = await this.workspaceService.getModel().findOne({ _id: workspaceId });

        return workspace?.featureFlag?.enableContactV2;
    }

    public async getBlockedContactByWhatsapp(workspaceId: string, phone: string): Promise<IBlockedContact> {
        if (await this.isPostgresEnabled(workspaceId)) {
            return this.blockedContactServiceV2.getBlockedContactByWhatsapp(workspaceId, phone);
        }

        if (!phone?.length) {
            return undefined;
        }

        const parsedNumber = convertPhoneNumber(phone);
        const parsedNumber2 = parsedNumber
            .split('')
            .filter((_, index) => index !== 4)
            .join('');

        const phonesToValidate: string[] = [parsedNumber, parsedNumber2, phone];

        const query: FilterQuery<BlockedContact> = {
            workspaceId,
            $or: [...new Set(phonesToValidate)].map((phone) => ({ whatsapp: phone })),
        };

        return await this.model.findOne(query);
    }

    public async getBlockedContactByContactId(contactId: string, workspaceId: string): Promise<IBlockedContact> {
        if (await this.isPostgresEnabled(workspaceId)) {
            return this.blockedContactServiceV2.getBlockedContactByContactId(contactId, workspaceId);
        }

        const query: FilterQuery<BlockedContact> = {
            workspaceId,
            contactId,
        };

        return await this.model.findOne(query);
    }

    public async createBlockedContact(workspaceId: string, data: Partial<IBlockedContact>) {
        const contactModel = new BlockedContactModel({
            ...data,
            blockedAt: moment().valueOf(),
            workspaceId,
        });

        const createdContact = await this.model.create(contactModel);

        return createdContact;
    }

    public async delete(workspaceId: string, blockedContactId: string) {
        const result = await this.model.deleteOne({
            workspaceId,
            _id: blockedContactId,
        });

        return !!result.deletedCount ? { ok: true } : { ok: false };
    }
}
