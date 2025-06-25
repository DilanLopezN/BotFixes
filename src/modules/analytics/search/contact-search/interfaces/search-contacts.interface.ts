export interface SearchContacts {
    workspaceId: string;
    term?: string;
    skip: number;
    limit: number;
    blocked?: boolean;
}
