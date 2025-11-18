import { HttpStatus, Injectable } from '@nestjs/common';
import { HTTP_ERROR_THROWER, INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import {
  EntitySourceType,
  EntityType,
  EntityTypes,
  EntityVersionType,
  IDoctorEntity,
  IInsuranceEntity,
  IInsurancePlanEntity,
  IOrganizationUnitEntity,
  IProcedureEntity,
  ISpecialityEntity,
  SpecialityTypes,
} from '../../../interfaces/entity.interface';
import {
  SIAppointmentTypesParamsRequest,
  SIInsuranceParamsRequest,
  SIInsurancePlansParamsRequest,
  SIProceduresGroupParamsRequest,
  SIProceduresParamsRequest,
  SIProfessionalsExamsParamsRequest,
  SIProfessionalsParamsRequest,
  SIProfessionalTypesParamsRequest,
  SISpecialitiesParamsRequest,
} from '../interfaces/base-register.interface';
import * as moment from 'moment';
import { EntitiesService } from '../../../entities/services/entities.service';
import { PatientDataToAuth, SuporteInformaticaApiService } from './suporte-informatica-api.service';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { getExpirationByEntity } from '../../../integration-cache-utils/cache-expirations';
import { CorrelationFilter } from '../../../interfaces/correlation-filter.interface';
import { InitialPatient } from '../../../integrator/interfaces/patient.interface';
import { EntityDocument, ScheduleType } from '../../../entities/schema';
import { ProcedureData, SpecialityData } from '../interfaces/entities';
import { SuporteInformaticaHelpersService } from './suporte-informatica-helpers.service';
import { castObjectId } from '../../../../common/helpers/cast-objectid';
import { SuporteInformaticaResourceFilterData } from '../interfaces/entities.interface';

type RequestParams = { [key: string]: any };

@Injectable()
export class SuporteInformaticaEntitiesService {
  constructor(
    private readonly suporteInformaticaApiService: SuporteInformaticaApiService,
    private readonly entitiesService: EntitiesService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
    private readonly suporteInformaticaHelpersService: SuporteInformaticaHelpersService,
  ) {}

  public getDefaultErpEntityData(
    integration: IntegrationDocument,
  ): Pick<EntityDocument, 'integrationId' | 'source' | 'activeErp' | 'version'> {
    return {
      integrationId: castObjectId(integration._id),
      source: EntitySourceType.erp,
      activeErp: true,
      version: EntityVersionType.production,
    };
  }

  public async listProfessionalTypess(
    integration: IntegrationDocument,
    requestFilters: SIProfessionalTypesParamsRequest,
    patient: PatientDataToAuth,
  ): Promise<IInsuranceEntity[]> {
    try {
      const data = await this.suporteInformaticaApiService.listProfessionalTypes(integration, requestFilters, patient);
      return data?.ListaTiposProfissional?.map((resource) => ({
        code: String(resource.COD_TIPOPROFISSIONAL),
        name: String(resource.DES_TIPOPROFISSIONAL)?.trim(),
        ...this.getDefaultErpEntityData(integration),
      }));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SuporteInformaticaService.listProfessionalTypess', error);
    }
  }

  public async listInsurances(
    integration: IntegrationDocument,
    requestFilters: SIInsuranceParamsRequest,
    patient: PatientDataToAuth,
  ): Promise<IInsuranceEntity[]> {
    try {
      const data = await this.suporteInformaticaApiService.listInsurances(integration, requestFilters, patient);
      return data?.listaConvenios?.map((resource) => ({
        code: String(resource.COD_CONVENIO),
        name: String(resource.DES_SIGLA)?.trim(),
        ...this.getDefaultErpEntityData(integration),
      }));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SuporteInformaticaService.listInsurances', error);
    }
  }

  public async listAppointmentTypes(
    integration: IntegrationDocument,
    requestFilters: SIAppointmentTypesParamsRequest,
    patient: PatientDataToAuth,
  ): Promise<IInsuranceEntity[]> {
    try {
      const data = await this.suporteInformaticaApiService.listAppointmentTypes(integration, requestFilters, patient);
      return data?.listaTiposAtendimento?.map((resource) => ({
        code: String(resource.COD_TIPOATENDIMENTO),
        name: String(resource.DES_TIPOATENDIMENTO)?.trim(),
        ...this.getDefaultErpEntityData(integration),
      }));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SuporteInformaticaService.listAppointmentTypes', error);
    }
  }

  public async listOrganizationUnits(
    integration: IntegrationDocument,
    patient: PatientDataToAuth,
  ): Promise<IOrganizationUnitEntity[]> {
    try {
      const data = await this.suporteInformaticaApiService.listLocations(integration, patient);
      const organizationUnits: IOrganizationUnitEntity[] = [];

      data?.listaLocalidades.forEach((localidade) => {
        localidade.listaLocais.forEach((resource) => {
          organizationUnits.push({
            code: String(resource.CodLocal),
            name: String(resource.DesNomeLocal)?.trim(),
            ...this.getDefaultErpEntityData(integration),
          });
        });
      });
      return organizationUnits;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SuporteInformaticaService.listOrganizationUnits', error);
    }
  }

  public async listInsurancePlans(
    integration: IntegrationDocument,
    requestFilters: SIInsurancePlansParamsRequest,
    patient: PatientDataToAuth,
  ): Promise<IInsurancePlanEntity[]> {
    try {
      const data = await this.suporteInformaticaApiService.listInsurancePlans(integration, requestFilters, patient);
      return (
        data?.listaPlanosConvenio?.map((resource) => ({
          code: String(resource.ID_PLANOCONVENIO),
          name: String(resource.DES_PLANOCONVENIO)?.trim(),
          insuranceCode: String(requestFilters.CodConvenio),
          ...this.getDefaultErpEntityData(integration),
        })) ?? []
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SuporteInformaticaService.listInsurancePlans', error);
    }
  }

  public async listDoctors(
    integration: IntegrationDocument,
    requestFilters: SIProfessionalsParamsRequest,
    patient: PatientDataToAuth,
  ): Promise<IDoctorEntity[]> {
    try {
      const data = await this.suporteInformaticaApiService.listProfessionals(integration, requestFilters, patient);
      return data?.listaProfissionais?.map((resource) => ({
        code: String(resource.COD_PROFISSIONAL),
        name: resource.DES_NOMEPROFISSIONAL?.trim(),
        ...this.getDefaultErpEntityData(integration),
      }));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SuporteInformaticaService.listDoctors', error);
    }
  }

  public async listDoctorsExams(
    integration: IntegrationDocument,
    requestFilters: SIProfessionalsExamsParamsRequest,
    patient: PatientDataToAuth,
  ): Promise<IDoctorEntity[]> {
    try {
      const data = await this.suporteInformaticaApiService.listProfessionalsExams(integration, requestFilters, patient);
      return data?.ListaProfissionaisLocais?.map((resource) => ({
        code: String(resource.COD_PROFISSIONAL),
        name: resource.DES_NOMEPROFISSIONAL?.trim(),
        ...this.getDefaultErpEntityData(integration),
      }));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SuporteInformaticaService.listDoctorsExams', error);
    }
  }

  public async listExamProcedures(
    integration: IntegrationDocument,
    requestFilters: SIProceduresParamsRequest,
    patient: PatientDataToAuth,
  ): Promise<IProcedureEntity[]> {
    try {
      const data = await this.suporteInformaticaApiService.listExamProcedures(integration, requestFilters, patient);
      const specialityCode = this.suporteInformaticaHelpersService.createCompositeSpecialityCode(
        String(requestFilters.IdSubGrupoProcedimento),
        SpecialityTypes.E,
      );
      return (
        data?.ListaProcedimentos?.map((resource) => ({
          code: String(resource.COD_PROCEDIMENTO),
          name: String(resource.DES_NOMEPROCEDIMENTO)?.trim(),
          specialityCode: String(specialityCode),
          specialityType: SpecialityTypes.E,
          data: {
            idProcedure: String(resource.ID_PROCEDIMENTO),
          } as ProcedureData,
          ...this.getDefaultErpEntityData(integration),
        })) ?? []
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SuporteInformaticaService.listExamProcedures', error);
    }
  }

  public async listSpecialities(
    integration: IntegrationDocument,
    requestFilters: SISpecialitiesParamsRequest,
    patient: PatientDataToAuth,
  ): Promise<ISpecialityEntity[]> {
    try {
      const data = await this.suporteInformaticaApiService.listSpecialities(integration, requestFilters, patient);
      return data?.listaEspecialidades?.map((resource) => ({
        code: this.suporteInformaticaHelpersService.createCompositeSpecialityCode(
          String(resource.COD_ESPECIALIDADE),
          SpecialityTypes.C,
        ),
        name: resource.DES_ESPECIALIDADE?.trim(),
        specialityType: SpecialityTypes.C,
        ...this.getDefaultErpEntityData(integration),
      }));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SuporteInformaticaService.listSpecialities', error);
    }
  }

  public async listExamsGroups(
    integration: IntegrationDocument,
    requestFilters: SIProceduresGroupParamsRequest,
    patient: PatientDataToAuth,
  ): Promise<ISpecialityEntity[]> {
    try {
      const data = await this.suporteInformaticaApiService.listExamGroupProcedures(
        integration,
        requestFilters,
        patient,
      );
      return data?.ListaGruposSubgrupos?.map((resource) => ({
        code: this.suporteInformaticaHelpersService.createCompositeSpecialityCode(
          String(resource.ID_SUBGRUPOPROCEDIMENTO),
          SpecialityTypes.E,
        ),
        name: resource.DES_SUBGRUPOPROCEDIMENTO?.trim(),
        specialityType: SpecialityTypes.E,
        data: {
          groupCode: String(resource.ID_GRUPOPROCEDIMENTO),
          groupName: resource.DES_GRUPOPROCEDIMENTO?.trim(),
        } as SpecialityData,
        ...this.getDefaultErpEntityData(integration),
      }));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SuporteInformaticaService.listExamsGroups', error);
    }
  }

  private getResourceFilters(
    targetEntity: EntityType,
    filters: CorrelationFilter,
    patient: InitialPatient,
  ): RequestParams {
    const params: RequestParams = {};
    const { appointmentType, insurance, procedure, speciality } = filters;
    const { data } = procedure || {};
    const { idProcedure }: SuporteInformaticaResourceFilterData = (data as SuporteInformaticaResourceFilterData) || {};

    if (targetEntity === EntityType.insurancePlan) {
      if (!insurance?.code) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          'SuporteInformaticaService.getResourceFilters: Insurance code is required',
        );
      }

      const insurancePlanParams: SIInsurancePlansParamsRequest = {
        CodConvenio: Number(insurance.code),
      };

      return {
        ...params,
        ...insurancePlanParams,
      };
    }

    if (targetEntity === EntityType.insurance) {
      return params;
    }

    if (targetEntity === EntityType.speciality) {
      if (appointmentType?.params?.referenceScheduleType === ScheduleType.Exam) {
        return params;
      } else if (!insurance?.code || !appointmentType?.code) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          'SuporteInformaticaService.getResourceFilters: Insurance and appointmentType code is required',
        );
      }

      const specialityParams: SISpecialitiesParamsRequest = {
        CodConvenio: Number(insurance?.code),
        CodTipoAtendimento: Number(appointmentType?.code),
        CodTipoProfissional: 1,
      };

      return {
        ...params,
        ...specialityParams,
      };
    }

    if (targetEntity === EntityType.doctor) {
      if (!appointmentType?.code) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          'SuporteInformaticaService.getResourceFilters: appointmentType code is required',
        );
      }

      if (appointmentType?.params?.referenceScheduleType === ScheduleType.Exam) {
        if (!speciality?.code || !procedure?.code || !idProcedure) {
          throw HTTP_ERROR_THROWER(
            HttpStatus.BAD_REQUEST,
            'SuporteInformaticaService.getResourceFilters: speciality, procedure code and id is required',
          );
        }

        const doctorParams: SIProfessionalsExamsParamsRequest = {
          ID_PROCEDIMENTO: Number(idProcedure),
          COD_PROCEDIMENTO: Number(procedure?.code),
        };

        return {
          ...params,
          ...doctorParams,
        };
      }

      if (!insurance?.code || !speciality?.code) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          'SuporteInformaticaService.getResourceFilters: Insurance and speciality code is required',
        );
      }

      const { code: specialityCode } = this.suporteInformaticaHelpersService.getCompositeProcedureCode(speciality.code);

      const doctorParams: SIProfessionalsParamsRequest = {
        CODTipoAtendimento: Number(appointmentType?.code),
        CODEspecialidade: Number(specialityCode),
        CODConvenio: Number(insurance?.code),
        CODTipoProfissional: 1,
        DATNascimentoCliente: moment(patient.bornDate).toISOString(),
        SexoCliente: patient.sex,
      };

      return {
        ...params,
        ...doctorParams,
      };
    }

    if (targetEntity === EntityType.appointmentType) {
      const appointmentTypeParams: SIAppointmentTypesParamsRequest = {
        CodTipoProfissional: 1,
      };

      return {
        ...params,
        ...appointmentTypeParams,
      };
    }

    if (targetEntity === EntityType.procedure) {
      if (appointmentType.params.referenceScheduleType !== ScheduleType.Exam) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          'SuporteInformaticaService.getResourceFilters: Invalid procedure request. Required referenceScheduleType = exam',
        );
      }

      if (!speciality?.code) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          'SuporteInformaticaService.getResourceFilters: Speciality code is required',
        );
      }

      const { code } = this.suporteInformaticaHelpersService.getCompositeProcedureCode(speciality.code);
      const procedureParams: SIProceduresParamsRequest = {
        IdGrupoProcedimento: undefined,
        IdSubGrupoProcedimento: undefined,
      };

      // -1 lista todos os procedimentos
      if (Number(code) === -1) {
        procedureParams.IdGrupoProcedimento = -1;
        procedureParams.IdSubGrupoProcedimento = -1;
      } else {
        procedureParams.IdGrupoProcedimento = Number((speciality.data as unknown as SpecialityData).groupCode);
        procedureParams.IdSubGrupoProcedimento = Number(code);
      }

      return {
        ...params,
        ...procedureParams,
      };
    }

    return params;
  }

  public async extractEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    filters: CorrelationFilter,
    patient: InitialPatient,
    cache?: boolean,
  ): Promise<EntityTypes[]> {
    const requestFilters = this.getResourceFilters(entityType, filters, patient);

    if (cache) {
      const resourceCache = await this.integrationCacheUtilsService.getCachedEntitiesFromRequest(
        entityType,
        integration,
        requestFilters,
      );

      if (resourceCache) {
        return resourceCache;
      }
    }

    const patientAuth: PatientDataToAuth = {
      bornDate: patient.bornDate,
      cpf: patient.cpf,
      name: patient.name,
      phone: patient.phone,
    };

    const getResource = () => {
      switch (entityType) {
        case EntityType.insurance:
          return this.listInsurances(integration, requestFilters as SIInsuranceParamsRequest, patientAuth);

        case EntityType.insurancePlan:
          return this.listInsurancePlans(integration, requestFilters as SIInsurancePlansParamsRequest, patientAuth);

        case EntityType.speciality: {
          if (!filters.appointmentType?.params?.referenceScheduleType) {
            return [];
          }

          if (filters.appointmentType.params.referenceScheduleType === ScheduleType.Exam) {
            return this.listExamsGroups(integration, requestFilters as SIProceduresGroupParamsRequest, patientAuth);
          }
          return this.listSpecialities(integration, requestFilters as SISpecialitiesParamsRequest, patientAuth);
        }

        case EntityType.appointmentType:
          return this.listAppointmentTypes(integration, requestFilters as SIAppointmentTypesParamsRequest, patientAuth);

        case EntityType.organizationUnit:
          return this.listOrganizationUnits(integration, patientAuth);

        case EntityType.procedure: {
          if (filters.appointmentType.params.referenceScheduleType === ScheduleType.Exam) {
            return this.listExamProcedures(integration, requestFilters as SIProceduresParamsRequest, patientAuth);
          }
          return [];
        }

        case EntityType.doctor: {
          if (filters.appointmentType.params.referenceScheduleType === ScheduleType.Exam) {
            return this.listDoctorsExams(integration, requestFilters as SIProfessionalsExamsParamsRequest, patientAuth);
          }

          return this.listDoctors(integration, requestFilters as SIProfessionalsParamsRequest, patientAuth);
        }

        default:
          return [];
      }
    };

    const resource: EntityTypes[] = await getResource();
    if (cache && resource?.length) {
      await this.integrationCacheUtilsService.setCachedEntitiesFromRequest(
        entityType,
        integration,
        requestFilters,
        resource,
        getExpirationByEntity(entityType),
      );
    }
    return resource;
  }

  public async listValidApiEntities<T>(
    integration: IntegrationDocument,
    targetEntity: EntityType,
    filters: CorrelationFilter,
    patient: InitialPatient,
    cache?: boolean,
  ): Promise<T[]> {
    try {
      const data = await this.extractEntity(integration, targetEntity, filters, patient, cache);
      const codes = data?.map((entity) => entity.code);

      if (cache) {
        const cachedEntities = await this.integrationCacheUtilsService.getProcessedEntities(
          integration,
          targetEntity,
          codes,
        );

        if (cachedEntities) {
          return cachedEntities as unknown as T[];
        }
      }

      const entities = await this.entitiesService.getValidEntitiesbyCode(integration._id, codes, targetEntity);

      if (cache && entities?.length) {
        await this.integrationCacheUtilsService.setProcessedEntities(integration, targetEntity, entities, codes);
      }

      return entities as unknown as T[];
    } catch (error) {
      throw error;
    }
  }
}
