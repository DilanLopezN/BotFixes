import { User } from "kissbot-core";

export interface UserListCheckProps {
    user: User;
    handleChecked: Function;
    selected: boolean;
}