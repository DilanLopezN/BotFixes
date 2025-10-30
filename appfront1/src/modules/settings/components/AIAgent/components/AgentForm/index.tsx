import { FC } from 'react';
import { Select, Checkbox } from 'antd';
import { LabelWrapper } from '../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { TextAreaSimple } from '../../../../../../shared/TextAreaSimple/TextAreaSimple';
import { InputSimple } from '../../../../../../shared/InputSample/InputSimple';
import { AgentType, AgentContext } from '../../../../service/AIAgentService';
import { Bot } from '../../../../../../model/Bot';
import { HealthIntegration } from '../../../../../../model/Integrations';

const { Option } = Select;

interface AgentFormProps {
    formik: any;
    getTranslation: (key: string) => string;
    bots: Bot[];
    personalities: { identifier: string; content: string }[];
    integrations: HealthIntegration[];
}

const AgentForm: FC<AgentFormProps> = ({ 
    formik, 
    getTranslation, 
    bots, 
    personalities, 
    integrations 
}) => {
    return (
        <>
            <LabelWrapper
                label={getTranslation('Nome')}
                validate={{
                    touched: formik.touched,
                    errors: formik.errors,
                    isSubmitted: formik.isSubmitting,
                    fieldName: 'name',
                }}
            >
                <InputSimple
                    value={formik.values.name}
                    placeholder={getTranslation('Nome do agente')}
                    onChange={(e) => formik.setFieldValue('name', e.target.value)}
                />
            </LabelWrapper>

            <LabelWrapper
                label={getTranslation('Descrição')}
                validate={{
                    touched: formik.touched,
                    errors: formik.errors,
                    isSubmitted: formik.isSubmitting,
                    fieldName: 'description',
                }}
            >
                <TextAreaSimple
                    value={formik.values.description}
                    placeholder={getTranslation('Descrição do agente')}
                    onChange={(e) => formik.setFieldValue('description', e.target.value)}
                    style={{ height: '80px', resize: 'none' }}
                />
            </LabelWrapper>

            <LabelWrapper
                label={getTranslation('Prompt')}
                validate={{
                    touched: formik.touched,
                    errors: formik.errors,
                    isSubmitted: formik.isSubmitting,
                    fieldName: 'prompt',
                }}
            >
                <TextAreaSimple
                    value={formik.values.prompt}
                    placeholder={getTranslation('Prompt do sistema para o agente')}
                    onChange={(e) => formik.setFieldValue('prompt', e.target.value)}
                    style={{ height: '120px', resize: 'none' }}
                />
            </LabelWrapper>

            <LabelWrapper
                label={getTranslation('Personalidade')}
                validate={{
                    touched: formik.touched,
                    errors: formik.errors,
                    isSubmitted: formik.isSubmitting,
                    fieldName: 'personality',
                }}
            >
                <Select
                    value={formik.values.personality}
                    onChange={(value) => formik.setFieldValue('personality', value)}
                    style={{ width: '100%' }}
                    placeholder={getTranslation('Selecionar Personalidade')}
                    allowClear
                >
                    {personalities.map((personality) => (
                        <Option key={personality.identifier} value={personality.identifier}>
                            {personality.content || personality.identifier}
                        </Option>
                    ))}
                </Select>
            </LabelWrapper>

            <LabelWrapper
                label={getTranslation('Bot')}
                validate={{
                    touched: formik.touched,
                    errors: formik.errors,
                    isSubmitted: formik.isSubmitting,
                    fieldName: 'botId',
                }}
            >
                <Select
                    value={formik.values.botId}
                    onChange={(value) => formik.setFieldValue('botId', value)}
                    style={{ width: '100%' }}
                    placeholder={getTranslation('Selecionar Bot')}
                >
                    {bots.map((bot) => (
                        <Option key={bot._id} value={bot._id}>
                            {bot.name}
                        </Option>
                    ))}
                </Select>
            </LabelWrapper>

            <LabelWrapper
                label={getTranslation('Modelo')}
                validate={{
                    touched: formik.touched,
                    errors: formik.errors,
                    isSubmitted: formik.isSubmitting,
                    fieldName: 'modelName',
                }}
            >
                <Select
                    value={formik.values.modelName}
                    onChange={(value) => formik.setFieldValue('modelName', value)}
                    style={{ width: '100%' }}
                    placeholder={getTranslation('Selecionar Modelo')}
                >
                    <Option value="gpt-4o-mini">GPT-4o Mini</Option>
                    <Option value="gpt-4.1-mini">GPT-4.1 Mini</Option>
                    <Option value="gpt-5-mini">GPT-5 Mini</Option>
                </Select>
            </LabelWrapper>

            <LabelWrapper
                label={getTranslation('Tipo do Agente')}
                validate={{
                    touched: formik.touched,
                    errors: formik.errors,
                    isSubmitted: formik.isSubmitting,
                    fieldName: 'agentType',
                }}
            >
                <Select
                    value={formik.values.agentType}
                    onChange={(value) => formik.setFieldValue('agentType', value)}
                    style={{ width: '100%' }}
                    placeholder={getTranslation('Selecionar Tipo')}
                    allowClear
                >
                    <Option value={AgentType.REPORT_PROCESSOR_DETECTION}>
                        {getTranslation('Leitor de pedido médico')}
                    </Option>
                    <Option value={AgentType.RAG}>
                        {getTranslation('RAG')}
                    </Option>
                    <Option value={AgentType.ENTITIES_DETECTION}>
                        {getTranslation('Detecção de Entidades')}
                    </Option>
                    <Option value={AgentType.CONVERSATIONAL}>
                        {getTranslation('Conversacional')}
                    </Option>
                </Select>
            </LabelWrapper>

            <LabelWrapper
                label={getTranslation('Contexto do Agente')}
                validate={{
                    touched: formik.touched,
                    errors: formik.errors,
                    isSubmitted: formik.isSubmitting,
                    fieldName: 'agentContext',
                }}
            >
                <Select
                    value={formik.values.agentContext}
                    onChange={(value) => formik.setFieldValue('agentContext', value)}
                    style={{ width: '100%' }}
                    placeholder={getTranslation('Selecionar Contexto')}
                    allowClear
                >
                    <Option value={AgentContext.FAQ}>
                        {getTranslation('FAQ')}
                    </Option>
                    <Option value={AgentContext.GENERAL}>
                        {getTranslation('Geral')}
                    </Option>
                </Select>
            </LabelWrapper>

            <LabelWrapper
                label={getTranslation('Integração')}
                validate={{
                    touched: formik.touched,
                    errors: formik.errors,
                    isSubmitted: formik.isSubmitting,
                    fieldName: 'integrationId',
                }}
            >
                <Select
                    value={formik.values.integrationId}
                    onChange={(value) => formik.setFieldValue('integrationId', value)}
                    style={{ width: '100%' }}
                    placeholder={getTranslation('Selecionar Integração')}
                    allowClear
                >
                    {integrations.map((integration) => (
                        <Option key={integration._id} value={integration._id}>
                            {integration.name}
                        </Option>
                    ))}
                </Select>
            </LabelWrapper>

            <LabelWrapper
                label={getTranslation('Agente Padrão')}
                validate={{
                    touched: formik.touched,
                    errors: formik.errors,
                    isSubmitted: formik.isSubmitting,
                    fieldName: 'isDefault',
                }}
            >
                <Checkbox
                    checked={formik.values.isDefault}
                    onChange={(e) => formik.setFieldValue('isDefault', e.target.checked)}
                >
                    {getTranslation('Definir como agente padrão')}
                </Checkbox>
            </LabelWrapper>
        </>
    );
};

export default AgentForm;
