import { FC, useEffect, useState } from 'react';
import { Card, Button, Switch, Empty, Spin, Tag, Tooltip, Modal, Form, Input, Checkbox } from 'antd';
import { PlusOutlined, SettingOutlined, DeleteOutlined, BulbOutlined, BugOutlined } from '@ant-design/icons';
import { AIAgentService, AgentSkill, SkillEnum } from '../../../../../../service/AIAgentService';
import { addNotification } from '../../../../../../../../utils/AddNotification';
import TestTrainingModal from '../TestTrainingModal';

interface SkillsTabProps {
    agentId: string;
    workspaceId: string;
    getTranslation: (key: string) => string;
    agent?: any;
}

const skillInfo = {
    [SkillEnum.listInsurances]: {
        name: 'Listar Convênios',
        description: 'Permite ao agente consultar e listar todos os convênios disponíveis',
        summary: 'Consulta convênios médicos disponíveis no sistema',
        color: '#5DADE2'
    },
    [SkillEnum.listDoctors]: {
        name: 'Listar Médicos',
        description: 'Permite ao agente buscar e listar médicos disponíveis',
        summary: 'Busca e lista médicos cadastrados no sistema',
        color: '#58D68D'
    },
    [SkillEnum.listSpecialities]: {
        name: 'Listar Especialidades',
        description: 'Permite ao agente consultar todas as especialidades disponíveis',
        summary: 'Consulta especialidades médicas disponíveis',
        color: '#E67E22'
    },
    [SkillEnum.listAppointments]: {
        name: 'Listar Consultas',
        description: 'Permite ao agente consultar e listar todas as consultas disponíveis',
        summary: 'Consulta consultas médicas agendadas no sistema',
        color: '#9B59B6'
    }
};

