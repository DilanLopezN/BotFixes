import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { omit } from 'lodash';
import { Model, Types } from 'mongoose';
import { TeamHistory } from '../interfaces/team.history';
import { Team } from '../interfaces/team.interface';

@Injectable()
export class TeamHistoryService {
    constructor(@InjectModel('TeamHistory') protected readonly model: Model<TeamHistory>) {}

    public getModel() {
        return this.model;
    }

    public async create(whoUserId: string, team: Team) {
        const oldTeam = omit(team?.toJSON?.({minimize: false}) ?? team, ['updatedBy', 'createdAt']) as TeamHistory;

        return await this.model.create({
            ...oldTeam,
            teamId: team._id,
            updatedByUserId: whoUserId,
            _id: new Types.ObjectId(),
        });
    }
}
