import { ObjectId } from "mongoose";

export interface SimplifiedTeam {
    _id: string;
    name: string;
    users: {
        _id: ObjectId;
        name: string;
        avatar: string;
    }[];
    usersCount: number;
    inactivedAt?: Date;
}
