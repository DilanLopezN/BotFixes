import { Module } from '@nestjs/common';
import { ModelDefinition, MongooseModule } from '@nestjs/mongoose';
import {
  AppointmentTypeEntity,
  AppointmentTypeEntitySchema,
  DoctorEntity,
  DoctorEntitySchema,
  InsuranceEntity,
  InsuranceEntitySchema,
  InsurancePlanEntity,
  InsurancePlanEntitySchema,
  InsuranceSubPlanEntity,
  InsuranceSubPlanEntitySchema,
  OccupationAreaEntity,
  OccupationAreaEntitySchema,
  OrganizationUnitEntity,
  OrganizationUnitEntitySchema,
  OrganizationUnitLocationEntity,
  OrganizationUnitLocationEntitySchema,
  PlanCategoryEntity,
  PlanCategoryEntitySchema,
  ProcedureEntity,
  ProcedureEntitySchema,
  SpecialityEntity,
  SpecialityEntitySchema,
  TypeOfServiceEntity,
  TypeOfServiceEntitySchema,
  ReasonEntity,
  ReasonEntitySchema,
} from './schema';
import { EntitiesService } from './services/entities.service';

const models: ModelDefinition[] = [
  { name: InsuranceEntity.name, schema: InsuranceEntitySchema },
  { name: AppointmentTypeEntity.name, schema: AppointmentTypeEntitySchema },
  { name: InsurancePlanEntity.name, schema: InsurancePlanEntitySchema },
  { name: InsuranceSubPlanEntity.name, schema: InsuranceSubPlanEntitySchema },
  { name: PlanCategoryEntity.name, schema: PlanCategoryEntitySchema },
  { name: OrganizationUnitEntity.name, schema: OrganizationUnitEntitySchema },
  { name: SpecialityEntity.name, schema: SpecialityEntitySchema },
  { name: ProcedureEntity.name, schema: ProcedureEntitySchema },
  { name: DoctorEntity.name, schema: DoctorEntitySchema },
  { name: OccupationAreaEntity.name, schema: OccupationAreaEntitySchema },
  { name: OrganizationUnitLocationEntity.name, schema: OrganizationUnitLocationEntitySchema },
  { name: TypeOfServiceEntity.name, schema: TypeOfServiceEntitySchema },
  { name: ReasonEntity.name, schema: ReasonEntitySchema },
];

@Module({
  imports: [MongooseModule.forFeature(models)],
  providers: [EntitiesService],
  exports: [EntitiesService],
})
export class EntitiesModule {}
