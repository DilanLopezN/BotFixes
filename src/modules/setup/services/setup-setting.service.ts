import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CatchError } from "./../../auth/exceptions";
import { Repository } from "typeorm";
import { CreateSetupSetting } from "../interfaces/create-setup-setting.interface";
import { SetupSetting } from "../models/setup-setting.entity";
import { STARTER_CONNECTION } from "../ormconfig";

@Injectable()
export class SetupSettingService {
    constructor (
        @InjectRepository(SetupSetting, STARTER_CONNECTION)
        private setupSettingRepository: Repository<SetupSetting>,
    ){}

    @CatchError()
    async createSetupSetting(data: CreateSetupSetting){
        return await this.setupSettingRepository.insert({
            workspaceName: data.workspaceName
        });
    }

    @CatchError()
    async getSetupSettingById(setupId: number){
        return await this.setupSettingRepository.findOne(setupId);
    }

    @CatchError()
    async updateInitialSetupSetting(setupId: number, setup: Partial<SetupSetting>){
        return await this.setupSettingRepository.update(setupId, {
            accountCreated: setup.accountCreated,
            billingSpecificationCreated: setup.billingSpecificationCreated,
            workspaceCreated: setup.workspaceCreated,
        });
    }
}
