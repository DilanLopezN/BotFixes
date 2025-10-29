export interface ContactListProps {
    workspaceId: string;
    onContactSelected: (contactId: string) => void;
    onContactInfo: () => void;
    appliedTextFilter: string | undefined;
}
