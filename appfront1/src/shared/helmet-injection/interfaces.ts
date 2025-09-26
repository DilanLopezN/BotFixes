import { User } from 'kissbot-core';

export interface HelmetInjectionProps {
    cxExternalId?: string;
    cxExternalEmail?: string;
    loggedUser?: User;
    workspaceId?: string;
}
