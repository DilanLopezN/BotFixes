export enum FlowStatusEnum {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    DEPRECATED = 'DEPRECATED',
    BLOCKED = 'BLOCKED',
    THROTTLED = 'THROTTLED',
}

export interface FlowVariable {
    name: string;
    value: string;
    description: string;
}
