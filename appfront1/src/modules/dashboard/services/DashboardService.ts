import axios, { AxiosRequestConfig, CancelTokenSource } from 'axios';
import moment from 'moment';
import { Fallback } from '../../../model/Fallback';
import { PaginatedModel } from '../../../model/PaginatedModel';
import { typeDownloadEnum } from '../../../shared/DownloadModal/props';
import { apiInstance, doRequest } from '../../../utils/Http';
import { downloadFile } from '../../../utils/downloadFile';
import { serialize } from '../../../utils/serializeQuery';
import { AppointmentFilterInterface } from '../components/AppointmentFilter/props';
import { ConversationFilterInterface } from '../components/ConversationFilter/props';
import {
    FallbackExportInterface,
    FallbackFilterInterface,
} from '../components/TabFallback/components/FallbackFilter/props';
import {
    ConversationTemplate,
    TemplateGroupInterface,
} from '../components/TabGraphics/interfaces/conversation-template-interface';
import { RatingFilterInterface } from '../components/TabRatings/components/RatingFilter/props';

export type ApiConversationFilter = ConversationFilterInterface & {
    workspaceId: string;
    botId?: string;
};

export type ApiConversationTableFilter = ConversationFilterInterface &
    ApiConversationFilter & {
        groupBy?: string;
        closedBy?: string[];
    };

export type ApiConversationReportFilter = {
    query: ConversationFilterInterface &
        ApiConversationFilter & {
            groupBy?: string;
            closedBy?: string[];
        };
    downloadType: string;
};

export type ApiActivityTableFilter = ApiConversationTableFilter & {
    type?: 'message' | undefined;
};

