import { IntentPattern } from '../interfaces/intent-classification.interface';
import { IntentType } from '../enums/intent-type.enum';

export const INTENT_PATTERNS: IntentPattern[] = [
    {
        patterns: [
            /^(oi|ol[aá]|hello|hi|hey|eae|eai|opa|salve|oie|oii)[\s!?]*$/i,
            /^bom\s+dia[\s!?]*$/i,
            /^boa\s+tarde[\s!?]*$/i,
            /^boa\s+noite[\s!?]*$/i,
            /^boa\s+madrugada[\s!?]*$/i,
            /^bom\s+dia[\s!,]*\s*doutor[a]?[\s!?]*$/i,
            /^boa\s+tarde[\s!,]*\s*doutor[a]?[\s!?]*$/i,
            /^boa\s+noite[\s!,]*\s*doutor[a]?[\s!?]*$/i,
            /^(tudo\s+bem|como\s+vai|como\s+est[aá]|tudo\s+ok|como\s+vc\s+est[aá]|como\s+voc[eê]\s+est[aá])[\s!?]*$/i,
            /^(e\s+a[ií]|e\s+ent[aã]o|e\s+ae|qual\s+[eé])[\s!?]*$/i,
            /^(come[cç]ar|iniciar|come[cç]ando|vamos\s+come[cç]ar|podemos\s+come[cç]ar)[\s!?]*$/i,
            /^(fala|fala\s+a[ií]|fala\s+comigo|falae|co[eé]|cola|colae)[\s!?]*$/i,
            /^(tudo\s+joia|tudo\s+blz|tudo\s+beleza|tranquilo|sussa|de\s+boa)[\s!?]*$/i,
            /^(como\s+[eé]\s+que\s+t[aá]|como\s+que\s+vai|como\s+anda|como\s+que\s+est[aá])[\s!?]*$/i,
            /^(firmeza|na\s+moral|qual\s+[eé]\s+a\s+boa|beleza\s+mano|salve\s+mano)[\s!?]*$/i,
            /^(oi\s+pessoal|ol[aá]\s+pessoal|bom\s+dia\s+pessoal|boa\s+tarde\s+pessoal)[\s!?]*$/i,
            /^(quanto\s+tempo|h[aá]\s+quanto\s+tempo|fazia\s+tempo)[\s!?]*$/i,
            /^(oi\s+tudo\s+bem|ol[aá]\s+tudo\s+bem|oi\s+como\s+vai|ol[aá]\s+como\s+vai)[\s!?]*$/i,
        ],
        intentType: IntentType.GREETING,
    },
    {
        patterns: [
            /^(obrigad[ao]|valeu|brigad[ao]|thanks|thank\s+you)[\s!?]*$/i,
            /^(obrigad[ao]|valeu|brigad[ao])\s+(tchau|at[eé]\s*logo|bye)[\s!?]*$/i,
            /^muito\s+obrigad[ao][\s!?]*$/i,
            /^(show|perfeito|massa|top|legal|[oó]timo|bom|beleza|joia)[\s!?]*$/i,
            /^(ajudou\s+muito|foi\s+[uú]til|me\s+ajudou)[\s!?]*$/i,
            /^(grat[aã]o|gratid[aã]o|agrade[cç]o)[\s!?]*$/i,
            /^(que\s+legal|que\s+bom|que\s+[oó]timo|que\s+show)[\s!?]*$/i,
            /^(escreveu\s+tudo|mandou\s+bem|arrasou|demais)[\s!?]*$/i,
            /^.*\s+(que\s+legal|que\s+bom|que\s+show)[\s!?,]*$/i,
        ],
        intentType: IntentType.THANKS,
    },
    {
        patterns: [
            /^(tchau|at[eé]\s*logo|at[eé]\s*mais|bye|adeus|goodbye)[\s!?]*$/i,
            /^(fui|falou|flw|vazou|indo\s+embora)[\s!?]*$/i,
            /^(at[eé]\s*amanh[aã]|at[eé]\s*depois|nos\s*vemos)[\s!?]*$/i,
            /^(tenho\s+que\s+ir|preciso\s+ir|vou\s+embora)[\s!?]*$/i,
            /^(obrigad[ao]\s+tchau|valeu\s+tchau|brigad[ao]\s+bye)[\s!?]*$/i,
            /^(estou\s+indo|t[oô]\s+indo|vou\s+indo|j[aá]\s+estou\s+indo).*$/i,
            /^.*\s+(me\s+aguard[ae]|aguard[ao]\s+a[ií]).*$/i,
        ],
        intentType: IntentType.FAREWELL,
    },
    {
        patterns: [
            /^(menu|op[cç][oõ]es|ajuda|help|aux[ií]lio|suporte)[\s!?]*$/i,
            /^(me\s+)?(mostra|mostre|exibe|exiba|apresenta|apresente|lista|liste)\s+(o\s+)?(menu|op[cç][oõ]es|ajuda|comandos)[\s!?]*$/i,
            /^(quero|preciso|gostaria\s+de)\s+(ver|saber|conhecer)\s+(o\s+)?(menu|op[cç][oõ]es|ajuda|comandos)[\s!?]*$/i,
            /^(o\s*que\s+posso\s+fazer|que\s+posso\s+fazer|posso\s+fazer\s+o\s*que)[\s!?]*$/i,
            /^(o\s+que\s+voc[eê]\s+faz|que\s+voc[eê]\s+faz|voc[eê]\s+faz\s+o\s*que)[\s!?]*$/i,
            /^(como\s+funciona|como\s+posso\s+usar|como\s+usar)[\s!?]*$/i,
            /^(me\s+ajude|preciso\s+de\s+ajuda|pode\s+me\s+ajudar)[\s!?]*$/i,
            /^(comandos|o\s+que\s+fazer|n[aã]o\s+sei\s+o\s+que\s+fazer)[\s!?]*$/i,
            /^quais\s+(as\s+)?op[cç][oõ]es[\s!?]*$/i,
            /^(me\s+)?(d[aá]|mostre|mostra)\s+as\s+op[cç][oõ]es[\s!?]*$/i,
        ],
        intentType: IntentType.MENU,
    },
    {
        patterns: [],
        intentType: IntentType.OFF_TOPIC,
    },
];
