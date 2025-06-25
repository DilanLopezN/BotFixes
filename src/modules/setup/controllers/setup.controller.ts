import { Body, Controller, Param, Post } from "@nestjs/common";
import { NumberPipe } from "./../../../common/pipes/number.pipe";
import { CreateInitialSetup } from "../interfaces/create-initial-setup.interface";
import { CreateSetupSetting } from "../interfaces/create-setup-setting.interface";
import { SetupSettingService } from "../services/setup-setting.service";
import { SetupService } from "../services/setup.service";

@Controller('setup')
export class SetupController {

    constructor(
        private readonly setupService: SetupService,
        private readonly setupSetting: SetupSettingService,
    ){}

    @Post('/setup-settings')
    async createSetupStep(
        @Body() body: CreateSetupSetting,
    ) {
        return await this.setupSetting.createSetupSetting(body);
    }

    @Post('/initial-setup')
    async createInitialSetup(
        @Body() body: CreateInitialSetup,
    ) {
        return await this.setupService.createInitialSetup(body);
    }
}