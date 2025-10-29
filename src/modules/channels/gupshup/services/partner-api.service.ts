import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { EventsService } from '../../../events/events.service';
import { CacheService } from '../../../_core/cache/cache.service';
import * as Sentry from '@sentry/node';
import { TemplateMessage, TemplateVariable } from '../../../template-message/interface/template-message.interface';
import * as handlebars from 'handlebars';
import { Exceptions } from '../../../auth/exceptions';
import { set } from 'lodash';
import { UploadingFile } from './../../../../common/interfaces/uploading-file.interface';
import * as FormData from 'form-data';
import {
    CallbackModes,
    DataSetSubscription,
    DataUpdateSubscription,
    DEFAULT_MODES_V2,
    DEFAULT_MODES_V3,
    ResponseGetAllSubscriptions,
    ResponseSetSubscription,
    ResponseUpdateSubscription,
} from '../interfaces/subscription.interface';

interface AppData {
    token: string;
    appId: string;
}

interface GSContact {
    input: string;
    status: string;
    valid: boolean;
    wa_id: string;
}

export const defaultVariablesTemplate = [
    'agent.name',
    'conversation.iid',
    'conversation.createdAt',
    'user.name',
    'user.phone',
    'client.name',
];

export enum TemplateCategory {
    MARKETING = 'MARKETING',
    UTILITY = 'UTILITY',
    AUTHENTICATION = 'AUTHENTICATION',
}

export enum TemplateLanguage {
    pt_BR = 'pt_BR',
    pt_PT = 'pt_PT',
    en = 'en',
    en_US = 'en_US',
    en_GB = 'en_GB',
    es = 'es',
    es_AR = 'es_AR',
    es_ES = 'es_ES',
    es_MX = 'es_MX',
}

export enum TemplateTypeGupshup {
    TEXT = 'TEXT',
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    DOCUMENT = 'DOCUMENT',
    LOCATION = 'LOCATION',
}

@Injectable()
export class PartnerApiService {
    private gupshupApi: AxiosInstance;
    private partnerEmail: string = process.env.GUPSHUP_PARTNER_EMAIL;
    private partnerPassword: string = process.env.GUPSHUP_PARTNER_PASSWORD;
    private readonly logger = new Logger(PartnerApiService.name);
    constructor(public readonly eventsService: EventsService, private readonly cacheService: CacheService) {
        this.gupshupApi = axios.create({
            baseURL: 'https://partner.gupshup.io/partner',
            maxBodyLength: 100 * 1024 * 1024, // 100MB
            maxContentLength: 100 * 1024 * 1024, // 100MB
        });
    }

    public async getPartnerAppToken(appName: string, forceRestart?: boolean): Promise<AppData> {
        try {
            this.logger.log(`PartnerApiService.getPartnerAppToken: ${appName}`);
            const key = `GS_APP_NAME_PARTNER_TOKEN:${appName}`;

            if (forceRestart) {
                await this.cacheService.remove(key);
            }
            let appData: AppData = await this.cacheService.get(key);
            if (appData && appData.appId && appData.token) {
                return appData;
            }

            const loginResult = await this.gupshupApi.post(
                '/account/login',
                encodeURI(`email=${this.partnerEmail}&password=${this.partnerPassword}`),
            );
            const partnerToken = loginResult.data.token;
            const partnerListResult = await this.gupshupApi.get('account/api/partnerApps', {
                headers: {
                    Connection: 'keep-alive',
                    token: partnerToken,
                },
            });

            const gsApp = partnerListResult.data?.partnerAppsList?.find((app) => {
                return app.name == appName;
            });

            if (!gsApp) {
                throw Exceptions.GUPSHUP_APPNAME_NOT_FOUND;
            }

            const partnerAppTokenResponse = await this.gupshupApi.get(`/app/${gsApp.id}/token`, {
                headers: {
                    Connection: 'keep-alive',
                    token: partnerToken,
                },
            });

            appData = { token: partnerAppTokenResponse.data.token.token, appId: gsApp.id };
            await this.cacheService.set(appData, key, 86400);
            return appData;
        } catch (e) {
            this.logger.error(`PartnerApiService.getPartnerAppToken err: ${e}`);
        }
    }

