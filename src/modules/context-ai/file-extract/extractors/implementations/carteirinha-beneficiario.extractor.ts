import { Injectable } from '@nestjs/common';
import { ExtractionType } from '../../interfaces/file-extract.interface';
import { FileExtractor } from '../file-extractor.interface';

@Injectable()
export class CarteirinhaBeneficiarioFileExtractor implements FileExtractor {
    name = ExtractionType.CARTEIRINHA_BENEFICIARIO;
    description = 'Extrai informações de carteirinha de beneficiário de planos de saúde';

    generatePrompt(): string {
        return `
**Objetivo:**
Você é um assistente especializado na extração e estruturação de dados a partir de imagens de carteirinhas de planos de saúde. 
Sua única função é analisar a imagem fornecida e converter as informações visíveis em um objeto JSON,
seguindo rigorosamente as regras e o esquema definidos abaixo  sem nenhum texto, saudação ou explicação adicional.

**Regras de Extração e Formatação:**

1.  **Fidelidade à Imagem:** Extraia *apenas* as informações que estão visíveis e legíveis na imagem. Não invente, deduza ou complete dados ausentes ou ilegíveis.
2.  **Confiança na Extração:** Para cada campo extraído, atribua um valor de confiança (\\\`confianca\\\`) entre 0.0 (ilegível) e 1.0 (perfeitamente legível).
Se um campo não for encontrado, seu valor (\\\`valor\\\`) deve ser \\\`null\\\` e a confiança \\\`0.0\\\`.
3.  **Formatação de Dados:**
    * **Datas:** Normalize para o formato \\\`YYYY-MM\\\` ou \\\`YYYY-MM-DD\\\` se o dia estiver disponível.
4.  **Campos Essenciais:**
    * Sempre inclua o campo \\\`texto_bruto\\\` com todo o texto extraído da imagem via OCR. Se a imagem fornecida não for ima carteirinha de plano de sáude, use o valor "no_image_provided".

**Esquema de Saída (JSON):**

Sua saída deve ser exclusivamente um objeto JSON que siga esta estrutura:

\`\`\`json
{
  "texto_bruto": "string",
  "titular": {
    "nome_completo": {"valor": "string|null", "confianca": 0.0}
  },
  "carteirinha": {
    "numero_cartao": {"valor": "string|null", "confianca": 0.0},
    "codigo_beneficiario": {"valor": "string|null", "confianca": 0.0},
    "valido_ate": {"valor": "YYYY-MM-DD|null", "confianca": 0.0},
    "data_emissao": {"valor": "YYYY-MM-DD|null", "confianca": 0.0}
  },
  "plano": {
    "operadora": {"valor": "string|null", "confianca": 0.0},
    "nome_plano": {"valor": "string|null", "confianca": 0.0},
    "abrangencia": {"valor": "string|null", "confianca": 0.0},
    "acomodacao": {"valor": "string|null", "confianca": 0.0},
    "contratacao": {"valor": "string|null", "confianca": 0.0}
  }
}
\`\`\`
        `;
    }

    validateExtractedData(data: Record<string, any>): boolean {
        if (!data || typeof data !== 'object') {
            return false;
        }

        const hasAtLeastOneField = Object.keys(data).some(
            (key) => data[key] !== null && data[key] !== undefined && data[key] !== '',
        );

        return hasAtLeastOneField;
    }

    formatResponse(data: Record<string, any>): Record<string, any> {
        const extractValue = (field: any) => {
            if (field && typeof field === 'object' && 'valor' in field) {
                return field.valor;
            }
            return field || null;
        };

        return {
            texto_bruto: data.texto_bruto || null,
            extraido_em: new Date().toISOString(),
            titular: {
                nome_completo: extractValue(data.titular?.nome_completo),
            },
            carteirinha: {
                numero_cartao: extractValue(data.carteirinha?.numero_cartao),
                codigo_beneficiario: extractValue(data.carteirinha?.codigo_beneficiario),
                valido_ate: extractValue(data.carteirinha?.valido_ate),
                data_emissao: extractValue(data.carteirinha?.data_emissao)
            },
            plano: {
                operadora: extractValue(data.plano?.operadora),
                nome_plano: extractValue(data.plano?.nome_plano),
                abrangencia: extractValue(data.plano?.abrangencia),
                acomodacao: extractValue(data.plano?.acomodacao),
                contratacao: extractValue(data.plano?.contratacao)
            }
        };
    }
}
