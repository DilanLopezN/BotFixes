import { FC, useState } from 'react';
import { Card, Wrapper } from '../../../../ui-kissbot-v2/common';
import Header from '../../../newChannelConfig/components/Header';
import { AIAgentProps } from './props';
import I18n from '../../../i18n/components/i18n';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { ScrollView } from '../ScrollView';
import { Button, Modal, Space } from 'antd';
import { PlusOutlined, BookOutlined } from '@ant-design/icons';
import { useFormik } from 'formik-latest';
import { AIAgentService, AgentType, AgentContext } from '../../service/AIAgentService';
import { addNotification } from '../../../../utils/AddNotification';
import AgentCards from './components/AgentCards';
import CreateAgentModal from './components/CreateAgentModal';
import AgentDetailsDrawer from './components/AgentDetailsDrawer';
import { useAgentData } from './hooks/useAgentData';
import { useAgentActions } from './hooks/useAgentActions';
import IntentLibraryManager from './components/IntentLibrary';

const AIAgent: FC<AIAgentProps> = (props) => {
    const { menuSelected, getTranslation, selectedWorkspace } = props;
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isLibraryModalVisible, setIsLibraryModalVisible] = useState(false);
    const [openLibraryCreate, setOpenLibraryCreate] = useState<(() => void) | null>(null);

    // Hooks customizados para dados e ações
    const {
        agents,
        loading,
        bots,
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
        onAgentChange: loadAgents
    });


    // Formik para criação de agentes
    const createFormik = useFormik({
        initialValues: {
            name: '',
            description: '',
            prompt: '',
            botId: null as string | null,
            isDefault: false,
            agentType: undefined as AgentType | undefined,
            agentContext: null as AgentContext | null,
            modelName: 'gpt-4o-mini' as string,
            integrationId: undefined as string | undefined,
            allowSendAudio: false,
            allowResponseWelcome: false,
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
                const submitData = {
                    ...values,
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
            botId: null as string | null,
            isDefault: false,
            agentType: undefined as AgentType | undefined,
            agentContext: null as AgentContext | null,
            modelName: 'gpt-4o-mini' as string,
            integrationId: undefined as string | undefined,
            allowSendAudio: false,
            allowResponseWelcome: false,
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
        editFormik.setValues({
            name: agent.name,
            description: agent.description,
            prompt: agent.prompt,
            botId: agent.botId || null,
            isDefault: agent.isDefault,
            agentType: agent.agentType,
            agentContext: agent.agentContext || null,
            modelName: agent.modelName || 'gpt-4o-mini',
            integrationId: agent.integrationId || undefined,
            allowSendAudio: agent.allowSendAudio || false,
            allowResponseWelcome: agent.allowResponseWelcome || false,
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
                        <Space size={12}>
                            <Button
                                icon={<BookOutlined />}
                                onClick={() => setIsLibraryModalVisible(true)}
                                className='antd-span-default-color'
                            >
                                {getTranslation('Biblioteca de Intenções')}
                            </Button>
                            <Button
                                type='primary'
                                icon={<PlusOutlined />}
                                onClick={handleCreateAgent}
                                className='antd-span-default-color'
                            >
                                {getTranslation('Criar Agente')}
                            </Button>
                        </Space>
                    }
                />
            </Wrapper>
            <ScrollView id='content-AIAgent'>
                <Wrapper margin='0 auto' maxWidth='100%' padding='20px 30px'>
                    <AgentCards
                        agents={agents}
                        loading={loading}
                        getTranslation={getTranslation}
                        onConfigure={handleConfigureAgent}
                        onDelete={handleDeleteAgent}
                    />
                </Wrapper>
            </ScrollView>

            <CreateAgentModal
                visible={isModalVisible}
                onCancel={handleCloseModal}
                onOk={createFormik.submitForm}
                formik={createFormik}
                getTranslation={getTranslation}
                bots={bots}
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
                integrations={integrations}
            />

            <Modal
                title={
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingRight: '48px',
                        }}
                    >
                        <span>{getTranslation('Biblioteca de Intenções')}</span>
                        <Button
                            type='primary'
                            icon={<PlusOutlined />}
                            onClick={() => openLibraryCreate?.()}
                            disabled={!selectedWorkspace?._id || !openLibraryCreate}
                            className='antd-span-default-color'
                        >
                            {getTranslation('Nova intenção na biblioteca')}
                        </Button>
                    </div>
                }
                visible={isLibraryModalVisible}
                onCancel={() => {
                    setIsLibraryModalVisible(false);
                    setOpenLibraryCreate(null);
                }}
                footer={null}
                width={900}
                destroyOnClose
            >
                <IntentLibraryManager
                    workspaceId={selectedWorkspace?._id}
                    getTranslation={getTranslation}
                    onRegisterCreateAction={(handler) => setOpenLibraryCreate(() => handler)}
                />
            </Modal>
        </>
    );
};

const mapStateToProps = (state: any) => ({
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
});

const mapDispatchToProps = {};

const ConnectedAIAgent = I18n(withRouter(connect(mapStateToProps, mapDispatchToProps)(AIAgent)));

export default ConnectedAIAgent;
