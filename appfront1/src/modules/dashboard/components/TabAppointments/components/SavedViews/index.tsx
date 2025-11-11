import { ClearOutlined, DeleteOutlined, DownOutlined, EyeOutlined, SaveOutlined } from '@ant-design/icons';
import { Button, Dropdown, Input, Popover, Space, Typography, message } from 'antd';
import { FC, useEffect, useState } from 'react';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { DashboardService } from '../../../../services/DashboardService';
import { SavedView, SavedViewsProps } from './props';

const { Text } = Typography;

const SavedViews: FC<SavedViewsProps & I18nProps> = ({
    currentViewConfig,
    onLoadView,
    onResetFilters,
    workspaceId,
    getTranslation,
}) => {
    const [savedViews, setSavedViews] = useState<SavedView[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const [viewName, setViewName] = useState('');
    const [loading, setLoading] = useState(false);
    const [deletePopoverVisible, setDeletePopoverVisible] = useState<string | null>(null);
    const [editingView, setEditingView] = useState<SavedView | null>(null);

    const USER_SETTING_TYPE = 'appointments-pivot';

    useEffect(() => {
        loadSavedViews();
    }, [workspaceId]);

    const loadSavedViews = async () => {
        try {
            setLoading(true);
            const views = await DashboardService.getUserSettings(workspaceId, USER_SETTING_TYPE);
            // Filtra valores undefined/null e garante que é um array válido
            const validViews = Array.isArray(views) ? views.filter((v) => v && v.id) : [];
            setSavedViews(validViews);
        } catch (error) {
            console.error('Erro ao carregar visões salvas:', error);
            message.error(getTranslation('Erro ao carregar visões salvas'));
            setSavedViews([]);
        } finally {
            setLoading(false);
        }
    };

    const saveCurrentView = async () => {
        if (!viewName.trim()) {
            message.error(getTranslation('Por favor, digite um nome para a visão'));
            return;
        }

        if (!currentViewConfig && !editingView) {
            message.error(getTranslation('Nenhuma configuração de visão para salvar'));
            return;
        }

        try {
            setLoading(true);

            if (editingView) {
                // Atualizar visão existente
                const updatedView = await DashboardService.updateUserSetting(
                    workspaceId,
                    USER_SETTING_TYPE,
                    editingView.key,
                    {
                        value: currentViewConfig || editingView.value,
                        label: viewName.trim(),
                    }
                );

                // Valida se a resposta é válida antes de mostrar sucesso
                if (!updatedView || !updatedView.id) {
                    throw new Error('Resposta inválida da API');
                }

                setSavedViews((prev) => prev.map((v) => (v.id === updatedView.id ? updatedView : v)));
                message.success(getTranslation('Visão atualizada com sucesso'));
            } else {
                // Criar nova visão
                if (!currentViewConfig) {
                    throw new Error('Configuração de visão não disponível');
                }

                const key = `view_${Date.now()}_${viewName.trim().toLowerCase().replace(/\s+/g, '_')}`;

                const newView = await DashboardService.createUserSetting(workspaceId, {
                    key,
                    value: currentViewConfig,
                    type: USER_SETTING_TYPE,
                    label: viewName.trim(),
                });

                // Valida se a resposta é válida antes de mostrar sucesso
                if (!newView || !newView.id) {
                    throw new Error('Resposta inválida da API');
                }

                setSavedViews((prev) => [...prev, newView]);
                message.success(getTranslation('Visão salva com sucesso'));
            }

            setViewName('');
            setEditingView(null);
            setIsModalVisible(false);
        } catch (error: any) {
            console.error('Erro ao salvar visão:', error);
            if (error?.status === 409) {
                message.error(getTranslation('Já existe uma visão com este nome'));
            } else {
                message.error(getTranslation('Erro ao salvar visão'));
            }
        } finally {
            setLoading(false);
        }
    };

    const loadView = (view: SavedView) => {
        try {
            onLoadView(view.value);
            setIsDropdownVisible(false);
            message.success(getTranslation('Visão carregada com sucesso'));
        } catch (error) {
            console.error('Erro ao carregar visão:', error);
            message.error(getTranslation('Erro ao carregar visão'));
        }
    };

    const confirmDeleteView = async (view: SavedView) => {
        try {
            setLoading(true);
            await DashboardService.deleteUserSetting(workspaceId, USER_SETTING_TYPE, view.key);
            setSavedViews((prev) => prev.filter((v) => v.id !== view.id));
            message.success(getTranslation('Visão excluída com sucesso'));
            setDeletePopoverVisible(null);
        } catch (error) {
            console.error('Erro ao deletar visão:', error);
            message.error(getTranslation('Erro ao excluir visão'));
        } finally {
            setLoading(false);
        }
    };

    const handleOpenSaveModal = () => {
        setEditingView(null);
        setViewName('');
        setIsModalVisible(true);
    };

    const handleUpdateViewFilters = async (view: SavedView, e: React.MouseEvent) => {
        e.stopPropagation();

        if (!currentViewConfig) {
            message.error(getTranslation('Nenhuma configuração de filtros para salvar'));
            return;
        }

        try {
            setLoading(true);

            const updatedView = await DashboardService.updateUserSetting(workspaceId, USER_SETTING_TYPE, view.key, {
                value: currentViewConfig,
                label: view.label, // Mantém o nome original
            });

            // Valida se a resposta é válida antes de mostrar sucesso
            if (!updatedView || !updatedView.id) {
                throw new Error('Resposta inválida da API');
            }

            setSavedViews((prev) => prev.map((v) => (v.id === updatedView.id ? updatedView : v)));
            setIsDropdownVisible(false);
            message.success(getTranslation('Filtros salvos na visão com sucesso'));
        } catch (error: any) {
            console.error('Erro ao atualizar visão:', error);
            message.error(getTranslation('Erro ao salvar filtros na visão'));
        } finally {
            setLoading(false);
        }
    };

    const getDeletePopoverContent = (view: SavedView) => (
        <div style={{ maxWidth: 250 }}>
            <Text style={{ display: 'block', marginBottom: 12 }}>
                {getTranslation('Tem certeza que deseja excluir a visão')} <strong>"{view.label}"</strong>?
            </Text>
            <Space>
                <Button size='small' onClick={() => setDeletePopoverVisible(null)}>
                    {getTranslation('Cancelar')}
                </Button>
                <Button size='small' danger type='primary' onClick={() => confirmDeleteView(view)} loading={loading}>
                    {getTranslation('Excluir')}
                </Button>
            </Space>
        </div>
    );

    const saveModalContent = (
        <div style={{ width: 300 }}>
            <Text style={{ display: 'block', marginBottom: 12 }}>
                {editingView
                    ? getTranslation('Editar nome da visão:')
                    : getTranslation('Digite um nome para esta visão:')}
            </Text>
            <Input
                placeholder={getTranslation('Nome da visão')}
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                onPressEnter={saveCurrentView}
                style={{ marginBottom: 12 }}
            />
            <Space>
                <Button
                    onClick={() => {
                        setIsModalVisible(false);
                        setEditingView(null);
                        setViewName('');
                    }}
                >
                    {getTranslation('Cancelar')}
                </Button>
                <Button type='primary' onClick={saveCurrentView} className='antd-span-default-color' loading={loading}>
                    <span className='antd-span-default-color'>
                        {editingView ? getTranslation('Atualizar') : getTranslation('Salvar')}
                    </span>
                </Button>
            </Space>
        </div>
    );

    const viewsMenuItems = [
        ...(!savedViews || savedViews.length === 0
            ? [
                  {
                      key: 'no-views',
                      label: (
                          <Text type='secondary' style={{ fontStyle: 'italic' }}>
                              {getTranslation('Nenhuma visão salva')}
                          </Text>
                      ),
                      disabled: true,
                  },
              ]
            : savedViews
                  .filter((v) => v && v.id)
                  .slice(0, 10)
                  .map((view) => ({
                      key: view.id,
                      label: (
                          <div
                              style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  minWidth: 280,
                              }}
                          >
                              <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => loadView(view)}>
                                  <div style={{ fontWeight: 500 }}>{view.label}</div>
                                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                                      {new Date(view.createdAt).toLocaleDateString()} às{' '}
                                      {new Date(view.createdAt).toLocaleTimeString('pt-BR', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                      })}
                                  </div>
                              </div>
                              <Space size='small'>
                                  <Button
                                      size='small'
                                      type='text'
                                      icon={<SaveOutlined />}
                                      onClick={(e) => handleUpdateViewFilters(view, e)}
                                      title={getTranslation('Salvar filtros nessa visão')}
                                      loading={loading}
                                  />
                                  <Popover
                                      content={getDeletePopoverContent(view)}
                                      title={getTranslation('Confirmar exclusão')}
                                      trigger='click'
                                      open={deletePopoverVisible === view.id}
                                      onOpenChange={(visible) => {
                                          if (visible) {
                                              setDeletePopoverVisible(view.id);
                                          } else {
                                              setDeletePopoverVisible(null);
                                          }
                                      }}
                                      placement='topRight'
                                      overlayStyle={{ zIndex: 2200 }}
                                  >
                                      <Button
                                          size='small'
                                          type='text'
                                          danger
                                          icon={<DeleteOutlined />}
                                          onClick={(e) => {
                                              e.stopPropagation();
                                          }}
                                          title={getTranslation('Excluir visão')}
                                      />
                                  </Popover>
                              </Space>
                          </div>
                      ),
                  }))),
        ...(savedViews && savedViews.length > 10
            ? [
                  {
                      key: 'more',
                      label: (
                          <Text type='secondary' style={{ fontStyle: 'italic', textAlign: 'center', display: 'block' }}>
                              + {savedViews.length - 10} {getTranslation('mais visões...')}
                          </Text>
                      ),
                      disabled: true,
                  },
              ]
            : []),
    ];

    return (
        <Space>
            <Popover
                content={saveModalContent}
                title={editingView ? getTranslation('Editar visão') : getTranslation('Salvar visão atual')}
                trigger='click'
                open={isModalVisible}
                onOpenChange={setIsModalVisible}
                placement='bottomRight'
            >
                <Button
                    type='primary'
                    icon={<SaveOutlined style={{ verticalAlign: 'middle' }} />}
                    className='antd-span-default-color'
                    onClick={handleOpenSaveModal}
                    loading={loading}
                    style={{ display: 'inline-flex', alignItems: 'center' }}
                >
                    <span className='antd-span-default-color'>{getTranslation('Salvar')}</span>
                </Button>
            </Popover>

            <Dropdown
                menu={{ items: viewsMenuItems }}
                trigger={['click']}
                open={isDropdownVisible}
                onOpenChange={setIsDropdownVisible}
                placement='bottomRight'
                overlayStyle={{ minWidth: 320 }}
            >
                <Button
                    icon={<EyeOutlined style={{ verticalAlign: 'middle' }} />}
                    onClick={() => setIsDropdownVisible(!isDropdownVisible)}
                    style={{ display: 'inline-flex', alignItems: 'center' }}
                >
                    {getTranslation('Visões')} (
                    {Array.isArray(savedViews) ? savedViews.filter((v) => v && v.id).length : 0})
                    <DownOutlined style={{ marginLeft: 4, fontSize: '10px' }} />
                </Button>
            </Dropdown>

            {onResetFilters && (
                <Button
                    icon={<ClearOutlined style={{ verticalAlign: 'middle' }} />}
                    onClick={onResetFilters}
                    title={getTranslation('Resetar filtros')}
                    style={{ display: 'inline-flex', alignItems: 'center' }}
                >
                    {getTranslation('Resetar')}
                </Button>
            )}
        </Space>
    );
};

export default i18n(SavedViews) as FC<SavedViewsProps>;
