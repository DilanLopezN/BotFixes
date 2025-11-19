import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { File } from '../../../common/interfaces/uploaded-file';
import { AiService } from '../../ai/ai.service';
import { IntegratorService } from '../../integrator/service/integrator.service';
import { EntitiesService } from '../../entities/services/entities.service';
import { EntityType } from '../../interfaces/entity.interface';
import { castObjectId, castObjectIdToString } from '../../../common/helpers/cast-objectid';
import {
  ExtractMedicalRequestAI,
  ExtractMedicalRequestDataResponse,
  ListValidProceduresParams,
  ExtractMedicalRequestDataParams,
} from '../interfaces/extract-medical-request-data.inteface';
import { AIProviderType } from '../../ai/interfaces';
import { ProcedureEntityDocument } from '../../entities/schema';
import { ReportProcessorAnalyticsService } from './report-processor-analytics.service';
import { EntitiesEmbeddingBatchService } from 'health/entities-embedding/services/entities-embedding-batch.service';
import { EntitiesEmbeddingService } from 'health/entities-embedding/services/entities-embedding.service';
import { CtxMetadata } from 'common/interfaces/ctx-metadata';
import * as contextService from 'request-context';
import { IntegrationDocument } from 'health/integration/schema/integration.schema';
import { IntegrationService } from 'health/integration/integration.service';
import * as Sentry from '@sentry/node';
import { OkResponse } from '../../../common/interfaces/ok-response.interface';
import { FlowService } from '../../flow/service/flow.service';
import { FlowSteps, FlowAction } from '../../flow/interfaces/flow.interface';

type EntityWithActions = ProcedureEntityDocument & {
  actions?: FlowAction[];
};

@Injectable()
export class ReportProcessorService {
  private provider = AIProviderType.google;

  constructor(
    private readonly aiService: AiService,
    private readonly entitiesService: EntitiesService,
    private readonly reportProcessorAnalyticsService: ReportProcessorAnalyticsService,
    private readonly entitiesEmbeddingBatchService: EntitiesEmbeddingBatchService,
    private readonly entitiesEmbeddingService: EntitiesEmbeddingService,
    private readonly integrationService: IntegrationService,
    private readonly flowService: FlowService,
    @Inject(forwardRef(() => IntegratorService))
    private readonly integratorService: IntegratorService,
  ) {}

  public async importRagProceduresUsingIntegrationId(integrationId: string) {
    try {
      const integration = await this.integrationService.getOne(integrationId);
      return this.importRagProcedures(integration);
    } catch (err) {
      throw err;
    }
  }

