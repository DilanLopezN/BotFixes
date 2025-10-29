import { User } from "kissbot-core";

export interface TagListProps {
    readingMode: boolean;
    conversation: any;
    onTagsChanged: Function;
    workspaceId: string;
    loggedUser: User;
}