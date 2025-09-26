import { doRequest, apiInstance } from '../../../utils/Http';

// A API pode retornar diferentes formatos, então precisamos lidar com ambos os casos
export interface InsightsResponse {
    data: { 
        insight?: string;
        insights?: string; 
    };
}

export interface TemplateMessage {
    message: string;
    buttons?: Array<{
        type: string;
        text: string;
        url?: string;
    }>;
}

export interface TemplateSuggestionsResponse {
    data: {
        messages?: TemplateMessage[];
        suggestions?: string[];
        remove?: string[];
    };
}

export const TemplateSuggestionsService = {
    getTemplateMessageMarketingInsights: async (
        workspaceId: string, 
        message: string, 
        errCb?
    ): Promise<InsightsResponse> => {
        return await doRequest(
            apiInstance.post(
                `/workspaces/${workspaceId}/suggestions/getTemplateMessageMarketingInsights`,
                { data: { message } }
            ),
            undefined,
            errCb
        );
    },

    getTemplateMessageSuggestions: async (
        workspaceId: string, 
        message: string, 
        errCb?
    ): Promise<TemplateSuggestionsResponse> => {
        return await doRequest(
            apiInstance.post(
                `/workspaces/${workspaceId}/suggestions/getTemplateMessageSuggestions`,
                { data: { message } }
            ),
            undefined,
            errCb
        );
    },
};