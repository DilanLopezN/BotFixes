import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { AwsProvider } from './providers/aws.provider';

@Module({
    providers: [
        MailService,
        AwsProvider
    ],
    exports: [MailService]
})
export class MailModule { }
