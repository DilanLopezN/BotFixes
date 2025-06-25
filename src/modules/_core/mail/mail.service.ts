import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { IMailProvider } from './providers/mailProviders.interface';
import { AwsProvider } from './providers/aws.provider';

@Injectable()
export class MailService {
    private mailProvider: IMailProvider;
    constructor(private moduleRef: ModuleRef) {}

    private setProvider(provider){
        if(provider == "AWS"){
            this.mailProvider = this.moduleRef.get<IMailProvider>(AwsProvider);
        }
    }

    public send(from, to, subject, body, provider) {
        this.setProvider(provider);
        return this.mailProvider.sendMail(to, from, subject, body);
    }
}
