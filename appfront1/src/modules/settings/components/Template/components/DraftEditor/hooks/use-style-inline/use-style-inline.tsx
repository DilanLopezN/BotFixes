import { useSelector } from 'react-redux';

import { isAnySystemAdmin } from '../../../../../../../../utils/UserPermission';
import { TemplateCategory } from '../../../../../../../liveAgent/components/TemplateMessageList/interface';
import { InlineStyleItem, InlineStyleType } from '../../props';
import { BoldIcon, ItalicIcon, MonospaceIcon, PencilAiIcon, StrukeIcon, VariableIcon } from '../../styles';

export const useInlineStyles = (category?: TemplateCategory): InlineStyleItem[] => {
    const loggedUser = useSelector((state: any) => state.loginReducer.loggedUser);
    const isAdmin = isAnySystemAdmin(loggedUser);

    const styles: InlineStyleItem[] = [
        { label: <BoldIcon title='Negrito' />, style: InlineStyleType.BOLD, tooltip: 'Negrito' },
        { label: <ItalicIcon title='Itálico' />, style: InlineStyleType.ITALIC, tooltip: 'Itálico' },
        { label: <StrukeIcon title='Tachado' />, style: InlineStyleType.STRIKETHROUGH, tooltip: 'Tachado' },
        { label: <MonospaceIcon title='Mono espaçado' />, style: InlineStyleType.CODE, tooltip: 'Mono espaçado' },
        { label: <VariableIcon title='Variável' />, style: InlineStyleType.VARIABLE, tooltip: 'Inserir variável' },
    ];

    if (isAdmin) {
        styles.unshift({
            label: (
                <img
                    alt='ai-technology'
                    style={{ height: '16px', position: 'relative', right: '4px' }}
                    src='/assets/img/ai-technology.png'
                />
            ),
            style: InlineStyleType.AI_SUGGESTION,
            tooltip: 'Melhorar com IA',
        });
    }

    if (isAdmin && category === TemplateCategory.MARKETING) {
        styles.unshift({
            label: <PencilAiIcon alt='ai-pencil' src='/assets/img/ai-pencil.png' />,
            style: InlineStyleType.AI_INSIGHT,
            tooltip: 'Insights com IA',
        });
    }

    return styles;
};
