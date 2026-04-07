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

export interface ListDoctor extends DefaultFiltersEntities {}

export interface ListInsurance extends DefaultFiltersEntities {}

export interface ListOrganizationUnit extends DefaultFiltersEntities {}
