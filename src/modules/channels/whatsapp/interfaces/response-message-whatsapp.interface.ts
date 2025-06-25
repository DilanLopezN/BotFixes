export interface ResponseMessageWhatsapp {
    msg_id: string;
    contact: {
        input: string; // DESTINATION_PHONE_NO
        wa_id: string; // DESTINATION_PHONE_NO
    };
}

export interface ResponseCreateFlow {
    result?: {
        id: string;
    };
    success: boolean;
    error?: any;
}

export interface ResponseUpdateFlowJSON extends ResponseDefault {}

export interface ResponseDefault {
    result?: any;
    success: boolean;
    error?: any;
}

export interface ResponseGetPreviewFlowUrl {
    preview: FlowPreview;
    id: string;
}

export interface ResponseFlow {
    id: string;
    name: string;
    categories: string[];
    preview: FlowPreview;
    status: 'DRAFT' | 'PUBLISHED';
    validation_errors: any[];
    json_version: string;
    data_api_version: string;
    data_channel_uri: string;
    health_status: any;
    whatsapp_business_account: any;
    application: any;
}

export interface ResponseFlowJSON {
    data: [
        {
            name: string;
            asset_type: 'FLOW_JSON';
            download_url: string;
        },
    ];
    paging: any;
}

interface FlowPreview {
    preview_url: string;
    expires_at: string;
}
