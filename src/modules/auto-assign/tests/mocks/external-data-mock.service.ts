import { IContact } from '../../../contact/interface/contact.interface';

export class ExternalDataMockService {
    async getContactByPhone(workspaceId: string, phone: string): Promise<IContact | undefined> {
        return undefined;
    }
}
