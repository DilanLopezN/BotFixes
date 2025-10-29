export interface CreateContactProps {
    onCreate: (args: any) => any;
    onClose: Function;
    initial: any;
    workspaceId: string;
    notification: Function;
    onContactSelected: Function;
    onContactInfo: Function;
}
