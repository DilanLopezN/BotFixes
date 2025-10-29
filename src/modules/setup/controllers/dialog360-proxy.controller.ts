import { Body, Controller, Post, HttpException, HttpStatus, Logger } from '@nestjs/common';
import axios from 'axios';
import * as Sentry from '@sentry/node';
import { Dialog360WebhookDto } from '../dto/dialog360-webhook.dto';

@Controller('setup/dialog360')
export class Dialog360ProxyController {
    private readonly logger = new Logger(Dialog360ProxyController.name);

    @Post('/partner-data')
    async setPartnerData(@Body() body: Dialog360WebhookDto) {
        this.logger.log(`Dialog360 Partner API INCOMING: - ${JSON.stringify(body)}`);
        Sentry.captureEvent({
            message: `${Dialog360ProxyController.name}.setPartnerData BODY ENTRY`,
            extra: {
                body,
            },
        });
        try {
            const {
                DIALOG360_PARTNER_API_URL,
                DIALOG360_PARTNER_API_KEY,
                DIALOG360_PARTNER_ID,
                DIALOG360_PARTNER_SOLUTION_ID,
                DIALOG360_PARTNER_CLIENT_ID,
                DIALOG360_PARTNER_TIER = 'regular',
            } = process.env;

            if (
                !DIALOG360_PARTNER_API_URL ||
                !DIALOG360_PARTNER_API_KEY ||
                !DIALOG360_PARTNER_ID ||
                !DIALOG360_PARTNER_SOLUTION_ID ||
                !DIALOG360_PARTNER_CLIENT_ID
            ) {
                const error = new HttpException(
                    'Missing required Dialog360 Partner API environment variables',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );

                Sentry.captureEvent({
                    message: `${Dialog360ProxyController.name}.setPartnerData`,
                    extra: {
                        body,
                    },
                });

                throw error;
            }

            const dialog360Payload = {
                solution_id: DIALOG360_PARTNER_SOLUTION_ID,
                waba_external_id: body.data.waba_id,
                waba_business_id: body.data.business_id,
                client_id: DIALOG360_PARTNER_CLIENT_ID,
                tier: DIALOG360_PARTNER_TIER,
            };
            Sentry.captureEvent({
                message: `${Dialog360ProxyController.name}.setPartnerData 1`,
                extra: {
                    dialog360Payload,
                },
            });
            const response = await axios.post(
                `${DIALOG360_PARTNER_API_URL}/api/v2/partners/${DIALOG360_PARTNER_ID}/account_sharing/numbers`,
                dialog360Payload,
                {
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'x-api-key': DIALOG360_PARTNER_API_KEY,
                    },
                },
            );

            Sentry.captureEvent({
                message: `${Dialog360ProxyController.name}.setPartnerData 2`,
                extra: {
                    data: response.data,
                },
            });
            return {
                success: true,
                message: 'Partner data sent to Dialog360 successfully',
                data: response.data,
            };
        } catch (error) {
            Sentry.captureEvent({
                message: `${Dialog360ProxyController.name}.setPartnerData catch 1`,
                extra: {
                    body,
                    error,
                },
            });

            if (axios.isAxiosError(error)) {
                const status = error.response?.status || HttpStatus.BAD_GATEWAY;
                const message = error.response?.data || error.message;

                this.logger.error(`Dialog360 Partner API error: ${status} - ${JSON.stringify(message)}`);

                Sentry.captureEvent({
                    message: `${Dialog360ProxyController.name}.setPartnerData catch 2`,
                    extra: {
                        body,
                        response_status: status,
                        response_data: message,
                        error,
                    },
                });

                throw new HttpException(`Dialog360 Partner API error: ${status}`, HttpStatus.BAD_GATEWAY);
            }

            Sentry.captureException(error, {
                tags: {
                    service: 'dialog360-proxy',
                    error_type: 'internal_error',
                    waba_id: body.data.waba_id,
                },
                extra: { payload: body },
            });

            throw new HttpException(
                'Internal server error while processing Dialog360 Partner webhook',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
