import { Alert, Button, Drawer, message, notification, Spin, Typography } from 'antd';
import { FC, useEffect, useState } from 'react';
import { formattingWhatsappText } from '../../../../../../utils/Activity';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { TemplateSuggestionsService, TemplateMessage } from '../../../../service/TemplateSuggestionsService';
import { InlineStyleType } from '../DraftEditor/props';
import { TemplateSuggestionsModalProps } from './props';

const { Title, Paragraph } = Typography;


const TemplateSuggestionsModal: FC<TemplateSuggestionsModalProps & I18nProps> = ({
    activeModal,
    onClose,
    workspaceId,
    template,
    onSelectSuggestion,
    getTranslation,
    disabled,
    withError,
    onClearError,
    setFieldValue,
    setTextEditor,
}) => {
    const [initialLoading, setInitialLoading] = useState(false);
    const [, setSuggestionsLoading] = useState(false);
    const [, setError] = useState<string | null>(null);
    const [, setSuggestions] = useState<string[]>([]);
    const [, setTemplateMessages] = useState<TemplateMessage[]>([]);
    const [apiSuggestions, setApiSuggestions] = useState<any>(undefined);
    const [lastTemplateMessage, setLastTemplateMessage] = useState<string>('');

    useEffect(() => {
        // Limpa o estado quando o modal é fechado
        if (activeModal !== InlineStyleType.AI_SUGGESTION) {
            setSuggestions([]);
            setTemplateMessages([]);
            setApiSuggestions(undefined);
            setError(null);
            setInitialLoading(false);
            setSuggestionsLoading(false);
            setLastTemplateMessage('');
        }
        // Se tem withError (erros de validação), usa eles
        else if (withError) {
            setApiSuggestions(withError);
            setLastTemplateMessage(template?.message || '');
        }
        // Senão, busca sugestões da API somente se a mensagem mudou
        else if (template?.message && template.message !== lastTemplateMessage) {
            setInitialLoading(true);
            fetchSuggestions(false);
            setLastTemplateMessage(template.message);
        }
    }, [activeModal, template?.message, withError, lastTemplateMessage]);

    const fetchSuggestions = async (isRefresh = true) => {
        if (!template?.message || !workspaceId) return;

        // Se for um refresh, mostrar apenas loading nas sugestões
        // Se for carregamento inicial, mostrar loading em toda a modal
        if (isRefresh) {
            setSuggestionsLoading(true);
        } else if (!isRefresh && !initialLoading) {
            setInitialLoading(true);
        }

        setError(null);
        if (!template?.message || template?.message.trim().length < 20) {
            notification.warning({
                message: 'Mensagem muito curta',
                description: 'A mensagem precisa ter pelo menos 20 caracteres.',
            });
            return onClose();
        }
        if (!template?.message || template?.message.trim().length > 1024) {
            notification.warning({
                message: 'Mensagem muito longa',
                description: 'A mensagem deve ter no máximo 1024 caracteres.',
            });
            return onClose();
        }

        try {
            const response = await TemplateSuggestionsService.getTemplateMessageSuggestions(
                workspaceId,
                template.message,
                (err) => setError(err?.message || getTranslation('Failed to fetch suggestions'))
            );

            if (response?.data) {
                setApiSuggestions(response.data);
                if (response.data.suggestions && response.data.suggestions.length > 0) {
                    // Clean up suggestions by removing markdown code blocks and extra whitespace
                    const cleanedSuggestions = response.data.suggestions.map((suggestion) => {
                        // Primeiro, verifica se o texto todo está dentro de blocos de código
                        const fullCodeBlockPattern = /^```[\s\S]*```$/;
                        if (fullCodeBlockPattern.test(suggestion.trim())) {
                            // Se estiver, extrai apenas o conteúdo dentro dos delimitadores
                            return suggestion
                                .trim()
                                .replace(/^```[\w]*\n/g, '') // Remove opening code block with language
                                .replace(/^```/g, '') // Remove opening code block without language
                                .replace(/```$/g, '') // Remove closing code block
                                .trim();
                        }

                        // Caso contrário, limpa apenas os delimitadores sem afetar o restante do texto
                        return suggestion
                            .replace(/```[\w]*\n/g, '') // Remove opening code block with language
                            .replace(/```/g, '') // Remove all code block markers
                            .trim();
                    });
                    setSuggestions(cleanedSuggestions);
                }
            } else {
                setError('Não há sugestões disponíveis para este template');
            }
        } catch (err) {
            setError('Falha ao buscar sugestões');
        } finally {
            setInitialLoading(false);
            setSuggestionsLoading(false);
        }
    };


    return (
        <Drawer
            title='Sugestões de Correção'
            placement='right'
            width={700}
            onClose={onClose}
            open={activeModal === InlineStyleType.AI_SUGGESTION}
            footer={
                <div style={{ textAlign: 'right' }}>
                    <Button onClick={onClose}>Fechar</Button>
                </div>
            }
        >
            {initialLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Spin size='large' />
                    <Paragraph style={{ marginTop: 16 }}>Carregando sugestões para seu template...</Paragraph>
                </div>
            ) : (
                <>
                    <Title level={4}>Template Atual</Title>
                    <div
                        style={{
                            marginBottom: 24,
                            backgroundColor: '#f5f5f5',
                            padding: 16,
                            borderRadius: 4,
                            fontSize: '14px',
                            lineHeight: '1.6',
                        }}
                    >
                        {formattingWhatsappText(template?.message || '')}
                    </div>

                    {apiSuggestions && (
                        <div style={{ marginBottom: 16 }}>
                            {(apiSuggestions.data?.messages || apiSuggestions.messages) && Array.isArray(apiSuggestions.data?.messages || apiSuggestions.messages) && (apiSuggestions.data?.messages || apiSuggestions.messages).length > 0 && (
                                <Alert
                                    message={getTranslation('Message Suggestions')}
                                    description={
                                        <div style={{ marginBottom: 0, paddingLeft: '10px' }}>
                                            {(apiSuggestions.data?.messages || apiSuggestions.messages).map((msgObj: any, index: number) => (
                                                <div key={index} style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                                        <strong>{getTranslation('Suggestion')} {index + 1}:</strong>
                                                        <Button
                                                            type="primary"
                                                            size="small"
                                                            onClick={() => {
                                                                const message = typeof msgObj === 'string' ? msgObj : msgObj.message;
                                                                const buttons = msgObj.buttons || [];
                                                                onSelectSuggestion({message, buttons});
                                                                if (onClearError) {
                                                                    onClearError();
                                                                }
                                                            }}
                                                        >
                                                            {template?._id ? getTranslation('Novo Template') : getTranslation('Apply Suggestion')}
                                                        </Button>
                                                    </div>
                                                    <div style={{ marginBottom: '10px' }}>
                                                        {formattingWhatsappText(typeof msgObj === 'string' ? msgObj : msgObj.message)}
                                                    </div>
                                                    {msgObj.buttons && Array.isArray(msgObj.buttons) && msgObj.buttons.length > 0 && (
                                                        <div>
                                                            <strong>{getTranslation('Buttons')}:</strong>
                                                            <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                                                                {msgObj.buttons.map((button: any, btnIndex: number) => (
                                                                    <li key={btnIndex}>
                                                                        {button.text} ({button.type}) {button.url && `- ${button.url}`}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    }
                                    type="info"
                                    showIcon
                                    style={{ marginBottom: '10px' }}
                                />
                            )}

                            {/* Renderiza sugestões de melhoria */}
                            {(apiSuggestions.data?.suggestions || apiSuggestions.suggestions) && Array.isArray(apiSuggestions.data?.suggestions || apiSuggestions.suggestions) && (apiSuggestions.data?.suggestions || apiSuggestions.suggestions).length > 0 && (
                                <Alert
                                    message={getTranslation('Template Suggestions')}
                                    description={
                                        <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                                            {(apiSuggestions.data?.suggestions || apiSuggestions.suggestions).map((suggestion: any, index: number) => (
                                                <li key={index} style={{ marginBottom: '5px' }}>
                                                    {typeof suggestion === 'string' ? suggestion : JSON.stringify(suggestion)}
                                                </li>
                                            ))}
                                        </ul>
                                    }
                                    type="warning"
                                    showIcon
                                    style={{ marginBottom: '10px' }}
                                />
                            )}

                            {/* Renderiza itens para remover */}
                            {(apiSuggestions.data?.remove || apiSuggestions.remove) && Array.isArray(apiSuggestions.data?.remove || apiSuggestions.remove) && (apiSuggestions.data?.remove || apiSuggestions.remove).length > 0 && (
                                <Alert
                                    message={getTranslation('Content to Remove')}
                                    description={
                                        <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                                            {(apiSuggestions.data?.remove || apiSuggestions.remove).map((item: any, index: number) => (
                                                <li key={index} style={{ marginBottom: '5px' }}>
                                                    {typeof item === 'string' ? item : JSON.stringify(item)}
                                                </li>
                                            ))}
                                        </ul>
                                    }
                                    type="error"
                                    showIcon
                                    style={{ marginBottom: '10px' }}
                                />
                            )}
                        </div>
                    )}

                </>
            )}
        </Drawer>
    );
};

export default i18n(TemplateSuggestionsModal) as FC<TemplateSuggestionsModalProps>;
