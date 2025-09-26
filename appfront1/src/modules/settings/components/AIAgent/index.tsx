import { FC, useState } from 'react';
import { Card, Wrapper } from '../../../../ui-kissbot-v2/common';
import Header from '../../../newChannelConfig/components/Header';
import { AIAgentProps } from './props';
import I18n from '../../../i18n/components/i18n';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { ScrollView } from '../ScrollView';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useFormik } from 'formik-latest';
import { AIAgentService, AgentType } from '../../service/AIAgentService';
import { addNotification } from '../../../../utils/AddNotification';
import AgentTable from './components/AgentTable';
import CreateAgentModal from './components/CreateAgentModal';
import AgentDetailsDrawer from './components/AgentDetailsDrawer';
import { useAgentData } from './hooks/useAgentData';
import { useAgentActions } from './hooks/useAgentActions';

const AIAgent: FC<AIAgentProps> = (props) => {
    const { menuSelected, getTranslation, selectedWorkspace } = props;
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Hooks customizados para dados e ações
    const {
        agents,
        loading,
        bots,
        personalities,
        integrations,
        loadAgents
    } = useAgentData({ selectedWorkspace, getTranslation });

    const {
        selectedAgent,
        isDrawerVisible,
        editingInDrawer,
        handleDeleteAgent,
        handleConfigureAgent,
        handleViewAgent,
        handleEditInDrawer,
        handleUpdateAgent,
        closeDrawer,
        handleDrawerDelete
    } = useAgentActions({ 
        selectedWorkspace, 
        getTranslation, 
        onAgentChange: loadAgents,
        personalities 
    });


    // Formik para criação de agentes
    const createFormik = useFormik({
        initialValues: {
            name: '',
            description: '',
            prompt: '',
            personality: '',
            botId: null as string | null,
            isDefault: false,
            agentType: undefined as AgentType | undefined,
            modelName: 'gpt-4o-mini' as string,
            integrationId: undefined as string | undefined,
        },
        validate: (values) => {
            const errors: any = {};
            
            if (!values.name.trim()) {
                errors.name = getTranslation('Nome é obrigatório');
            }
            
            if (!values.description.trim()) {
                errors.description = getTranslation('Descrição é obrigatória');
            }
            
            if (!values.botId) {
                errors.botId = getTranslation('Bot é obrigatório');
            }

            if (!values.modelName) {
                errors.modelName = getTranslation('Modelo é obrigatório');
            }
            
            return errors;
        },
        enableReinitialize: true,
        onSubmit: async (values) => {
            if (!selectedWorkspace?._id) return;

            try {
                const personalityContent = values.personality 
                    ? personalities.find(p => p.identifier === values.personality)?.content || values.personality
                    : values.personality;

                const submitData = {
                    ...values,
                    personality: personalityContent
                };

                await AIAgentService.createAgent(selectedWorkspace._id, submitData);

                addNotification({
                    title: getTranslation('Sucesso'),
                    message: getTranslation('Agente criado com sucesso'),
                    type: 'success',
                    duration: 3000,
                });
                
                setIsModalVisible(false);
                createFormik.resetForm();
                loadAgents();
            } catch (error) {
                console.error('Error saving agent:', error);
                addNotification({
                    title: getTranslation('Erro'),
                    message: getTranslation('Erro ao salvar agente'),
                    type: 'danger',
                    duration: 3000,
                });
            }
        },
    });

    // Formik para edição de agentes
    const editFormik = useFormik({
        initialValues: {
            name: '',
            description: '',
            prompt: '',
            personality: '',
            botId: null as string | null,
            isDefault: false,
            agentType: undefined as AgentType | undefined,
            modelName: 'gpt-4o-mini' as string,
            integrationId: undefined as string | undefined,
        },
        validate: (values) => {
            const errors: any = {};
            
            if (!values.name.trim()) {
                errors.name = getTranslation('Nome é obrigatório');
            }
            
            if (!values.description.trim()) {
                errors.description = getTranslation('Descrição é obrigatória');
            }
            
            if (!values.botId) {
                errors.botId = getTranslation('Bot é obrigatório');
            }

            if (!values.modelName) {
                errors.modelName = getTranslation('Modelo é obrigatório');
            }
            
            return errors;
        },
        enableReinitialize: true,
        onSubmit: () => handleUpdateAgent(editFormik),
    });

    const handleCreateAgent = () => {
        createFormik.resetForm();
        setIsModalVisible(true);
    };

    const handleEditAgent = (agent: any) => {
        const personalityIdentifier = agent.personality 
            ? personalities.find(p => p.content === agent.personality)?.identifier || agent.personality
            : '';
        
        editFormik.setValues({
            name: agent.name,
            description: agent.description,
            prompt: agent.prompt,
            personality: personalityIdentifier,
            botId: agent.botId || null,
            isDefault: agent.isDefault,
            agentType: agent.agentType,
            modelName: agent.modelName || 'gpt-4o-mini',
            integrationId: agent.integrationId || undefined,
        });
        
        handleEditInDrawer(agent);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        createFormik.resetForm();
    };

    const handleCloseDrawer = () => {
        closeDrawer();
        editFormik.resetForm();
    };


    return (
        <>
            <Wrapper>
                <Header
                    title={menuSelected.title}
                    action={
                        <Button
                            type='primary'
                            icon={<PlusOutlined />}
                            onClick={handleCreateAgent}
                            className='antd-span-default-color'
                        >
                            {getTranslation('Criar Agente')}
                        </Button>
                    }
                />
            </Wrapper>
            <ScrollView id='content-AIAgent'>
                <Wrapper margin='0 auto' maxWidth='100%' minWidth='800px' padding='20px 30px'>
                    <Wrapper flexBox width='100%'>
                        <Card>
                            <AgentTable
                                agents={agents}
                                loading={loading}
                                getTranslation={getTranslation}
                                onConfigure={handleConfigureAgent}
                                onDelete={handleDeleteAgent}
                            />
                        </Card>
                    </Wrapper>
                </Wrapper>
            </ScrollView>

            <CreateAgentModal
                visible={isModalVisible}
                onCancel={handleCloseModal}
                onOk={createFormik.submitForm}
                formik={createFormik}
                getTranslation={getTranslation}
                bots={bots}
                personalities={personalities}
                integrations={integrations}
            />

            <AgentDetailsDrawer
                visible={isDrawerVisible}
                onClose={handleCloseDrawer}
                selectedAgent={selectedAgent}
                editingInDrawer={editingInDrawer}
                onEdit={handleEditAgent}
                onDelete={handleDrawerDelete}
                onSubmitEdit={() => editFormik.submitForm()}
                formik={editFormik}
                getTranslation={getTranslation}
                bots={bots}
                personalities={personalities}
                integrations={integrations}
            />
        </>
    );
};

const mapStateToProps = (state: any) => ({
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
});

const mapDispatchToProps = {};

const ConnectedAIAgent = I18n(withRouter(connect(mapStateToProps, mapDispatchToProps)(AIAgent)));

export default ConnectedAIAgent;
