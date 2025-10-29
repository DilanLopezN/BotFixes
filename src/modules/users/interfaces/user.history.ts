import { User } from './user.interface';

export interface UserHistory extends User {
    updatedByUserId: string;
    userId: string;
}
