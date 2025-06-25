import { OrganizationSettingsDto } from './dto/organization-settings.dto';
import { InjectModel } from '@nestjs/mongoose';
import { MongooseAbstractionService } from './../../common/abstractions/mongooseAbstractionService.service';
import { Injectable } from '@nestjs/common';
import { OrganizationSettings } from './interfaces/organization-settings.interface';
import { Model } from 'mongoose';
import { CatchError } from '../auth/exceptions';
import { castObjectIdToString } from '../../common/utils/utils';

@Injectable()
export class OrganizationSettingsService extends MongooseAbstractionService<OrganizationSettings>{
  constructor(
    @InjectModel('OrganizationSettings') protected readonly model: Model<OrganizationSettings>,
  ) {
    super(model);
  }

  getSearchFilter(search: string): any { }
  getEventsData() { }

  async _create(organizationDto: OrganizationSettingsDto)
    : Promise<OrganizationSettings> {
    return await this.create(organizationDto);
  }

  async _update(organizationSettingsDto: OrganizationSettingsDto, host: string)
    : Promise<OrganizationSettings> {
    const settings: OrganizationSettings = await this.model.findOne({ organizationId: 'default' });

    Object.assign(settings, organizationSettingsDto);
    return await this.update(castObjectIdToString(settings._id), settings);
  }

  async getSettings(host: string)
    : Promise<OrganizationSettings> {
    const settings = await this.model.findOne({ organizationId: host });
    if (!settings) {
      return await this.model.findOne({ organizationId: 'default',  deletedAt: undefined });
    }
    return settings;
  }

  async getAllSettings() {
    return await this.model.find({
      deletedAt: undefined,
    });
  }
}