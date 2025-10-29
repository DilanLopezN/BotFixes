import { I18nProps } from '../../../../../../i18n/interface/i18n.interface';
import { Identity } from '../../../../../interfaces/conversation.interface';

export interface MemberListViewProps extends I18nProps {
    membersFiltered: Identity[];
    conversationState: string;
    memberStatus: (member: Identity) => { status: string };
    children: React.ReactNode;
    adminRemoveMember: (memberId: string) => Promise<void>;
    isPermissionToRemove: boolean;
    loading: boolean;
}
