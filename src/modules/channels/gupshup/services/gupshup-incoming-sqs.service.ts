import { Injectable } from "@nestjs/common";
import { GupshupService } from "./gupshup.service";
import * as AWS from 'aws-sdk';
import { Consumer } from 'sqs-consumer';
import * as https from 'https';
import { GupshupMessage } from "kissbot-core";
import { ReceiveMessageRequest } from "aws-sdk/clients/sqs";
@Injectable()
export class GupshupIncomingSqs {
    constructor (
        private readonly gshpService: GupshupService,
    ) {
        // this.setupConsumer();
    }

    async setupConsumer() {
        const sqs = new AWS.SQS({
            httpOptions: {
                agent: new https.Agent({
                    keepAlive: true
                })
            },
            region: 'sa-east-1',
        })

        const queueUrl = `https://sqs.sa-east-1.amazonaws.com/271541549040/${process.env.NODE_ENV}-gupshup-incoming.fifo`;

        var params : ReceiveMessageRequest = {
            AttributeNames: [
                "SentTimestamp"
            ],
            MaxNumberOfMessages: 1,
            MessageAttributeNames: [
               "All"
            ],
            QueueUrl: queueUrl,
            VisibilityTimeout: 20,
            WaitTimeSeconds: 2
        };

        while (true) {
            const response = await sqs.receiveMessage(params).promise();
            if (response.Messages) {
                for (const msg of response.Messages) {
                    const payload = JSON.parse(msg.Body);
                    // if (payload.body?.payload?.payload?.text) {
                    //     console.log('payload.body?.payload?.payload?.text', payload.body?.payload?.payload?.text)
                    // }
                    await this.gshpService.handleWhatsappMessage(payload.body, payload.channelConfigId);
                    var deleteParams = {
                        QueueUrl: queueUrl,
                        ReceiptHandle: msg.ReceiptHandle,
                    };
                    await sqs.deleteMessage(deleteParams).promise();
                }
            }
        }
    }

}
