import { Body, Controller, Get, Param, Post, Req, Res } from "@nestjs/common";
import { IncomingService } from "./services/incoming.service";

@Controller('channels')
export class FacebookController {

    constructor (
        private readonly incomingService: IncomingService
    ) {}

    @Post('/facebook')
    async post(
        @Body() body: any,
        @Res() res,
    ) {
        console.log(body)
        let VERIFY_TOKEN = '1234';

        // Checks this is an event from a page subscription
        if (body.object === 'page') {

            // Iterates over each entry - there may be multiple if batched
            for (const entry of body.entry) {
                // body.entry.forEach(function(entry) {
                    // Gets the message. entry.messaging is an array, but 
                    // will only ever contain one message, so we get index 0
                let webhook_event = entry.messaging[0];
                webhook_event.type = 'facebook'
                this.incomingService.handleIncomingMessage(webhook_event);
                // });
            }

            // Returns a '200 OK' response to all requests
            res.status(200).send('EVENT_RECEIVED');
        } else {
            // Returns a '404 Not Found' if event is not from a page subscription
            res.sendStatus(404);
        }
    }

    @Post('/instagram')
    async postInstagram(
        @Body() body: any,
        @Res() res,
    ) {

        let VERIFY_TOKEN = '1234';

        // Checks this is an event from a page subscription
        if (body.object === 'instagram') {

            // Iterates over each entry - there may be multiple if batched
            for (const entry of body.entry) {
                // body.entry.forEach(function(entry) {
                    // Gets the message. entry.messaging is an array, but 
                    // will only ever contain one message, so we get index 0
                let webhook_event = entry.messaging[0];
                webhook_event.type = 'instagram'
                this.incomingService.handleIncomingMessage(webhook_event);
                // });
            }

            // Returns a '200 OK' response to all requests
            res.status(200).send('EVENT_RECEIVED');
        } else {
            // Returns a '404 Not Found' if event is not from a page subscription
            res.sendStatus(404);
        }
    }

    @Get('/facebook')
    async get(
        @Body() body: any,
        @Req() req,
        @Res() res,
    ) {
        let VERIFY_TOKEN = '1234';

        // Parse the query params
        let mode = req.query['hub.mode'];
        let token = req.query['hub.verify_token'];
        let challenge = req.query['hub.challenge'];
        // Checks if a token and mode is in the query string of the request
        if (mode && token) {
            // Checks the mode and token sent is correct
            if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                // Responds with the challenge token from the request
                console.log('WEBHOOK_VERIFIED');
                res.status(200).send(challenge);
            } else {
                // Responds with '403 Forbidden' if verify tokens do not match
                res.sendStatus(403);      
            }
        }
    }
    @Get('/instagram')
    async getInstagram(
        @Body() body: any,
        @Req() req,
        @Res() res,
    ) {
        let VERIFY_TOKEN = '1234';

        // Parse the query params
        let mode = req.query['hub.mode'];
        let token = req.query['hub.verify_token'];
        let challenge = req.query['hub.challenge'];
        // Checks if a token and mode is in the query string of the request
        if (mode && token) {
            // Checks the mode and token sent is correct
            if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                // Responds with the challenge token from the request
                console.log('WEBHOOK_VERIFIED');
                res.status(200).send(challenge);
            } else {
                // Responds with '403 Forbidden' if verify tokens do not match
                res.sendStatus(403);      
            }
        }
    }
}