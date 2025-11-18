export interface DefaultFiltersEntities {
  appointmentTypeCode?: string;
  doctorCode?: string;
  insuranceCode?: string;
  insurancePlanCode?: string;
  insuranceSubPlanCode?: string;
  occupationAreaCode?: string;
  organizationUnitCode?: string;
  organizationUnitLocationCode?: string;
  planCategoryCode?: string;
  procedureCode?: string;
  specialityCode?: string;
  typeOfServiceCode?: string;
}

export interface ListAppointmentType extends DefaultFiltersEntities {}

export interface ListDoctor extends DefaultFiltersEntities {}

export interface ListInsurance extends DefaultFiltersEntities {}

export interface ListInsurancePlan extends DefaultFiltersEntities {}

export interface ListInsuranceSubPlan extends DefaultFiltersEntities {}

export interface ListOccupationArea extends DefaultFiltersEntities {}

export interface ListOrganizationUnit extends DefaultFiltersEntities {}

export interface ListOrganizationUnitLocation extends DefaultFiltersEntities {}

export interface ListPlanCategory extends DefaultFiltersEntities {}

export interface ListProcedure extends DefaultFiltersEntities {}

export interface ListSpeciality extends DefaultFiltersEntities {}

export interface ListTypeOfService extends DefaultFiltersEntities {}
