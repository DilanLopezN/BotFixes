import { RoleData, RoleDataType } from './../../modules/users/decorators/roles.decorator';
import { UserRoles, PermissionResources } from './../../modules/users/interfaces/user.interface';
import * as moment from 'moment-timezone';
import { getNumberWith9 } from 'kissbot-core';
import { Request } from 'express';
import * as reqIp from 'request-ip';
import { Types, isValidObjectId } from 'mongoose';
import 'moment-duration-format';

export const castObjectId = (stringId) => {
    if (typeof stringId === 'string' && isValidObjectId(stringId)) return new Types.ObjectId(stringId);
    return stringId;
};

export const castObjectIdToString = (id: string | Types.ObjectId | unknown): string => {
    if (typeof id === 'string') {
        return id;
    }

    return id?.toString?.() || (id as unknown as string);
};

export const castStringToBoolean = (value: string): boolean => {
    if (typeof value === 'string') {
        return ['1', 'true'].includes(value);
    }

    return false;
};

export const PredefinedRoles: {
    SYSTEM_ADMIN: RoleData;
    SYSTEM_CS_ADMIN: RoleData;
    SYSTEM_UX_ADMIN: RoleData;
    WORKSPACE_ADMIN: RoleData;
    WORKSPACE_INACTIVE: RoleData;
    USER_ADMIN: RoleData;
    WORKSPACE_AGENT: RoleData;
    WORKSPACE_PENDENT_CONFIG: RoleData;
    SYSTEM_DEV_ADMIN: RoleData;
    DASHBOARD_ADMIN: RoleData;
    SYSTEM_FARMER_ADMIN: RoleData;
    SYSTEM_SUPPORT_ADMIN: RoleData;
} = {
    SYSTEM_ADMIN: {
        role: UserRoles.SYSTEM_ADMIN,
        idLocation: RoleDataType.NONE,
        resource: PermissionResources.ANY,
        resourceIdName: '',
    },
    SYSTEM_CS_ADMIN: {
        role: UserRoles.SYSTEM_CS_ADMIN,
        idLocation: RoleDataType.NONE,
        resource: PermissionResources.ANY,
        resourceIdName: '',
    },
    SYSTEM_UX_ADMIN: {
        role: UserRoles.SYSTEM_UX_ADMIN,
        idLocation: RoleDataType.NONE,
        resource: PermissionResources.ANY,
        resourceIdName: '',
    },
    WORKSPACE_ADMIN: {
        role: UserRoles.WORKSPACE_ADMIN,
        idLocation: RoleDataType.PARAM,
        resource: PermissionResources.WORKSPACE,
        resourceIdName: 'workspaceId',
    },
    WORKSPACE_INACTIVE: {
        role: UserRoles.WORKSPACE_INACTIVE,
        idLocation: RoleDataType.PARAM,
        resource: PermissionResources.WORKSPACE,
        resourceIdName: 'workspaceId',
    },
    WORKSPACE_PENDENT_CONFIG: {
        role: UserRoles.WORKSPACE_PENDENT_CONFIG,
        idLocation: RoleDataType.PARAM,
        resource: PermissionResources.WORKSPACE,
        resourceIdName: 'workspaceId',
    },
    USER_ADMIN: {
        role: UserRoles.USER_ADMIN,
        idLocation: RoleDataType.PARAM,
        resource: PermissionResources.USER,
        resourceIdName: 'userId',
    },
    WORKSPACE_AGENT: {
        role: UserRoles.WORKSPACE_AGENT,
        idLocation: RoleDataType.PARAM,
        resource: PermissionResources.WORKSPACE,
        resourceIdName: 'workspaceId',
    },
    SYSTEM_DEV_ADMIN: {
        role: UserRoles.SYSTEM_DEV_ADMIN,
        idLocation: RoleDataType.NONE,
        resource: PermissionResources.ANY,
        resourceIdName: '',
    },
    DASHBOARD_ADMIN: {
        role: UserRoles.DASHBOARD_ADMIN,
        idLocation: RoleDataType.PARAM,
        resource: PermissionResources.WORKSPACE,
        resourceIdName: 'workspaceId',
    },
    SYSTEM_FARMER_ADMIN: {
        role: UserRoles.SYSTEM_FARMER_ADMIN,
        idLocation: RoleDataType.NONE,
        resource: PermissionResources.ANY,
        resourceIdName: '',
    },
    SYSTEM_SUPPORT_ADMIN: {
        role: UserRoles.SYSTEM_SUPPORT_ADMIN,
        idLocation: RoleDataType.NONE,
        resource: PermissionResources.ANY,
        resourceIdName: '',
    },
};

export function getZeroIfNaN(number: number | undefined) {
    if (number == undefined) return undefined;
    if (isNaN(number)) return 0;
    return number;
}

export const tagSpamName = '@sys.spam';

