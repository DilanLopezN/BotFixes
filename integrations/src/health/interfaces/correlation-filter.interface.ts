import {
  AppointmentTypeEntityDocument,
  DoctorEntityDocument,
  InsuranceEntityDocument,
  InsurancePlanEntityDocument,
  OrganizationUnitEntityDocument,
  PlanCategoryEntityDocument,
  InsuranceSubPlanEntityDocument,
  ProcedureEntityDocument,
  OccupationAreaEntityDocument,
  SpecialityEntityDocument,
  OrganizationUnitLocationEntityDocument,
  TypeOfServiceEntityDocument,
} from '../entities/schema';

interface CorrelationFilter {
  speciality?: SpecialityEntityDocument;
  procedure?: ProcedureEntityDocument;
  organizationUnit?: OrganizationUnitEntityDocument;
  insurance?: InsuranceEntityDocument;
  insurancePlan?: InsurancePlanEntityDocument;
  planCategory?: PlanCategoryEntityDocument;
  doctor?: DoctorEntityDocument;
  appointmentType?: AppointmentTypeEntityDocument;
  insuranceSubPlan?: InsuranceSubPlanEntityDocument;
  occupationArea?: OccupationAreaEntityDocument;
  organizationUnitLocation?: OrganizationUnitLocationEntityDocument;
  typeOfService?: TypeOfServiceEntityDocument;
}

type CorrelationFilterByKeyType = string;

interface CorrelationFilterByKey {
  speciality?: CorrelationFilterByKeyType;
  procedure?: CorrelationFilterByKeyType;
  organizationUnit?: CorrelationFilterByKeyType;
  insurance?: CorrelationFilterByKeyType;
  insurancePlan?: CorrelationFilterByKeyType;
  insuranceSubPlan?: CorrelationFilterByKeyType;
  planCategory?: CorrelationFilterByKeyType;
  doctor?: CorrelationFilterByKeyType;
  appointmentType?: CorrelationFilterByKeyType;
  occupationArea?: CorrelationFilterByKeyType;
  organizationUnitLocation?: CorrelationFilterByKeyType;
  typeOfService?: CorrelationFilterByKeyType;
}

interface CorrelationFilterByKeys {
  speciality?: CorrelationFilterByKeyType[];
  procedure?: CorrelationFilterByKeyType[];
  organizationUnit?: CorrelationFilterByKeyType[];
  insurance?: CorrelationFilterByKeyType[];
  insurancePlan?: CorrelationFilterByKeyType[];
  insuranceSubPlan?: CorrelationFilterByKeyType[];
  planCategory?: CorrelationFilterByKeyType[];
  doctor?: CorrelationFilterByKeyType[];
  appointmentType?: CorrelationFilterByKeyType[];
  occupationArea?: CorrelationFilterByKeyType[];
  organizationUnitLocation?: CorrelationFilterByKeyType[];
  typeOfService?: CorrelationFilterByKeyType[];
}

export { CorrelationFilter, CorrelationFilterByKey, CorrelationFilterByKeyType, CorrelationFilterByKeys };
