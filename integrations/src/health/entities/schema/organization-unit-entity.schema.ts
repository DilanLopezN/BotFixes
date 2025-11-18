import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IOrganizationUnitEntity } from '../../interfaces/entity.interface';
import { defaultIndex } from './default-indexes';
import { Entity } from './entity.schema';

export type OrganizationUnitEntityDocument = OrganizationUnitEntity & Document;

@Schema({ collection: 'health_organization_unit', versionKey: false, autoIndex: true })
export class OrganizationUnitEntity extends Entity implements IOrganizationUnitEntity {}

export const OrganizationUnitEntitySchema =
  SchemaFactory.createForClass<OrganizationUnitEntity>(OrganizationUnitEntity);

OrganizationUnitEntitySchema.index(defaultIndex);
