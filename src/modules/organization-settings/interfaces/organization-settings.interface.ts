import { Document } from 'mongoose';

export interface OrganizationSettings extends Document {
    organizationId: string;
    extensions: [OrganizationExtensions];
    layout: LayoutSettings;
    responses: any[];
    scripts: Scripts[];
    styles: Styles[];
    helpCenter: HelpCenter;
}

export interface Scripts {
    data: string;
    type: ScriptType;
}

export interface Styles {
    path: string;
}

interface Logo {
    transparent: string;
    original: string;
}

export interface LayoutSettings {
    logo: Logo;
    color: string;
    title: string;
}

export interface OrganizationExtensions {
    extension: Extensions;
    enable: boolean;
}

export enum Extensions {
    'dashboard' = 'dashboard',
    'transboard' = 'transboard',
    'user' = 'user',
    'integrations' = 'integrations',
    'entities' = 'entities',
    'workspace' = 'workspace',
    'live-agent' = 'live-agent',
    'settings' = 'settings',
}

export enum ScriptType {
    'external' = 'external',
    'inline' = 'inline',
}

export const defaultExtensions = [
    {
        extension: 'workspace',
        enable: true,
    },
    {
        extension: 'dashboard',
        enable: true,
    },
    {
        extension: 'entities',
        enable: true,
    },
    {
        extension: 'integrations',
        enable: true,
    },
    {
        extension: 'live-agent',
        enable: false,
    },
    {
        extension: 'user',
        enable: true,
    },
];

export interface HelpCenter {
    url: string;
    articles: { [key: string]: string };
}
