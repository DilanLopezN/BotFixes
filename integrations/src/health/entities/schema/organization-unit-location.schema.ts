import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IOrganizationUnitLocationEntity } from '../../interfaces/entity.interface';
import { defaultIndex } from './default-indexes';
import { Entity } from './entity.schema';

export type OrganizationUnitLocationEntityDocument = OrganizationUnitLocationEntity & Document;

@Schema({ collection: 'health_organization_unit_location', versionKey: false, autoIndex: true })
export class OrganizationUnitLocationEntity extends Entity implements IOrganizationUnitLocationEntity {}

export const OrganizationUnitLocationEntitySchema =
  SchemaFactory.createForClass<OrganizationUnitLocationEntity>(OrganizationUnitLocationEntity);

OrganizationUnitLocationEntitySchema.index(defaultIndex);
