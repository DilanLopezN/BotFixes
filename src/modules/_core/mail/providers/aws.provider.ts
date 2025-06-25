import { IMailProvider } from "./mailProviders.interface";
import { Injectable } from "@nestjs/common";
import * as AWS from 'aws-sdk';
@Injectable()
export class AwsProvider implements IMailProvider {
    sendMail(to, from, subject, body) {
        // if(!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY){
        //     return;
        // }
        // AWS.config.update({ 
        //     region: 'us-east-1',
        // });
        // const SES = new AWS.SES({});
        // return SES.sendEmail({
        //     Destination: {
        //         CcAddresses: [],
        //         ToAddresses: [
        //             to
        //         ]
        //     },
        //     Message: {
        //         Body: {
        //             Html: {
        //                 Charset: "UTF-8",
        //                 Data: body
        //             },
        //             Text: {
        //                 Charset: "UTF-8",
        //                 Data: ""
        //             }
        //         },
        //         Subject: {
        //             Charset: 'UTF-8',
        //             Data: subject
        //         }
        //     },
        //     Source: from,
        //     ReplyToAddresses: []
        // }).promise()
    }
}