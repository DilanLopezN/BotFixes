import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ContactService } from '../../contact/services/contact.service';
import { IContact } from '../../contact/interface/contact.interface';

@Injectable()
export class ExternalDataService {
    private contactService: ContactService;

    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.contactService = this.moduleRef.get<ContactService>(ContactService, { strict: false });
    }

    async getContactByPhone(workspaceId: string, phone: string): Promise<IContact> {
        return await this.contactService.getContactByWhatsapp(phone, workspaceId);
    }
}