  private async getFirstPartExecution({
    file,
    fileUrl,
    analyticsRecordId,
  }: {
    file: File;
    fileUrl: string;
    analyticsRecordId: number;
  }): Promise<ExtractMedicalRequestAI> {
    const prompt = `
        # Instruções para Análise de Pedido Médico de Exame

        ## Objetivo
        Extrair com precisão o(s) nome(s) do(s) exame(s) médico(s) solicitado(s) em um pedido médico.

        ## Instruções Específicas

        ### Identificação do procedimento
        Localize e extraia o nome exato do exame conforme descrito no documento (ex: "Radiografia de tórax PA e perfil", "Ressonância magnética de joelho direito", "Ultrassonografia pélvica transvaginal")

        ### Preservação da nomenclatura
        Mantenha exatamente a terminologia utilizada no documento original, incluindo:
        - Especificações anatômicas (direito/esquerdo, anterior/posterior)
        - Técnicas específicas (com contraste, sem contraste, PA, perfil)
        - Abreviações médicas conforme escritas

        ## **FORMATO DE RESPOSTA - IMPORTANTE**

        **RETORNE APENAS O JSON PURO SEM NENHUMA FORMATAÇÃO MARKDOWN.**
        **NÃO USE \`\`\`json NEM \`\`\` NEM QUALQUER OUTRA FORMATAÇÃO.**
        **RETORNE SOMENTE O OBJETO JSON VÁLIDO QUE PODE SER USADO DIRETAMENTE NO JSON.parse()**

        Estrutura do JSON de resposta:
        {
          "result": [
            {
              "extractedExam": "nome exato extraído do exame",
              "confidence": 0.0,
              "possibilityName": [
                {
                  "name": "nome alternativo",
                  "confidence": 0.0
                }
              ]
            }
          ],
          "error": null
        }

        ## Tratamento de Erros

        - **ERR_01**: Documento não é um pedido médico válido ou não contém solicitação de exame
        - **ERR_02**: Documento parece ser um pedido médico, mas os nomes dos exames não são identificáveis ou estão ilegíveis

        ## Critérios de Validação

        - O documento deve conter elementos típicos de pedido médico (cabeçalho médico, CRM, dados do paciente)
        - Deve haver solicitação clara de procedimento diagnóstico

        ## Abreviações Comuns

        - **US** = Ultrassonografia
        - **TC** = Tomografia Computadorizada
        - **RM** = Ressonância Magnética
        - **EEG** = Eletroencefalograma
        - **ECG** = Eletrocardiograma
        - **ECO** = Ecocardiograma
        - **RX** = Raio X (Radiografia)
        - **MMG** = Mamografia
        - **PDA** = Pletismografia Digital Arterial
        - **USG** = Ultrassonografia
        - **DENS** = Densitometria Óssea
        - **END** = Endoscopia
        - **HOL** = Holter
        - **POL** = Polissonografia`;

    try {
      const result = await this.aiService.executeFile({
        prompt,
        file,
        fileUrl,
        provider: this.provider,
      });

      await this.reportProcessorAnalyticsService.updateAnalyticsRecord(analyticsRecordId, {
        extractedText: result.message,
        promptTokensIn: result.promptTokens,
        promptTokensOut: result.completionTokens,
      });

      if (result?.message?.includes('```')) {
        result.message = result.message
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/, '')
          .replace(/\s*```$/, '')
          .trim();
      }

      return JSON.parse(result.message) as ExtractMedicalRequestAI;
    } catch (error) {
      return {
        error: 'ERR_99',
        result: null,
      };
    }
  }

  public async getSecondPartExecution({
    integrationId,
    resultFile,
    entitiesIds,
  }: {
    integrationId: string;
    resultFile: ExtractMedicalRequestAI;
    speciality?: string;
    entitiesIds?: string[];
  }): Promise<string[]> {
    let result = await this.entitiesEmbeddingService.listEmbeddingsByWorkspaceId(
      integrationId,
      resultFile.result[0].extractedExam,
      entitiesIds,
    );

    if (!result.length) {
      return [];
    }

    let i = 0;

    do {
      if (result.length) {
        return result.map((item) => item.entity_id);
      }

      result = await this.entitiesEmbeddingService.listEmbeddingsByWorkspaceId(
        integrationId,
        resultFile.result[0].possibilityName[i].name,
        entitiesIds,
      );
      i++;

      if (resultFile.result[0].possibilityName.length <= i) {
        return [];
      }
    } while (!result.length);

    return [];
  }

  public async importRagProcedures(integration: IntegrationDocument): Promise<OkResponse> {
    if (
      !integration.rules?.useReportProcessorAISpecialityAndProcedureDetection &&
      !integration.rules?.useReportProcessorAIProcedureDetection
    ) {
      return {
        ok: true,
        message:
          'disabled useReportProcessorAISpecialityAndProcedureDetection & useReportProcessorAIProcedureDetection rule',
      };
    }

    await this.entitiesEmbeddingBatchService.execute(integration);
    return { ok: true };
  }

  public async listValidProceduresWithSpeciality({
    integrationId,
    filter,
  }: ListValidProceduresParams): Promise<string[]> {
    try {
      const { data: allProcedures } = await this.integratorService.getEntityList(integrationId, {
        filter,
        targetEntity: EntityType.procedure,
        patient: null,
      });

      return allProcedures.map((procedure) => castObjectIdToString(procedure._id));
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  public async extractMedicalRequestData({
    integrationId,
    file,
    fileUrl,
    filter,
  }: ExtractMedicalRequestDataParams): Promise<ExtractMedicalRequestDataResponse> {
    try {
      const integration = await this.integrationService.getOne(integrationId);
      if (
        !integration.rules?.useReportProcessorAISpecialityAndProcedureDetection &&
        !integration.rules?.useReportProcessorAIProcedureDetection
      ) {
        return {
          procedures: [],
          error: 'ERR_03',
          errorMessage: 'A funcionalidade está desativada para esta integração.',
        };
      }

      const metadata: CtxMetadata = contextService.get('req:default-headers');
      const { conversationId } = metadata;

      const embeddingsCount = await this.entitiesEmbeddingService.countEmbeddingsByIntegrationId(integrationId);
      if (embeddingsCount === 0) {
        return {
          procedures: [],
          error: 'ERR_04',
          errorMessage: 'Nenhum embedding encontrado para esta integração.',
        };
      }

      const analyticsRecord = await this.reportProcessorAnalyticsService.createAnalyticsRecord({
        conversationId,
        integrationId,
        modelProvider: this.provider,
      });

      const validProcedureIds = await this.listValidProceduresWithSpeciality({
        integrationId,
        filter,
      });

      if (validProcedureIds?.length < 5) {
        return {
          error: 'ERR_98',
          errorMessage: 'Quantidade mínima de procedimentos não atende para execução: 5',
          procedures: [],
        };
      }

      const analyticsRecordId = analyticsRecord.id;
      const resultFile = await this.getFirstPartExecution({
        file,
        fileUrl,
        analyticsRecordId,
      });

      if (resultFile?.error) {
        let messageText = '';

        switch (resultFile.error) {
          case 'ERR_01':
            messageText = 'O documento enviado não foi reconhecido como um pedido médico.';
            break;

          case 'ERR_02':
            messageText =
              'Não foi possível identificar os exames no documento enviado, possivelmente devido à qualidade da imagem.';
            break;

          default:
            messageText = resultFile?.error || 'Não foi possível identificar os exames no documento enviado.';
        }

        return {
          procedures: [],
          error: resultFile?.error || 'ERR_100',
          errorMessage: messageText,
        };
      }

      const data = {
        integrationId,
        resultFile,
      };

      const procedureIds = await this.getSecondPartExecution({ ...data, entitiesIds: validProcedureIds });

      const procedures = (await this.entitiesService.getEntitiesByIdsPreservingOrder(
        integration._id,
        EntityType.procedure,
        procedureIds.map((id) => castObjectId(id)),
      )) as unknown as ProcedureEntityDocument[];

      const specialityCodes = [...new Set(procedures.map((proc) => proc.specialityCode))];

      const specialityEntities = await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        specialityCodes,
        EntityType.speciality,
      );

      const [specialitiesWithActions] = await this.flowService.matchEntitiesFlows({
        entities: specialityEntities,
        entitiesFilter: filter,
        filters: {},
        integrationId: castObjectId(integrationId),
        targetEntity: FlowSteps.speciality,
      });

      const specialityMap = new Map();
      specialitiesWithActions.forEach((speciality) => specialityMap.set(speciality.code, speciality));

      const [proceduresWithActions] = await this.flowService.matchEntitiesFlows({
        entities: procedures,
        entitiesFilter: filter,
        filters: {},
        integrationId: castObjectId(integrationId),
        targetEntity: FlowSteps.procedure,
      });

      const proceduresWithSpecialityAndActions = proceduresWithActions.map((procedureWithActions) => {
        const procedure = procedureWithActions as EntityWithActions;
        const speciality = specialityMap.get((procedure as ProcedureEntityDocument).specialityCode) || null;
        const actions = procedure.actions || [];

        return {
          ...procedure,
          speciality,
          actions,
        };
      });

      const response = {
        procedures: proceduresWithSpecialityAndActions,
        error: null,
        errorMessage: null,
      };

      await this.reportProcessorAnalyticsService.updateAnalyticsRecord(analyticsRecordId, {
        informationExtracted: response.procedures?.map((item) => item.code),
        error: response.error,
        errorMessage: response.errorMessage,
        hadError: !!response.error,
      });

      return response;
    } catch (error) {
      console.error(error);
      Sentry.captureEvent({
        message: `ERROR:${integrationId}:extractMedicalRequestData`,
        extra: {
          integrationId: integrationId,
          error,
        },
      });

      throw error;
    }
  }
}