export function getTime(timeType: 'hour' | 'minute', time: number) {
    if (timeType == 'hour') {
        return time * 3600000;
    }
    return time * 60000;
}

export const formatCpf = (cpf: string) => cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

export const systemMemberId = 'ddcd8974-a3ed-4539-85ce-b4f3cd2d0bae';
export const channelMemberId = 'ddcd8974-a3ed-4539-85ce-b4f3cd2d0bbb';

export const getCompletePhone = (phone: string, ddi: string = '55') => {
    //Tratamento para o brasil
    if(ddi === '55') {
        if (phone.startsWith('0800')) {
            return `${ddi}${phone.slice(1)}`;
        }
        if (phone.startsWith('550800')) {
            return `${ddi}${phone.slice(3)}`;
        }
        // Se é com dd com ou sem 9
        if (phone.length === 11 || phone.length === 10) {
            return `${ddi}${phone}`;
        }
        return phone;
    }
    // Outros países
    return `${ddi}${phone}`
};

// função utilizada para envio ativo para whatsapp
export const getWhatsappPhone = (phone: string, ddi: string = '55') => {
    if(ddi === '55') {
        return getNumberWith9(getCompletePhone(phone, ddi));
    }
    return getCompletePhone(phone, ddi);
};

export const isValidPhone = (phone: string): boolean => {
    // Regex para validar telefones (exemplo: números com 8 a 15 dígitos)
    const phoneRegex = /^\d{8,15}$/;
    return phoneRegex.test(phone);
};

export const isValidEmail = (email: string): boolean => {
    // Regex para validar email (validações conforme o RFC 5322)
    const emailRegex =
        /^(?!\.)"?(?=[^"]*?$)(?![.])(?!.*[.]{2})(?![.]{2})(?!.*\.[.])(?:(?:[a-zA-Z0-9!#$%&'*+=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+=?^_`{|}~-]+)*|\"(?:[^\"]|\\\")*\")@(?:(?!-)[A-Za-z0-9-]{1,63}(?=-)[A-Za-z0-9-]{0,63}|[A-Za-z0-9-]{1,63})\.(?!-)(?:[A-Za-z0-9-]{2,})|(\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\]))$/;
    return emailRegex.test(email);
};

export const remainingToDayEndInSeconds = () => {
    let now = moment().tz('America/Sao_Paulo');
    return Math.round((now.clone().endOf('day').valueOf() - now.clone().valueOf()) / 1000);
};

export const transformArrayIntoPostgresInClause = (values: string[]): string => {
    return values.reduce((total, curr, index) => {
        if (index == 0) {
            return `'${curr}'`;
        }
        return `${total},'${curr}'`;
    }, '');
};

export enum ConvertChannelName {
    api = 'Api',
    campaign = 'Campanha',
    'whatsapp-gupshup' = 'Whatsapp',
    'live-agent' = 'Agente',
    webchat = 'Webchat',
}
export const geIp = (req: Request) => {
    try {
        const xForwardedFor = req.headers['x-forwarded-for'];
        if (xForwardedFor) {
            const ip = xForwardedFor.toString().split(',')[0];
            if (!ip?.startsWith('172.')) {
                return ip;
            }
        }
        return reqIp.getClientIp(req);
    } catch (e) {
        console.error('geIp');
        console.error(e);
    }
};

export const generateDayPeriod = (date: string | Date) => {
    try {
        const currentHour = Number(moment(date).format("HH"));
      
        if (currentHour >= 3 && currentHour < 12){
            return "Manhã";
        } else if (currentHour >= 12 && currentHour < 18){
            return "Tarde";
        } else if (currentHour >= 18 || currentHour < 3){
            return "Noite";
        }
    } catch (e) {
        try {
            console.log('generateDayPeriod', e);
            console.log('generateDayPeriod incoming param', date);
        } catch (e2) {
            console.log('generateDayPeriod catch 2', e2);
        }
    }
}

export const formatDuration = (value: number | string) => {
    return moment.duration(value, 'milliseconds').format('d[d] hh:mm:ss', { forceLength: true, stopTrim: 'h' });
};

export const getUnaccentRegexString = (text: string) => {
    let normalizedText = text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[&/\\#,+()$~%.'":*?<>{}=-@]/g, '')
        .toLowerCase();

    if (
        String(normalizedText)
            .split('')
            .every((char: string) => char === '.')
    ) {
        normalizedText = `[${normalizedText}]`;
    }

    const accentMap: Record<string, string> = {
        a: "[aáãâàä]",
        e: "[eéêèë]",
        i: "[iíîìï]",
        o: "[oóõôòö]",
        u: "[uúûùü]",
        c: "[cç]",
        n: "[nñ]"
    };

    const regexString = normalizedText
        .split("")
        .map(char => accentMap[char.toLowerCase()] || char)
        .join("");
    
    return regexString;
}