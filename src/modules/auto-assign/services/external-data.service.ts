import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ContactService } from '../../contact/services/contact.service';
import { IContact } from '../../contact/interface/contact.interface';

@Injectable()
export class ExternalDataService {
    private _contactService: ContactService;

    constructor(private readonly moduleRef: ModuleRef) {}

    private get contactService(): ContactService {
        if (!this._contactService) {
            this._contactService = this.moduleRef.get<ContactService>(ContactService, { strict: false });
        }
        return this._contactService;
    }

    async getContactByPhone(workspaceId: string, phone: string): Promise<IContact> {
        return await this.contactService.getContactByWhatsapp(phone, workspaceId);
    }
}
