import { ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Drawer, notification, Spin, Typography } from 'antd';
import { FC, useEffect, useState } from 'react';
import styled from 'styled-components';
import { formattingWhatsappText } from '../../../../../../utils/Activity';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { TemplateSuggestionsService } from '../../../../service/TemplateSuggestionsService';
import { InlineStyleType } from '../DraftEditor/props';
import { markdownToHtml } from '../markdown-helper';
import { TemplateInsightsModalProps } from './props';

const { Title, Paragraph, Text } = Typography;

const InsightContainer = styled.div`
    padding: 16px;
    background-color: #f9f9f9;
    border-radius: 4px;
    margin-bottom: 16px;
    border-left: 4px solid #1890ff;
`;

const TemplateInsightsModal: FC<TemplateInsightsModalProps & I18nProps> = ({
    activeModal,
    onClose,
    workspaceId,
    template,
    getTranslation,
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [insight, setInsight] = useState<string | null>(null);

    useEffect(() => {
        // Limpa o estado quando o modal é fechado
        if (activeModal !== InlineStyleType.AI_INSIGHT) {
            setInsight(null);
            setError(null);
            setLoading(false);
        }
        // Busca insights quando o modal é aberto
        else if (template?.message) {
            fetchInsight();
        }
    }, [activeModal, template?.message]);

    // Função adicional para forçar o recarregamento
    const reloadInsights = () => {
        setLoading(true);
        setError(null);
        setInsight(null);
        fetchInsight();
    };

    const fetchInsight = async () => {
        if (!template?.message || !workspaceId) return;

        setLoading(true);
        setError(null);
        if (!template?.message || template?.message.trim().length < 20) {
            notification.warning({
                message: 'Mensagem muito curta',
                description: 'A mensagem precisa ter pelo menos 20 caracteres.',
            });
            return onClose();
        }

        try {
            const response = await TemplateSuggestionsService.getTemplateMessageMarketingInsights(
                workspaceId,
                template.message,
                (err) => {
                    console.error('Error fetching insights:', err);
                    setError(err?.message || 'Falha ao buscar insights');
                }
            );

            console.log('Insights response:', response);

            // Verifica ambos os formatos possíveis de resposta
            if (response?.data?.insight) {
                setInsight(response.data.insight);
            } else if (response?.data?.insights) {
                setInsight(response.data.insights);
            } else {
                setError('Não há insights disponíveis para este template');
            }
        } catch (err) {
            setError('Falha ao buscar insights');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer
            title='Insights de Template de Marketing'
            placement='right'
            width={700}
            onClose={onClose}
            open={activeModal === InlineStyleType.AI_INSIGHT}
            footer={
                <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'space-between' }}>
                    <Button icon={<ReloadOutlined />} onClick={reloadInsights} disabled={loading}>
                        Atualizar
                    </Button>
                    <Button onClick={onClose}>Fechar</Button>
                </div>
            }
        >
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Spin size='large' />
                    <Paragraph style={{ marginTop: 16 }}>Carregando insights para seu template...</Paragraph>
                </div>
            ) : error ? (
                <Alert message='Erro' description={error} type='error' showIcon />
            ) : (
                <>
                    <Title level={4}>Análise do Template</Title>
                    <Text type='secondary'>
                        Este insight explica por que seu template de marketing pode ter sido rejeitado e como
                        melhorá-lo:
                    </Text>

                    {insight && (
                        <InsightContainer>
                            <div
                                dangerouslySetInnerHTML={{ __html: markdownToHtml(insight) }}
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '1.6',
                                }}
                            />
                        </InsightContainer>
                    )}

                    <Title level={4} style={{ marginTop: 24 }}>
                        Template Atual
                    </Title>
                    <div
                        style={{
                            background: '#f5f5f5',
                            padding: 16,
                            borderRadius: 4,
                            fontSize: '14px',
                            lineHeight: '1.6',
                        }}
                    >
                        {formattingWhatsappText(template?.message || '')}
                    </div>
                </>
            )}
        </Drawer>
    );
};

export default i18n(TemplateInsightsModal) as FC<TemplateInsightsModalProps>;
