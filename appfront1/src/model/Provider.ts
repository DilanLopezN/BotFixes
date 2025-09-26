export interface Provider {
    name: string;
    title: string;
    icon?: string;
    img?: string;
    integration?: string;
    options: ProviderOptions[];
}

export  interface ProviderOptions {
    name: string;
    responses: ProviderResponse[];
}

export interface ProviderResponse {
    type: string;
    name: string;
    title: string;
    icon: string;
    action: string;
}
