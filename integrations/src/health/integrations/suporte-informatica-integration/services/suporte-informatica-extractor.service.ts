import { Injectable } from '@nestjs/common';
import { CacheService } from '../../../../core/cache/cache.service';
import { ApiService } from '../../../api/services/api.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { EntityType, IDoctorEntity, IOrganizationUnitLocationEntity } from '../../../interfaces/entity.interface';
import { DEFAULT_USER_TO_AUTH } from '../defaults';
import { SpecialityData } from '../interfaces/entities';
import { PatientDataToAuth, SuporteInformaticaApiService } from './suporte-informatica-api.service';
import { SuporteInformaticaEntitiesService } from './suporte-informatica-entities.service';
import * as moment from 'moment';
import { SuporteInformaticaHelpersService } from './suporte-informatica-helpers.service';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';

@Injectable()
export class SuporteInformaticaExtractorService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly apiService: ApiService,
    private readonly suporteInformaticaEntitiesService: SuporteInformaticaEntitiesService,
    private readonly suporteInformaticaApiService: SuporteInformaticaApiService,
    private readonly suporteInformaticaHelpersService: SuporteInformaticaHelpersService,
  ) {}

  async extract(integration: IntegrationDocument) {
    const cacheKeyDefault = 'INTEGRATOR:' + castObjectIdToString(integration._id) + ':extract';
    const redisNamespace = 'general';
    const cacheClient = this.cacheService.getClient(redisNamespace);

    const patientAuth: PatientDataToAuth = {
      bornDate: DEFAULT_USER_TO_AUTH.bornDate,
      cpf: DEFAULT_USER_TO_AUTH.cpf,
      name: DEFAULT_USER_TO_AUTH.name,
      phone: DEFAULT_USER_TO_AUTH.phone,
    };

    await this.cacheService.removeKeysByPattern(cacheKeyDefault + ':*', undefined, redisNamespace);

    try {
      const insurances = await this.suporteInformaticaEntitiesService.listInsurances(integration, {}, patientAuth);

      // busca só de particular. 0 é default para particular????
      const insuranceToExtract = insurances ? insurances.filter((ins) => ins.code === '0') : null;
      const professionalTypes = await this.suporteInformaticaEntitiesService.listProfessionalTypess(
        integration,
        {},
        patientAuth,
      );

      if (professionalTypes) {
        for await (const professionalType of professionalTypes) {
          const appointmentTypes = await this.suporteInformaticaEntitiesService.listAppointmentTypes(
            integration,
            {
              CodTipoProfissional: Number(professionalType.code),
            },
            patientAuth,
          );

          if (appointmentTypes) {
            for await (const appointmentType of appointmentTypes) {
              await cacheClient.hset(
                `${cacheKeyDefault}:${EntityType.appointmentType}`,
                appointmentType.code,
                JSON.stringify(appointmentType),
              );
            }
          }

          if (insuranceToExtract && appointmentTypes) {
            for await (const insurance of insuranceToExtract) {
              for await (const appointmentType of appointmentTypes) {
                const specialities = await this.suporteInformaticaEntitiesService.listSpecialities(
                  integration,
                  {
                    CodConvenio: Number(insurance.code),
                    CodTipoAtendimento: Number(appointmentType.code),
                    CodTipoProfissional: Number(professionalType.code),
                  },
                  patientAuth,
                );

                if (specialities) {
                  for await (const speciality of specialities) {
                    await cacheClient.hset(
                      `${cacheKeyDefault}:${EntityType.speciality}`,
                      speciality.code,
                      JSON.stringify(speciality),
                    );
                  }
                }
              }
            }
          }
        }
      }

      // --- Extrai convênios e planos---
      if (insurances) {
        for await (const insurance of insurances) {
          if (integration.debug) {
            console.log('SI: insurancePlan extract', insurance.code);
          }

          await cacheClient.hset(
            `${cacheKeyDefault}:${EntityType.insurance}`,
            insurance.code,
            JSON.stringify(insurance),
          );

          const insurancePlans = await this.suporteInformaticaEntitiesService.listInsurancePlans(
            integration,
            {
              CodConvenio: Number(insurance.code),
            },
            patientAuth,
          );

          if (insurancePlans) {
            for await (const insurancePlan of insurancePlans) {
              await cacheClient.hset(
                `${cacheKeyDefault}:${EntityType.insurancePlan}`,
                insurancePlan.code,
                JSON.stringify(insurancePlan),
              );
            }
          }
        }
      }

      // --- Extrai procedimento de exames---
      const examsGroups = await this.suporteInformaticaEntitiesService.listExamsGroups(integration, {}, patientAuth);

      if (examsGroups) {
        for await (const examGroup of examsGroups) {
          const { code } = this.suporteInformaticaHelpersService.getCompositeProcedureCode(examGroup.code);
          if (integration.debug) {
            console.log('SI: examGroup extract', examGroup.code);
          }

          examsGroups.forEach(
            async (speciality) =>
              await cacheClient.hset(
                `${cacheKeyDefault}:${EntityType.speciality}`,
                speciality.code,
                JSON.stringify(speciality),
              ),
          );

          const procedures = await this.suporteInformaticaEntitiesService.listExamProcedures(
            integration,
            {
              IdGrupoProcedimento: Number((examGroup.data as SpecialityData).groupCode),
              IdSubGrupoProcedimento: Number(code),
            },
            patientAuth,
          );

          if (procedures) {
            for await (const procedure of procedures) {
              if (integration.debug) {
                console.log('SI: procedure extract', `${examGroup.code} - ${procedure.code}`);
              }
              await cacheClient.hset(
                `${cacheKeyDefault}:${EntityType.procedure}`,
                procedure.code,
                JSON.stringify(procedure),
              );
            }
          }
        }
      }

      // --- Extrai médicos---
      const doctorsResponse = await this.suporteInformaticaApiService.listAllProfessionals(
        integration,
        {
          CodParteNome: 0,
          CodProfissionais: '',
          DesNome: '',
        },
        patientAuth,
      );

      if (doctorsResponse) {
        for await (const resource of doctorsResponse?.listaProfissionais) {
          const doctor: IDoctorEntity = {
            code: String(resource.CodProfissional),
            name: String(resource.DesNomeProfissional)?.trim(),
            ...this.suporteInformaticaEntitiesService.getDefaultErpEntityData(integration),
          };

          await cacheClient.hset(`${cacheKeyDefault}:${EntityType.doctor}`, doctor.code, JSON.stringify(doctor));
        }
      }

      // --- Extrai unidades e localizações---
      const organizationUnitsResponse = await this.suporteInformaticaApiService.listLocations(integration, patientAuth);

      if (organizationUnitsResponse) {
        for await (const resource of organizationUnitsResponse?.listaLocalidades) {
          if (integration.debug) {
            console.log('SI: organizationUnitLocation extract', resource.CodSeqLocalidade);
          }

          const locationName = `${resource.DesUF} - ${resource.DesNomeLocalidade}`;

          // Não da para vincular as unidades neste momento pois o references[] espera
          // o id do mongo da entidade, e aqui não foi salvo ainda
          const organizationUnitLocation: IOrganizationUnitLocationEntity = {
            code: String(resource.CodSeqLocalidade),
            name: String(locationName),
            data: {},
            ...this.suporteInformaticaEntitiesService.getDefaultErpEntityData(integration),
          };

          await cacheClient.hset(
            `${cacheKeyDefault}:${EntityType.organizationUnitLocation}`,
            organizationUnitLocation.code,
            JSON.stringify(organizationUnitLocation),
          );

          for await (const { CodLocal } of resource.listaLocais) {
            const { Local: local } = await this.suporteInformaticaApiService.getLocal(
              integration,
              {
                CodLocal: Number(CodLocal),
              },
              patientAuth,
            );

            const organizationUnit = {
              code: String(local.COD_LOCAL),
              name: String(local.DES_NOMELOCAL)?.trim(),
              ...this.suporteInformaticaEntitiesService.getDefaultErpEntityData(integration),
              data: {
                address: String(`${local.DES_ENDERECO},${local.DES_BAIRRO} - ${local.DES_NOMELOCALIDADE}`),
              },
            };

            await cacheClient.hset(
              `${cacheKeyDefault}:${EntityType.organizationUnit}`,
              organizationUnit.code,
              JSON.stringify(organizationUnit),
            );
          }
        }
      }

      console.log('extractAll done', moment().format('YYYY-MM-DD HH:mm:ss'));

      await this.apiService.syncAllDone(integration);
      return {
        ok: true,
      };
    } catch (error) {
      await this.cacheService.removeKeysByPattern(cacheKeyDefault + ':*', undefined, redisNamespace);
      console.log('SuporteInformaticaExtractorService.extract', error);
      throw error;
    }
  }
}
