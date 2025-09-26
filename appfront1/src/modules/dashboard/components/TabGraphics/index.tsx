import { FC, useState } from 'react';
import { PageTemplate } from '../../../../shared-v2/page-template';
import { PrimaryButton, Wrapper } from '../../../../ui-kissbot-v2/common';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import GraphicsWrapper from './components/GraphicsWrapper';
import {
    ChartInterval,
    ChartType,
    ConversationTemplate,
    Operator,
    TemplateGroupField,
    TemplateGroupInterface,
    TemplateMetrics,
} from './interfaces/conversation-template-interface';
import { TabGraphicsProps } from './props';

export const defaultConversationTemplate: ConversationTemplate = {
    chartType: ChartType.line,
    conditions: [
        {
            field: TemplateGroupField.no_field,
            values: [],
            operator: Operator.in,
        },
    ],
    interval: ChartInterval.days,
    groupField: TemplateGroupField.no_field,
    metric: TemplateMetrics.total,
    name: 'default',
    position: [0, 1000, 4, 21],
    groupId: '',
};

export const defaultTemplateGroup: TemplateGroupInterface = {
    name: 'Dashboard padrão',
    globalEditable: true,
    shared: true,
    workspaceId: '',
    ownerId: '',
};

const TabConversation2: FC<TabGraphicsProps & I18nProps> = ({
    selectedWorkspace,
    getTranslation,
    menuSelected,
    loggedUser,
}) => {
    const [selectedTemplate, setSelectedTemplate] = useState<ConversationTemplate | undefined>(undefined);
    const [selectedTemplateGroup, setSelectedTemplateGroup] = useState<TemplateGroupInterface | undefined>(undefined);
    const [canAddChart, setCanAddChart] = useState<boolean>(false);

    return (
        <PageTemplate>
            <Wrapper
                flexBox
                style={{
                    justifyContent: 'flex-end',
                    gap: '10px',
                    marginBottom: '16px',
                }}
            >
                {canAddChart && (
                    <PrimaryButton
                        onClick={() => {
                            setSelectedTemplate(defaultConversationTemplate);
                        }}
                    >
                        {getTranslation('Add chart')}
                    </PrimaryButton>
                )}
                <PrimaryButton onClick={() => setSelectedTemplateGroup(defaultTemplateGroup)}>
                    {getTranslation('Create Dashboard')}
                </PrimaryButton>
            </Wrapper>
            <GraphicsWrapper
                conversationTemplate={selectedTemplate}
                setConversationTemplate={(value) => setSelectedTemplate(value)}
                templateGroup={selectedTemplateGroup}
                setTemplateGroup={(value) => setSelectedTemplateGroup(value)}
                selectedWorkspace={selectedWorkspace}
                loggedUser={loggedUser}
                setCanAddChart={(value: boolean) => setCanAddChart(value)}
            />
        </PageTemplate>
    );
};

export default i18n(TabConversation2) as FC<TabGraphicsProps>;
