import { SendEmailDto } from '../dto/send-email.dto';

export interface EmailCreatedMessage extends SendEmailDto {
    workspaceId: string;
}