const SkillsTab: FC<SkillsTabProps> = ({ agentId, workspaceId, getTranslation, agent }) => {
    const [skills, setSkills] = useState<AgentSkill[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [configModalVisible, setConfigModalVisible] = useState(false);
    const [selectedSkill, setSelectedSkill] = useState<AgentSkill | null>(null);
    const [testModalVisible, setTestModalVisible] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        loadSkills();
    }, [agentId, workspaceId]);

    const loadSkills = async () => {
        setLoading(true);
        try {
            const response = await AIAgentService.listAgentSkills(workspaceId, { agentId }, (err) => {
                addNotification({
                    title: getTranslation('Erro'),
                    message: getTranslation('Erro ao carregar habilidades'),
                    type: 'danger',
                    duration: 3000,
                });
            });
            setSkills(response || []);
        } catch (error) {
            console.error('Error loading skills:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSkill = async (skillName: SkillEnum) => {
        setActionLoading(skillName);
        try {
            await AIAgentService.createAgentSkill(workspaceId, {
                name: skillName,
                agentId,
                isActive: true,
            }, (err) => {
                addNotification({
                    title: getTranslation('Erro'),
                    message: getTranslation('Erro ao adicionar habilidade'),
                    type: 'danger',
                    duration: 3000,
                });
            });
            
            await loadSkills();
            addNotification({
                title: getTranslation('Sucesso'),
                message: getTranslation('Habilidade adicionada com sucesso'),
                type: 'success',
                duration: 3000,
            });
        } catch (error) {
            console.error('Error adding skill:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleSkill = async (skill: AgentSkill) => {
        setActionLoading(skill.id);
        try {
            await AIAgentService.updateAgentSkill(workspaceId, {
                skillId: skill.id,
                name: skill.name,
                agentId,
                isActive: !skill.isActive,
                prompt: skill.prompt || undefined,
            }, (err) => {
                addNotification({
                    title: getTranslation('Erro'),
                    message: getTranslation('Erro ao atualizar habilidade'),
                    type: 'danger',
                    duration: 3000,
                });
            });
            
            await loadSkills();
        } catch (error) {
            console.error('Error updating skill:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteSkill = async (skill: AgentSkill) => {
        setActionLoading(skill.id);
        try {
            await AIAgentService.deleteAgentSkill(workspaceId, {
                skillId: skill.id,
                agentId,
            }, (err) => {
                addNotification({
                    title: getTranslation('Erro'),
                    message: getTranslation('Erro ao remover habilidade'),
                    type: 'danger',
                    duration: 3000,
                });
            });
            
            await loadSkills();
            addNotification({
                title: getTranslation('Sucesso'),
                message: getTranslation('Habilidade removida com sucesso'),
                type: 'success',
                duration: 3000,
            });
        } catch (error) {
            console.error('Error deleting skill:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleConfigureSkill = (skill: AgentSkill) => {
        setSelectedSkill(skill);
        setConfigModalVisible(true);
        form.setFieldsValue({
            description: skill.description || '',
            prompt: skill.prompt || '',
            isActive: skill.isActive
        });
    };

    const handleSaveConfiguration = async () => {
        if (!selectedSkill) return;

        try {
            const values = await form.validateFields();
            setActionLoading(selectedSkill.id);

            await AIAgentService.updateAgentSkill(workspaceId, {
                skillId: selectedSkill.id,
                name: selectedSkill.name,
                agentId,
                isActive: values.isActive,
                description: values.description,
                prompt: values.prompt || undefined,
            }, (err) => {
                addNotification({
                    title: getTranslation('Erro'),
                    message: getTranslation('Erro ao salvar configuração'),
                    type: 'danger',
                    duration: 3000,
                });
            });

            await loadSkills();
            setConfigModalVisible(false);
            setSelectedSkill(null);
            form.resetFields();
            
            addNotification({
                title: getTranslation('Sucesso'),
                message: getTranslation('Configuração salva com sucesso'),
                type: 'success',
                duration: 3000,
            });
        } catch (error) {
            console.error('Error saving configuration:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const getAvailableSkills = () => {
        const existingSkills = skills.map(skill => skill.name);
        return Object.values(SkillEnum).filter(skill => !existingSkills.includes(skill));
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px', color: '#666' }}>
                    {getTranslation('Carregando habilidades...')}
                </div>
            </div>
        );
    }

    const availableSkills = getAvailableSkills();

    return (
        <div style={{ padding: '0 24px 24px' }}>
            <div style={{ marginBottom: '24px' }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px'
                    }}>
                        <BulbOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                            {getTranslation('Habilidades do Agente')}
                        </h3>
                    </div>
                    <Button
                        icon={<BugOutlined />}
                        onClick={() => setTestModalVisible(true)}
                        style={{
                            background: 'linear-gradient(135deg, #13c2c2 0%, #08979c 100%)',
                            border: 'none',
                            color: 'white',
                            boxShadow: '0 2px 4px rgba(19, 194, 194, 0.3)',
                        }}
                        className='antd-span-default-color'
                    >
                        {getTranslation('Testar Habilidades')}
                    </Button>
                </div>
                <p style={{ color: '#666', margin: 0, lineHeight: '1.6' }}>
                    {getTranslation('Adicione habilidades específicas que o agente pode executar. Cada habilidade representa uma funcionalidade que pode ser ativada ou desativada conforme necessário.')}
                </p>
            </div>

            {/* Available Skills to Add */}
            {availableSkills.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ 
                        fontSize: '16px', 
                        fontWeight: '500', 
                        marginBottom: '16px',
                        color: '#333'
                    }}>
                        {getTranslation('Habilidades Disponíveis')}
                    </h4>
                    <div style={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '16px'
                    }}>
                        {availableSkills.map((skillName) => (
                            <Card
                                key={skillName}
                                size="small"
                                style={{
                                    borderLeft: `4px solid ${skillInfo[skillName].color}`,
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer'
                                }}
                                bodyStyle={{ padding: '16px' }}
                                hoverable
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <Tag color={skillInfo[skillName].color} style={{ margin: 0 }}>
                                                {skillInfo[skillName].name}
                                            </Tag>
                                        </div>
                                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                                            {skillInfo[skillName].description}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
                                            {skillInfo[skillName].summary}
                                        </div>
                                    </div>
                                    <Button
                                        type="primary"
                                        size="small"
                                        icon={<PlusOutlined />}
                                        loading={actionLoading === skillName}
                                        onClick={() => handleAddSkill(skillName)}
                                        style={{
                                            backgroundColor: skillInfo[skillName].color,
                                            borderColor: skillInfo[skillName].color
                                        }}
                                    >
                                        {getTranslation('Instalar')}
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Active Skills */}
            <div>
                <h4 style={{ 
                    fontSize: '16px', 
                    fontWeight: '500', 
                    marginBottom: '16px',
                    color: '#333'
                }}>
                    {getTranslation('Habilidades Ativas')} ({skills.length})
                </h4>
                
                {skills.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={getTranslation('Nenhuma habilidade adicionada ainda')}
                        style={{ padding: '40px 0' }}
                    />
                ) : (
                    <div style={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                        gap: '16px'
                    }}>
                        {skills.map((skill) => (
                            <Card
                                key={skill.id}
                                size="small"
                                style={{
                                    borderLeft: `4px solid ${skill.isActive ? skillInfo[skill.name]?.color || '#1890ff' : '#d9d9d9'}`,
                                    opacity: skill.isActive ? 1 : 0.7,
                                    transition: 'all 0.3s ease'
                                }}
                                bodyStyle={{ padding: '16px' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <Tag 
                                                color={skill.isActive ? (skillInfo[skill.name]?.color || '#1890ff') : 'default'}
                                                style={{ margin: 0 }}
                                            >
                                                {skillInfo[skill.name]?.name || skill.name}
                                            </Tag>
                                            {skill.isActive && (
                                                <Tag color="success">
                                                    {getTranslation('Ativa')}
                                                </Tag>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                                            {skill.description || skillInfo[skill.name]?.description || getTranslation('Habilidade personalizada')}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#999', fontStyle: 'italic', marginBottom: '12px' }}>
                                            {skillInfo[skill.name]?.summary || getTranslation('Skill personalizada')}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                                        <Switch
                                            checked={skill.isActive}
                                            loading={actionLoading === skill.id}
                                            onChange={() => handleToggleSkill(skill)}
                                            size="small"
                                        />
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <Tooltip title={getTranslation('Configurar')}>
                                                <Button
                                                    size="small"
                                                    icon={<SettingOutlined />}
                                                    type="text"
                                                    onClick={() => handleConfigureSkill(skill)}
                                                />
                                            </Tooltip>
                                            <Tooltip title={getTranslation('Remover')}>
                                                <Button
                                                    size="small"
                                                    icon={<DeleteOutlined />}
                                                    type="text"
                                                    danger
                                                    loading={actionLoading === skill.id}
                                                    onClick={() => handleDeleteSkill(skill)}
                                                />
                                            </Tooltip>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Configuration Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <SettingOutlined style={{ color: '#1890ff' }} />
                        <span>
                            {getTranslation('Configurar Habilidade')}: {selectedSkill ? skillInfo[selectedSkill.name]?.name || selectedSkill.name : ''}
                        </span>
                    </div>
                }
                open={configModalVisible}
                onOk={handleSaveConfiguration}
                onCancel={() => {
                    setConfigModalVisible(false);
                    setSelectedSkill(null);
                    form.resetFields();
                }}
                confirmLoading={actionLoading === selectedSkill?.id}
                okText={getTranslation('Salvar')}
                cancelText={getTranslation('Cancelar')}
                width={600}
                okButtonProps={{ className: 'antd-span-default-color' }}
            >
                {selectedSkill && (
                    <Form
                        form={form}
                        layout="vertical"
                        style={{ paddingTop: '16px' }}
                    >
                        <div style={{
                            background: '#f8f9fa',
                            border: '1px solid #e9ecef',
                            borderRadius: '8px',
                            padding: '16px',
                            marginBottom: '24px'
                        }}>
                            <div style={{ 
                                fontSize: '14px', 
                                fontWeight: '500', 
                                color: '#495057',
                                marginBottom: '8px'
                            }}>
                                {skillInfo[selectedSkill.name]?.name || selectedSkill.name}
                            </div>
                            <div style={{ 
                                fontSize: '13px', 
                                color: '#6c757d',
                                marginBottom: '8px'
                            }}>
                                {skillInfo[selectedSkill.name]?.description}
                            </div>
                            <div style={{ 
                                fontSize: '12px', 
                                color: '#868e96',
                                fontStyle: 'italic'
                            }}>
                                {skillInfo[selectedSkill.name]?.summary}
                            </div>
                        </div>

                        <Form.Item 
                            name="isActive" 
                            valuePropName="checked"
                            style={{ marginBottom: '24px' }}
                        >
                            <Checkbox>
                                {getTranslation('Habilidade ativa')}
                            </Checkbox>
                        </Form.Item>

                        <Form.Item 
                            label={getTranslation('Descrição personalizada')} 
                            name="description"
                        >
                            <Input.TextArea 
                                rows={3}
                                placeholder={getTranslation('Digite uma descrição personalizada para esta habilidade...')}
                                maxLength={500}
                                showCount
                            />
                        </Form.Item>

                        <Form.Item 
                            label={getTranslation('Prompt personalizado')} 
                            name="prompt"
                        >
                            <Input.TextArea 
                                rows={4}
                                placeholder={getTranslation('Digite um prompt personalizado para esta habilidade...')}
                                maxLength={1000}
                                showCount
                            />
                        </Form.Item>
                    </Form>
                )}
            </Modal>

            {/* Test Training Modal */}
            <TestTrainingModal
                visible={testModalVisible}
                onClose={() => setTestModalVisible(false)}
                agent={agent}
                agentId={agentId}
                workspaceId={workspaceId}
                getTranslation={getTranslation}
            />
        </div>
    );
};

export default SkillsTab;