export const DashboardService = {
    getActivitiesAnalytics: async (
        filter: ApiActivityTableFilter,
        cancelToken?: CancelTokenSource,
        errCb?: (error: any) => any,
        pendingCb?: (isPending: boolean) => any
    ): Promise<any> => {
        if (pendingCb) {
            pendingCb(false);
        }
        const isCanceled = cancelToken?.token.reason instanceof axios.Cancel;

        if (pendingCb && !isCanceled) {
            pendingCb(true);
        }

        const requestConfig: AxiosRequestConfig = {
            cancelToken: cancelToken?.token,
            timeout: 120000,
        };
        const requestPromise = await doRequest(
            apiInstance.post(`workspaces/${filter.workspaceId}/analytics/activities`, filter, requestConfig),
            false,
            errCb
        );

        if (pendingCb) {
            pendingCb(axios.isCancel(requestPromise));
        }

        return requestPromise;
    },
    getConversationsAnalytics: async (
        filter: ApiConversationTableFilter,
        cancelToken?: CancelTokenSource,
        errCb?: (error: any) => any,
        pendingCb?: (isPending: boolean) => any
    ): Promise<any> => {
        if (pendingCb) {
            pendingCb(false);
        }
        const isCanceled = cancelToken?.token.reason instanceof axios.Cancel;

        if (pendingCb && !isCanceled) {
            pendingCb(true);
        }
        const requestConfig: AxiosRequestConfig = {
            timeout: 120000,
            cancelToken: cancelToken?.token,
        };
        const requestPromise = await doRequest(
            apiInstance.post(
                `workspaces/${filter.workspaceId}/analytics/conversations`,
                {
                    ...filter,
                    startDate: moment(filter.startDate).format('YYYY-MM-DDTHH:mm:ss'),
                    endDate: moment(filter.endDate).format('YYYY-MM-DDTHH:mm:ss'),
                },
                requestConfig
            ),
            false,
            errCb
        );
        if (pendingCb) {
            pendingCb(axios.isCancel(requestPromise));
        }

        return requestPromise;
    },
    getConversationsAnalyticsReport: async (
        filter: ApiConversationReportFilter,
        cancelToken?: CancelTokenSource,
        errCb?: (error: any) => any,
        pendingCb?: (isPending: boolean) => any
    ): Promise<any> => {
        if (pendingCb) {
            pendingCb(false);
        }
        const isCanceled = cancelToken?.token.reason instanceof axios.Cancel;

        if (pendingCb && !isCanceled) {
            pendingCb(true);
        }
        const requestConfig: AxiosRequestConfig = {
            timeout: 120000,
            cancelToken: cancelToken?.token,
            responseType: 'blob',
            headers: {
                Accept: 'text/csv',
            },
        };
        const requestPromise = await doRequest(
            apiInstance.post(
                `workspaces/${filter.query.workspaceId}/analytics/conversations/user-resume-avg/exportCSV`,
                {
                    ...filter,
                },
                requestConfig
            ),
            false,
            errCb
        );
        if (pendingCb) {
            pendingCb(axios.isCancel(requestPromise));
        }

        return requestPromise;
    },
    getConversationsResume: async (workspaceId: string, resumeType: string, teamId?: string): Promise<any> => {
        try {
            const teamQueryString = teamId ? `&teamId=${teamId}` : '';
            return (await apiInstance.get(`workspaces/${workspaceId}/conversations?resumeType=${resumeType}${teamQueryString}`)).data;
        } catch (error) {}
    },
    getFallbacksWorkspace: async (
        workspaceId: string,
        skip: number,
        limit: number,
        search?: string,
        sort?: string,
        filter?: FallbackFilterInterface
    ): Promise<PaginatedModel<Fallback>> => {
        const filters: { [key: string]: any } = {
            sort: !!sort ? sort : '-recognizedTimestamp',
            limit: String(limit),
            skip: String(skip),
            filter: {},
        };

        if (!!search) {
            filters.search = search;
        }
        if (!!filter) {
            filters.filter = JSON.stringify(filter);
        }
        const query = serialize(filters);
        return await doRequest(apiInstance.get(`workspaces/${workspaceId}/fallbacks?${query}`));
    },
    getFallback: async (workspaceId: string, fallbackId: string): Promise<any> => {
        return await doRequest(apiInstance.get(`workspaces/${workspaceId}/fallbacks/${fallbackId}`));
    },
    updateFallback: async (workspaceId: string, fallbackId: string, fallback: Fallback): Promise<any> => {
        return await apiInstance.put(`workspaces/${workspaceId}/fallbacks/${fallbackId}`, fallback);
    },
    deleteFallback: async (workspaceId: string, fallbackId: string): Promise<any> => {
        return await doRequest(apiInstance.delete(`workspaces/${workspaceId}/fallbacks/${fallbackId}`));
    },
    getRatings: async (
        workspaceId: string,
        skip: number,
        filter?: RatingFilterInterface,
        cancelToken?: CancelTokenSource,
        errCb?: (error: any) => any,
        pendingCb?: (isPending: boolean) => any
    ): Promise<PaginatedModel<any>> => {
        if (pendingCb) {
            pendingCb(false);
        }
        const isCanceled = cancelToken?.token.reason instanceof axios.Cancel;

        if (pendingCb && !isCanceled) {
            pendingCb(true);
        }
        let filters: { [key: string]: any } = {
            limit: String(10),
            offset: String(skip),
        };

        if (filter) {
            if (filter.timezone) {
                filters.timezone = filter.timezone;
            }

            if (filter.note) {
                filters.value = filter.note;
            }

            if (filter.rangeDate) {
                filters.startDate = moment(filter.rangeDate[0]).startOf('day').format('YYYY-MM-DDTHH:mm:ss');
                filters.endDate = moment(filter.rangeDate[1]).endOf('day').format('YYYY-MM-DDTHH:mm:ss');
            }

            if (filter.tags && filter.tags.length) {
                filters.tags = filter.tags;
            }

            if (filter.teamId) {
                filters.teamId = filter.teamId;
            }

            if (filter.teamIds) {
                filters.teamIds = filter.teamIds;
            }

            if (filter.memberId) {
                filters.memberId = filter.memberId;
            }

            if (filter.feedback) {
                filters.feedback = filter.feedback;
            }
        }
        const requestConfig: AxiosRequestConfig = {
            cancelToken: cancelToken?.token,
        };
        const query = serialize(filters);
        const requestPromise = await doRequest(
            apiInstance.get(`rating/workspaces/${workspaceId}/ratings?${query}`, requestConfig),
            false,
            errCb
        );
        if (pendingCb) {
            pendingCb(axios.isCancel(requestPromise));
        }

        return requestPromise;
    },
    createConversationTemplate: async (workspaceId: string, template: ConversationTemplate): Promise<any> => {
        return await doRequest(
            apiInstance.post(`dashboard-template/workspaces/${workspaceId}/conversation-template`, template)
        );
    },
    getConversationTemplates: async (workspaceId: string, groupId: string): Promise<any> => {
        return await doRequest(
            apiInstance.get(`dashboard-template/workspaces/${workspaceId}/conversation-template?groupId=${groupId}`)
        );
    },
    updateConversationTemplate: async (
        workspaceId: string,
        templateId: string,
        conversationTemplate: ConversationTemplate
    ): Promise<any> => {
        return await apiInstance.put(
            `dashboard-template/workspaces/${workspaceId}/conversation-template/${templateId}`,
            conversationTemplate
        );
    },
    updatePositionConversationTemplates: async (
        workspaceId: string,
        templates: { templates: ConversationTemplate[] }
    ): Promise<any> => {
        return await doRequest(
            apiInstance.post(`dashboard-template/workspaces/${workspaceId}/conversation-template/batch`, templates)
        );
    },
    deleteConversationTemplate: async (workspaceId: string, templateId: string): Promise<any> => {
        return await doRequest(
            apiInstance.delete(`dashboard-template/workspaces/${workspaceId}/conversation-template/${templateId}`)
        );
    },
    createTemplateGroup: async (workspaceId: string, templateGroup: TemplateGroupInterface): Promise<any> => {
        return await doRequest(
            apiInstance.post(`dashboard-template/workspaces/${workspaceId}/template-groups`, templateGroup)
        );
    },
    updateTemplateGroup: async (
        workspaceId: string,
        templateGroupId: string,
        templateGroup: TemplateGroupInterface
    ): Promise<any> => {
        return await apiInstance.put(
            `dashboard-template/workspaces/${workspaceId}/template-groups/${templateGroupId}`,
            templateGroup
        );
    },
    getTemplateGroups: async (workspaceId: string): Promise<any> => {
        return await doRequest(apiInstance.get(`dashboard-template/workspaces/${workspaceId}/template-groups`));
    },
    deleteTemplateGroupById: async (workspaceId: string, templateGroupId: string): Promise<any> => {
        return await doRequest(
            apiInstance.delete(`dashboard-template/workspaces/${workspaceId}/template-groups/${templateGroupId}`)
        );
    },
    getRatingCsv: (workspaceId: string, filter?: RatingFilterInterface) => {
        let filters: { [key: string]: any } = {};

        if (filter) {
            if (filter.timezone) {
                filters.timezone = filter.timezone;
            }

            if (filter.note) {
                filters.value = filter.note;
            }

            if (filter.rangeDate) {
                filters.startDate = moment(filter.rangeDate[0]).startOf('day').format('YYYY-MM-DDTHH:mm:ss');
                filters.endDate = moment(filter.rangeDate[1]).endOf('day').format('YYYY-MM-DDTHH:mm:ss');
            }

            if (filter.tags?.length) {
                filters.tags = filter.tags;
            }

            if (filter.teamId) {
                filters.teamId = filter.teamId;
            }

            if (filter.teamIds) {
                filters.teamIds = filter.teamIds;
            }

            if (filter.memberId) {
                filters.memberId = filter.memberId;
            }

            if (filter.feedback) {
                filters.feedback = filter.feedback;
            }
            if (filter.feedback) {
                filters.feedback = filter.feedback;
            }
            if (filter.downloadType) {
                filters.downloadType = filter.downloadType;
            } else {
                filters.downloadType = typeDownloadEnum.CSV;
            }
        }

        const query = serialize(filters);
        return apiInstance
            .get(`/rating/workspaces/${workspaceId}/ratings/exportCSV?${query}`, { responseType: 'blob' })
            .then((response) => {
                const now = moment().format('DD-MM-YYYY_HH-mm');
                downloadFile(
                    response.data,
                    `relatorio-avaliacao_${now}`,
                    filters.downloadType === typeDownloadEnum.XLSX ? 'xlsx' : 'csv'
                );
            });
    },
    downloadAppointments: async (workspaceId: string, filter: AppointmentFilterInterface): Promise<any> => {
        let filters: { [key: string]: any } = {};

        if (filter.downloadType) {
            filters.downloadType = filter.downloadType;
            delete filter.downloadType;
        } else {
            filters.downloadType = typeDownloadEnum.CSV;
        }
        const query = serialize(filters);
        return await doRequest(
            apiInstance.post(`/HA/workspaces/${workspaceId}/health-analytics/export?${query}`, filter, {
                responseType: 'blob',
            })
        ).then((response) => {
            const now = moment().format('DD-MM-YYYY_HH-mm');
            downloadFile(
                response,
                `relatorio-agendamentos_${now}`,
                filters.downloadType === typeDownloadEnum.XLSX ? 'xlsx' : 'csv'
            );
        });
    },
    getReferralsByWorkspaceId: async (workspaceId: string): Promise<{ source_id: string }[]> => {
        return await doRequest(apiInstance.get(`channels/workspaces/${workspaceId}/referral-list`));
    },
    getFallbackCsv: async (workspaceId: string, filter?: FallbackExportInterface, errCb?: (e) => any) => {
        let filters: { [key: string]: any } = {};
        if (filter) {
            if (filter.rangeDate) {
                filters.startDate = moment(filter.rangeDate[0]).startOf('day').valueOf();
                filters.endDate = moment(filter.rangeDate[1]).endOf('day').valueOf();
            }

            if (filter.downloadType) {
                filters.downloadType = filter.downloadType;
            } else {
                filters.downloadType = typeDownloadEnum.CSV;
            }
        }

        const query = serialize(filters);
        return await doRequest(
            apiInstance
                .get(`/workspaces/${workspaceId}/fallbacks/exportCSV?${query}`, {
                    responseType: 'blob',
                    timeout: 60000,
                })
                .then((response) => {
                    downloadFile(
                        response.data,
                        `relatorio-fallback`,
                        filters.downloadType === typeDownloadEnum.XLSX ? 'xlsx' : 'csv'
                    );
                    return response;
                }),
            true,
            errCb
        );
    },
};