    private async getContact(appData: AppData, number: string) {
        const validatedNumber = await this.gupshupApi.get(
            `/app/${appData.appId}/contact?contact=${number}&force=true`,
            {
                headers: {
                    Connection: 'keep-alive',
                    Authorization: appData.token,
                },
            },
        );

        const contact = validatedNumber.data.contact?.contacts?.[0];
        return contact;
    }

    onHandleBarsCompileMessage(templateMessage: string, templateVariables: TemplateVariable[]) {
        let templateHandle = handlebars.compile(templateMessage);

        let example_vars = {
            agent: {
                name: 'Frederico',
            },
            conversation: {
                iid: '#1234',
                createdAt: '22/10/2020',
            },
            user: {
                name: 'João',
                phone: '(48)999887766',
            },
            // client: {
            //     name: 'clinica Botdesigner',
            // },
        };
        let template_vars: any = {};

        const variables: { [key: string]: number } = {};
        templateMessage.match(/{{(.*?)}}/g)?.forEach((string, index) => {
            let variable = string.replace(/{{/g, '');
            variable = variable.replace(/}}/g, '');
            const exist = templateVariables?.find((currVar) => currVar.value === variable);
            const isDefault = !!defaultVariablesTemplate.find((curr) => curr === variable);

            if (!variables[variable]) {
                const pos = Object.keys(variables)?.length + 1;
                variables[variable] = pos;
                set(template_vars, variable, '{{' + pos + '}}');

                if (!isDefault && exist) {
                    example_vars[variable] = exist?.sampleValue || 'example';
                }
            }
        });

        let context_message = templateHandle(template_vars);

        const te = handlebars.compile(templateMessage);
        let example_message = te(example_vars);

        return {
            context_message,
            example_message,
        };
    }

    async createTemplate(
        appName: string,
        channelConfigId: string,
        template: TemplateMessage,
        allowTemplateCategoryChange: boolean = true,
        category?: TemplateCategory,
        file?: UploadingFile,
        templateType?: TemplateTypeGupshup,
    ): Promise<any> {
        if (!template?._id) {
            throw Exceptions.TEMPLATE_NOT_EXIST;
        }

        const readAuth = await this.gupshupApi.post(
            '/account/login',
            `email=${this.partnerEmail}&password=${this.partnerPassword}`,
            {
                headers: {
                    'cache-control': 'no-cache',
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            },
        );

        /**
         * Verifica se o app esta com hsm ativado.
         */
        const apps = await this.gupshupApi.get(`/account/api/partnerApps`, {
            headers: {
                Connection: 'keep-alive',
                token: readAuth.data.token,
            },
        });

        const gsApp = apps.data?.partnerAppsList?.find((app) => {
            return app.name == appName;
        });

        if (!gsApp) {
            throw Exceptions.GUPSHUP_APPNAME_NOT_FOUND;
        }

        const writetoken = await this.gupshupApi.get(`/app/${gsApp.id}/token`, {
            headers: {
                Connection: 'keep-alive',
                token: readAuth.data.token,
            },
        });

        const js = {};

        if (file && templateType !== TemplateTypeGupshup.TEXT && templateType !== TemplateTypeGupshup.LOCATION) {
            try {
                const form = new FormData();
                form.append('file', file.buffer, file.originalname);
                form.append('file_type', file.mimetype);

                const result = await this.gupshupApi.post(`/app/${gsApp.id}/upload/media`, form, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: writetoken.data.token.token,
                    },
                });

                const handleId = result?.data?.handleId?.message;

                if (handleId) {
                    js['exampleMedia'] = handleId;
                }
            } catch (err) {
                throw err;
            }
        }

        js['vertical'] = 'start';
        if (template.buttons.length) {
            js['vertical'] = 'BUTTON_CHECK';
            js['buttons'] = JSON.stringify(template.buttons);
        } else if (file) {
            js['vertical'] = 'Ticket update';
        }

        js['category'] = category || TemplateCategory.MARKETING;
        js['templateType'] = templateType || TemplateTypeGupshup.TEXT;
        js['languageCode'] = TemplateLanguage.pt_BR;
        js['enableSample'] = true;
        js['allowTemplateCategoryChange'] = allowTemplateCategoryChange;

        if (template?.footerMessage) {
            js['footer'] = template.footerMessage;
        }

