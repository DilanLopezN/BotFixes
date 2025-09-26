import { Empty, Skeleton } from 'antd';
import { isEmpty } from 'lodash';
import { useEffect, useMemo } from 'react';
import { extractTemplateKeys } from '../../../../../../../utils/extract-template-keys';
import { normalizeText } from '../../../../../../../utils/normalize-text';
import { TemplateMessage } from '../../../../TemplateMessageList/interface';
import { ClosingConversationSteps } from '../../../constants';
import { useTemplates } from '../../hooks/use-templates';
import type { TemplatePopoverProps } from './interfaces';
import { TemplateCard, TemplateContainer, TemplateText, TemplateTitle } from './styles';
import { Icon } from '../../../../../../../ui-kissbot-v2/common';

export const TemplatePopover = ({
    value,
    conversation,
    channels,
    hasResponse,
    onChangeMessage,
    setSelectedTemplate,
    setCurrentStep,
    setIsPopoverOpen,
}: TemplatePopoverProps) => {
    const { fetchTemplates, templates, isFetchingTemplates } = useTemplates();

    const normalizedValue = value ? normalizeText(value.slice(1)) : '';

    const filteredTemplates = useMemo(() => {
        if (!templates) return [];

        return templates.filter((template) => {
            const normalizedTitle = normalizeText(template.name);
            const normalizedMessage = normalizeText(template.message);

            return normalizedTitle.includes(normalizedValue) || normalizedMessage.includes(normalizedValue);
        });
    }, [normalizedValue, templates]);

    const handleClickTemplate = (template: TemplateMessage) => {
        const variables = extractTemplateKeys(template.message);

        if (!variables || isEmpty(variables)) {
            onChangeMessage(template.message);
            setIsPopoverOpen(false);
            return;
        }

        setSelectedTemplate(template);
        setIsPopoverOpen(false);
        setCurrentStep(ClosingConversationSteps.TemplateVariables);
    };

    useEffect(() => {
        if (!conversation || isEmpty(channels)) return;

        const selectedChannel = channels.find((channel) => channel.token === conversation.token);

        if (selectedChannel?._id) {
            fetchTemplates(selectedChannel._id, hasResponse);
        }
    }, [channels, conversation, fetchTemplates, hasResponse]);

    return (
        <TemplateContainer>
            {isFetchingTemplates && (
                <div style={{ padding: 8 }}>
                    <Skeleton />
                </div>
            )}
            {!isFetchingTemplates && isEmpty(filteredTemplates) && (
                <div style={{ padding: 8 }}>
                    <Empty />
                </div>
            )}
            {!isFetchingTemplates &&
                filteredTemplates.map((template) => {
                    return (
                        <TemplateCard
                            key={template._id}
                            onClick={() => {
                                handleClickTemplate(template);
                            }}
                            role='button'
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 16,
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 4,
                                }}
                            >
                                <TemplateTitle>/ {template.name}</TemplateTitle>
                                {template.isHsm && (
                                    <Icon
                                        style={{ margin: '0 0 0 5px' }}
                                        size='16px'
                                        name='whatsapp'
                                        title={'Template Oficial'}
                                    />
                                )}
                            </div>
                            <TemplateText>{template.message}</TemplateText>
                        </TemplateCard>
                    );
                })}
        </TemplateContainer>
    );
};