        const { context_message, example_message } = this.onHandleBarsCompileMessage(
            template.message,
            template.variables || [],
        );

        if (context_message?.trim()) {
            js['content'] = context_message;
        }
        if (example_message.trim()) {
            js['example'] = example_message;
        }
        js['elementName'] = String(template._id);

        var prms = new URLSearchParams(js);

        try {
            const post = await this.gupshupApi.post(`/app/${gsApp.id}/templates`, prms.toString(), {
                headers: {
                    Connection: 'keep-alive',
                    token: writetoken.data.token.token,
                },
            });

            return { ...post.data, appName: appName, channelConfigId: channelConfigId };
        } catch (err) {
            Sentry.captureEvent({
                message: `${PartnerApiService.name}.createTemplate`,
                extra: {
                    error: err,
                },
            });
            if (err?.response?.data) {
                return { ...err.response.data, appName: appName, channelConfigId: channelConfigId };
            } else {
                throw err;
            }
        }
    }

    async deleteTemplate(appName: string, elementName: string): Promise<{ status: string }> {
        const readAuth = await this.gupshupApi.post(
            '/account/login',
            `email=${this.partnerEmail}&password=${this.partnerPassword}`,
            {
                headers: {
                    'cache-control': 'no-cache',
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            },
        );

        /**
         * Verifica se o app esta com hsm ativado.
         */
        const apps = await this.gupshupApi.get(`/account/api/partnerApps`, {
            headers: {
                Connection: 'keep-alive',
                token: readAuth.data.token,
            },
        });

        const gsApp = apps.data?.partnerAppsList?.find((app) => {
            return app.name == appName;
        });

        if (!gsApp) {
            throw Exceptions.GUPSHUP_APPNAME_NOT_FOUND;
        }

        const writetoken = await this.gupshupApi.get(`/app/${gsApp.id}/token`, {
            headers: {
                Connection: 'keep-alive',
                token: readAuth.data.token,
            },
        });

        if (process.env.NODE_ENV !== 'production') {
            console.log('DELETE TEMPLATE GUPSHUP: ', `/app/${gsApp.id}/template/${elementName}`);
            console.log('TOKEN: ', writetoken.data.token.token);
        }
        const post = await this.gupshupApi.delete(`/app/${gsApp.id}/template/${elementName}`, {
            headers: {
                Connection: 'keep-alive',
                token: writetoken.data.token.token,
            },
        });
        if (process.env.NODE_ENV !== 'production') {
            console.log('Status: ', post.status);
        }
        return post.data;
    }

    async updateCallbackUrl(channelConfigId: string, appName: string, callbackUrl: string, version: 2 | 3) {
        const resultSubscriptions = await this.getAllSubscriptions(appName);

        if (resultSubscriptions?.status == 'success') {
            const modes = version === 2 ? DEFAULT_MODES_V2 : DEFAULT_MODES_V3;

            if (!resultSubscriptions?.subscriptions?.length) {
                return await this.setSubscriptionForApp(appName, {
                    modes: modes,
                    tag: `V${version} - ${channelConfigId}`,
                    url: callbackUrl,
                    version,
                    active: true,
                });
            } else {
                const existSubscriptionByVersion = resultSubscriptions.subscriptions.find(
                    (sub) => sub.version == version,
                );

                const otherVersionSubscriptions = resultSubscriptions.subscriptions.filter(
                    (sub) => sub.version !== version,
                );

                for (const otherSub of otherVersionSubscriptions) {
                    if (otherSub.active) {
                        await this.updateSubscriptionForApp(appName, otherSub.id, {
                            ...otherSub,
                            active: false,
                        });
                    }
                }

                if (!existSubscriptionByVersion) {
                    return await this.setSubscriptionForApp(appName, {
                        modes: modes,
                        tag: `V${version} - ${channelConfigId}`,
                        url: callbackUrl,
                        version,
                        active: true,
                    });
                } else {
                    if (!existSubscriptionByVersion?.active) {
                        return await this.updateSubscriptionForApp(appName, existSubscriptionByVersion.id, {
                            ...existSubscriptionByVersion,
                            active: true,
                            url: callbackUrl,
                            tag: `V${version} - ${channelConfigId}`,
                            modes: modes,
                        });
                    } else {
                        return await this.updateSubscriptionForApp(appName, existSubscriptionByVersion.id, {
                            ...existSubscriptionByVersion,
                            url: callbackUrl,
                            modes: modes,
                            tag: `V${version} - ${channelConfigId}`,
                        });
                    }
                }
            }
        }

        return null;
    }

    async getAllSubscriptions(appName: string): Promise<ResponseGetAllSubscriptions> {
        const { appId, token } = await this.getPartnerAppToken(appName);

        const result = await this.gupshupApi
            .get(`/app/${appId}/subscription`, {
                headers: {
                    Connection: 'keep-alive',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: token,
                },
            })
            .catch((error) => {
                Sentry.captureEvent({
                    message: 'Error PartnerApiService.getAllSubscriptions',
                    extra: {
                        error: error,
                        appName,
                    },
                });
                return error;
            });

        return result?.data;
    }

    async setSubscriptionForApp(appName: string, data: DataSetSubscription): Promise<ResponseSetSubscription> {
        const { appId, token } = await this.getPartnerAppToken(appName);

        const body: any = { ...data, showOnUI: true };

        var prms = new URLSearchParams(body);

        const result = await this.gupshupApi
            .post(`/app/${appId}/subscription`, prms.toString(), {
                headers: {
                    Connection: 'keep-alive',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: token,
                },
            })
            .catch((error) => {
                Sentry.captureEvent({
                    message: 'Error PartnerApiService.setSubscriptionForApp',
                    extra: {
                        error: error,
                        appName,
                    },
                });
                return error;
            });

        return result;
    }

    async updateSubscriptionForApp(
        appName: string,
        subscriptionId: string,
        data: DataUpdateSubscription,
    ): Promise<ResponseUpdateSubscription> {
        const { appId, token } = await this.getPartnerAppToken(appName);

        const body: any = { ...data, showOnUI: true };

        var prms = new URLSearchParams(body);

        const result = await this.gupshupApi
            .put(`/app/${appId}/subscription/${subscriptionId}`, prms.toString(), {
                headers: {
                    Connection: 'keep-alive',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: token,
                },
            })
            .catch((error) => {
                Sentry.captureEvent({
                    message: 'Error PartnerApiService.updateSubscriptionForApp',
                    extra: {
                        error: error,
                        appName,
                    },
                });
                return error;
            });

        return result;
    }

    async deleteSubscriptionByIdForApp(appName: string, subscriptionId: string): Promise<ResponseUpdateSubscription> {
        const { appId, token } = await this.getPartnerAppToken(appName);

        const result = await this.gupshupApi
            .delete(`/app/${appId}/subscription/${subscriptionId}`, {
                headers: {
                    Connection: 'keep-alive',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: token,
                },
            })
            .catch((error) => {
                Sentry.captureEvent({
                    message: 'Error PartnerApiService.updateSubscriptionForApp',
                    extra: {
                        error: error,
                        appName,
                    },
                });
                return error;
            });

        return result;
    }

    async updateWebhookOptions(appName: string) {
        const readAuth = await this.gupshupApi.post(
            '/account/login',
            `email=${this.partnerEmail}&password=${this.partnerPassword}`,
            {
                headers: {
                    'cache-control': 'no-cache',
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            },
        );

        const apps = await this.gupshupApi.get(`/account/api/partnerApps`, {
            headers: {
                Connection: 'keep-alive',
                token: readAuth.data.token,
            },
        });

        const gsApp = apps.data?.partnerAppsList?.find((app) => {
            return app.name == appName;
        });

        if (!gsApp) {
            throw Exceptions.GUPSHUP_APPNAME_NOT_FOUND;
        }

        const writetoken = await this.gupshupApi.get(`/app/${gsApp.id}/token`, {
            headers: {
                Connection: 'keep-alive',
                token: readAuth.data.token,
            },
        });

        const post = await this.gupshupApi
            .put(`/app/${gsApp.id}/callback/mode`, 'modes=READ,DELIVERED,SENT,OTHERS,TEMPLATE,ACCOUNT', {
                headers: {
                    Connection: 'keep-alive',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    token: writetoken.data.token.token,
                },
            })
            .catch((error) => {
                Sentry.captureEvent({
                    message: 'Error PartnerApiService.updateWebhookOptions',
                    extra: {
                        error: error,
                        appName,
                    },
                });
                return error;
            });

        return post;
    }

    async updateEnableTemplate(appName: string, enableTemplate: boolean) {
        const readAuth = await this.gupshupApi.post(
            '/account/login',
            `email=${this.partnerEmail}&password=${this.partnerPassword}`,
            {
                headers: {
                    'cache-control': 'no-cache',
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            },
        );

        const apps = await this.gupshupApi.get(`/account/api/partnerApps`, {
            headers: {
                Connection: 'keep-alive',
                token: readAuth.data.token,
            },
        });

        const gsApp = apps.data?.partnerAppsList?.find((app) => {
            return app.name == appName;
        });

        if (!gsApp) {
            throw Exceptions.GUPSHUP_APPNAME_NOT_FOUND;
        }

        const writetoken = await this.gupshupApi.get(`/app/${gsApp.id}/token`, {
            headers: {
                Connection: 'keep-alive',
                token: readAuth.data.token,
            },
        });

        const body = {};
        body['isHSMEnabled'] = enableTemplate;

        var prms = new URLSearchParams(body);

        const result = await this.gupshupApi
            .put(`/app/${gsApp.id}/appPreference`, prms.toString(), {
                headers: {
                    Connection: 'keep-alive',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    token: writetoken.data.token.token,
                },
            })
            .catch((error) => {
                Sentry.captureEvent({
                    message: 'Error PartnerApiService.updateEnableTemplate',
                    extra: {
                        error: error,
                        appName,
                    },
                });
                return error;
            });

        return result;
    }

    async updateEnableOptinMessage(appName: string, enable: boolean) {
        const readAuth = await this.gupshupApi.post(
            '/account/login',
            `email=${this.partnerEmail}&password=${this.partnerPassword}`,
            {
                headers: {
                    'cache-control': 'no-cache',
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            },
        );

        const apps = await this.gupshupApi.get(`/account/api/partnerApps`, {
            headers: {
                Connection: 'keep-alive',
                token: readAuth.data.token,
            },
        });

        const gsApp = apps.data?.partnerAppsList?.find((app) => {
            return app.name == appName;
        });

        if (!gsApp) {
            throw Exceptions.GUPSHUP_APPNAME_NOT_FOUND;
        }

        const writetoken = await this.gupshupApi.get(`/app/${gsApp.id}/token`, {
            headers: {
                Connection: 'keep-alive',
                token: readAuth.data.token,
            },
        });

        const body = {};
        if (enable) {
            body['enableOptinMessage'] = 'False';
        } else {
            body['enableOptinMessage'] = 'True';
        }

        var prms = new URLSearchParams(body);

        const result = await this.gupshupApi
            .put(`/app/${gsApp.id}/optinMessagePreference`, prms.toString(), {
                headers: {
                    Connection: 'keep-alive',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    token: writetoken.data.token.token,
                },
            })
            .catch((error) => {
                Sentry.captureEvent({
                    message: 'Error PartnerApiService.updateEnableOptinMessage',
                    extra: {
                        error: error,
                        appName,
                    },
                });
                return error;
            });

        return result;
    }

    async listTemplate(appName: string): Promise<any[]> {
        const readAuth = await this.gupshupApi.post(
            '/account/login',
            `email=${this.partnerEmail}&password=${this.partnerPassword}`,
            {
                headers: {
                    'cache-control': 'no-cache',
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            },
        );

        const apps = await this.gupshupApi.get(`/account/api/partnerApps`, {
            headers: {
                Connection: 'keep-alive',
                token: readAuth.data.token,
            },
        });

        const gsApp = apps.data?.partnerAppsList?.find((app) => {
            return app.name == appName;
        });

        if (!gsApp) {
            throw Exceptions.GUPSHUP_APPNAME_NOT_FOUND;
        }

        const writetoken = await this.gupshupApi.get(`/app/${gsApp.id}/token`, {
            headers: {
                Connection: 'keep-alive',
                token: readAuth.data.token,
            },
        });

        const list = await this.gupshupApi.get(`/app/${gsApp.id}/templates`, {
            headers: {
                Connection: 'keep-alive',
                token: writetoken.data.token.token,
            },
        });

        return list?.data?.templates || [];
    }
}
