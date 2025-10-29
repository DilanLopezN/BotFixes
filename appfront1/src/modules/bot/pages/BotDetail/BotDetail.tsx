import { Badge, Button, Dropdown, MenuProps, Modal as ModalAntd, Row, Tooltip } from 'antd';
import { PermissionResources, UserRoles } from 'kissbot-core';
import cloneDeep from 'lodash/cloneDeep';
import moment from 'moment-timezone';
import React, { Component } from 'react';
import { BiLock } from 'react-icons/bi';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Bot } from '../../../../model/Bot';
import { BotAttribute } from '../../../../model/BotAttribute';
import { Interaction, InteractionType } from '../../../../model/Interaction';
import { PaginatedModel } from '../../../../model/PaginatedModel';
import Loader from '../../../../shared/loader';
import { Modal } from '../../../../shared/Modal/Modal';
import { ModalPosition } from '../../../../shared/Modal/ModalProps';
import P from '../../../../shared/Page';
import { DiscardBtn } from '../../../../shared/StyledForms/DiscardBtn/DiscardBtn';
import { DoneBtn } from '../../../../shared/StyledForms/DoneBtn/DoneBtn';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { addNotification } from '../../../../utils/AddNotification';
import { Constants } from '../../../../utils/Constants';
import { getTreeCollapsedLocal } from '../../../../utils/GetLocalStorageTreeCollapsed';
import { timeout } from '../../../../utils/Timer';
import { hasRoleInWorkspace, isAnySystemAdmin, isSystemAdmin, UserPermission } from '../../../../utils/UserPermission';
import { EntityActions } from '../../../entity/redux/actions';
import { EntityService } from '../../../entity/services/EntityService';
import I18n from '../../../i18n/components/i18n';
import { WorkspaceActions } from '../../../workspace/redux/actions';
import InteractionErrors from '../../components/interaction-errors';
import { IconPendingPublicationEntitiesFlow } from '../../components/interaction-errors/styled';
import InteractionPending from '../../components/interaction-pending';
import { ModalContainer } from '../../components/ModalContainer/ModalContainer';
import { ModalInteraction } from '../../components/ModalInteraction/ModalInteraction/ModalInteraction';
import { MountWebchat } from '../../components/MountWebchat/MountWebchat';
import { Tree } from '../../components/TreeComponents/Tree/Tree';
import { ZoomBar } from '../../components/ZoomBar/ZoomBar';
import { InteractionsPendingPublicationContextProvider } from '../../contexts/interactionsPendingPublication';
import { BotActions } from '../../redux/actions';
import { BotService } from '../../services/BotService';
import './BotDetail.scss';
import { BotDetailProps, BotDetailState } from './BotDetailProps';
import { MarginIcons } from './styles';

const LazyJsonModalPreview = React.lazy(() => import('../../../../shared/JsonModalPreview'));

const Page = styled(P)`
    .content {
        padding-top: 0 !important;
    }
`;

const FixedHeader = styled.div`
    padding-top: 25px;
    position: sticky;
    top: 0;
    background: #f2f4f8;
    z-index: 2;
`;

const ButtonSelect = styled(Dropdown.Button)``;

const { confirm } = ModalAntd;

class BotDetailClass extends Component<BotDetailProps, BotDetailState> {
    constructor(props: BotDetailProps) {
        super(props);
        this.state = {
            bot: undefined,
            treeZoom: 90,
            currentExternalInteractionId: undefined,
            showActivityInfo: false,
            activity: undefined,
            modalRevert: false,
            loadingDisabledPublish: false,
            collapseType: 'expanded',
            interactionsPendingPublication: [],
            viewPending: false,
            pendingPublication: { pendingFlows: false, pendingEntities: false },
            publishErrors: [],
        };
        this.getInteractionList();
        this.setBot();
        this.getEntities();
        this.getBotAttributes();
    }

    componentDidUpdate(prevProps: BotDetailProps) {
        const prevParams: any = prevProps.match.params;
        const params: any = this.props.match.params;

        const workspaceChanged = prevParams.workspaceId !== params.workspaceId;
        const botChanged = prevParams.botId !== params.botId;

        if (workspaceChanged || botChanged) {
            this.props.setCurrentBot(undefined);
            this.props.setBotList([] as any);
            this.props.setInteractionList([] as any);

            this.setBot();
            this.getInteractionList();
            this.getEntities();
            this.getBotAttributes();
        }
    }

    private getInteractionList = async () => {
        const { interactionList } = this.props;
        const params: any = this.props.match.params;
        const collapsed = getTreeCollapsedLocal()?.[params.workspaceId]?.[params.botId]?.collapsed;

        const response = await BotService.getInteractions(params.workspaceId, params.botId);
        let interactions = response?.data ?? [];

        interactions = (response?.data ?? []).map((interaction) => {
            if (interaction.type === InteractionType.welcome) return interaction;

            const isCollapsed = interactionList?.find((element) => element._id === interaction._id)?.isCollapsed;
            return { ...interaction, isCollapsed: collapsed ?? isCollapsed };
        });

        this.props.setInteractionList(interactions);

        timeout(() => {
            if (collapsed === true) {
                this.setState((prev) => ({
                    ...prev,
                    collapseType: 'collapsed',
                }));
            } else if (collapsed === false) {
                this.setState((prev) => ({
                    ...prev,
                    collapseType: 'expanded',
                }));
            }
        }, 500);
    };

    componentWillUnmount(): void {
        this.props.setCurrentBot(undefined);
        this.props.setBotList(undefined);
        this.props.setInteractionList(undefined);
    }

    private async getEntities() {
        const params: any = this.props.match.params;
        const entities = await EntityService.getEntityList(params.workspaceId);

        this.props.setEntities(entities?.data || []);
    }

    private getBotAttributes = async () => {
        const params: any = this.props.match.params;
        const botAttributes: PaginatedModel<BotAttribute> = await BotService.getBotAttributes(
            params.workspaceId,
            params.botId
        );
        if (botAttributes) {
            this.props.setBotAttributes(botAttributes.data);
        }
    };

    private getInteractionPending = async () => {
        const params: any = this.props.match.params;

        let error: any;
        await BotService.getInteractionsPendingPublication(
            params.workspaceId,
            params.botId,
            (responseError) => (error = responseError)
        );

        if (error?.error === 'INTERACTIONS_PENDING_PUBLICATION') {
            return error.message;
        }
        return [];
    };

    setPendingInteractionListState = async () => {
        const pendingList = await this.getInteractionPending();
        this.setState({ interactionsPendingPublication: pendingList });
    };

    setPendingInteractionState = (value: { _id: string; name: string }) => {
        const exist = this.state.interactionsPendingPublication?.find((interaction) => interaction._id === value._id);
        if (exist) {
            return;
        }
        let newPending = this.state.interactionsPendingPublication;
        newPending.push(value);
        this.setState({ interactionsPendingPublication: newPending });
    };

    private setBot = async () => {
        const params: any = this.props.match.params;
        const bot: Bot = await BotService.getBot(params.workspaceId, params.botId);
        const pendingPublication = await BotService.pendingPublicationsOnIntegrations(
            params.workspaceId,
            this.props.loggedUser
        );
        const interactionsPending = await this.getInteractionPending();
        const collapse = getTreeCollapsedLocal()?.[params.workspaceId]?.[params.botId]?.collapsed;

        this.setState(
            { bot, interactionsPendingPublication: interactionsPending, pendingPublication: pendingPublication },
            () => this.onCollapseAll(collapse, true)
        );
        this.props.setCurrentBot(bot);

        const { setWorkspaceBots } = this.props;

        setWorkspaceBots(params.workspaceId);
        setTimeout(() => {
            this.checkParamsInteractionId();
        }, 1000);
    };

    setTreeCollapsedLocal = (collapsed) => {
        const params: any = this.props.match.params;
        const treeCollapsed = getTreeCollapsedLocal();
        const replCollapsed = {
            ...treeCollapsed,
            [params.workspaceId]: {
                ...treeCollapsed?.[params.workspaceId],
                [params.botId]: {
                    collapsed: collapsed,
                },
            },
        };
        localStorage.setItem(Constants.LOCAL_STORAGE_MAP.TREE_COLLAPSED, JSON.stringify(replCollapsed));
    };

    onCollapseAll = (isCollapsed, initial?: boolean) => {
        if (isCollapsed === null && initial) {
            return;
        }

        const { interactionList } = this.props;

        if (isCollapsed === null) {
            const params: any = this.props.match.params;
            BotService.getInteractions(params.workspaceId, params.botId).then((success) => {
                this.setTreeCollapsedLocal(isCollapsed);
                this.setState({
                    ...this.state,
                    collapseType: isCollapsed === null ? undefined : isCollapsed ? 'collapsed' : 'expanded',
                });
                return this.props.setInteractionList(success?.data ?? []);
            });
        } else {
            const newListInteraction = interactionList?.map((interaction) => {
                if (interaction.type === InteractionType.welcome) return interaction;
                return { ...interaction, isCollapsed };
            });
            this.setTreeCollapsedLocal(isCollapsed);
            this.setState({
                ...this.state,
                collapseType: isCollapsed ? 'collapsed' : 'expanded',
            });
            this.props.setInteractionList(newListInteraction);
        }
    };

    onZoom = (zoom) => {
        this.setState({ treeZoom: zoom });
    };

    loggedUserCanPublishInteractions = (): boolean => {
        const { workspaceId } = this.props.match.params as any;

        return (
            isAnySystemAdmin(this.props.loggedUser) ||
            hasRoleInWorkspace(this.props.loggedUser, UserRoles.WORKSPACE_ADMIN, workspaceId)
        );
    };

    disabledPublishInteractions = (): boolean => {
        const { bot } = this.state;

        if (!this.props.loggedUser) return true;

        return (
            !isSystemAdmin(this.props.loggedUser) &&
            !!bot?.publishDisabled?.disabled &&
            bot?.publishDisabled?.user?.id !== this.props.loggedUser._id
        );
    };

    updateBot = async (disabled) => {
        let error;
        this.setState({ loadingDisabledPublish: true });
        const { workspaceId } = this.props.match.params as any;

        if (!this.state.bot) return;

        const response = await BotService.updateBot(
            workspaceId,
            { ...this.state.bot, publishDisabled: { disabled, disabledAt: new Date().getTime() } },
            (responseError) => (error = responseError)
        );

        if (!error) {
            addNotification({
                message: this.props.getTranslation(
                    `Publicação ${disabled ? 'desabilitada' : 'habilitada'} com sucesso`
                ),
                title: '',
                type: 'success',
                container: 'top-center',
                insert: 'top',
                duration: 3000,
            });
            return this.setState({ bot: response, loadingDisabledPublish: false });
        } else {
            if (error.message === 'BOT_PUBLISH_DISABLED') {
                addNotification({
                    message: this.props.getTranslation(`Bot já foi desabilitado por ${error.user.name}`),
                    title: '',
                    type: 'danger',
                    container: 'top-center',
                    insert: 'top',
                    duration: 3000,
                });
                return this.setState({
                    ...this.state,
                    bot: { ...this.state.bot, publishDisabled: { disabled: true, user: error.user } } as Bot,
                    loadingDisabledPublish: false,
                });
            } else {
                addNotification({
                    message: this.props.getTranslation(`Error`),
                    title: '',
                    type: 'danger',
                    container: 'top-center',
                    insert: 'top',
                    duration: 3000,
                });
            }
        }
        this.setState({ loadingDisabledPublish: false });
    };

    handlePublishButtonClick = async () => {
        let error;
        const { workspaceId, botId } = this.props.match.params as any;

        await BotService.publishInteractions(workspaceId, botId, (responseError) => (error = responseError));
        const lastPublishedAt = moment().toISOString();

        if (!error) {
            addNotification({
                message: this.props.getTranslation('Bot published'),
                title: '',
                type: 'success',
                container: 'top-center',
                insert: 'top',
                duration: 3000,
            });
            this.props.setCurrentBot({
                ...this.state.bot,
                publishedAt: lastPublishedAt,
            });

            this.props.setBotList(
                this.props.botList.map((bot) => {
                    if (bot._id === this.state?.bot?._id) {
                        return {
                            ...this.state.bot,
                            publishedAt: lastPublishedAt,
                        };
                    }

                    return bot;
                })
            );
            this.setState({ interactionsPendingPublication: [] });
        } else {
            if (error.error === 'INTERACTIONS_PUBLISH_FAILED') {
                this.setState({ publishErrors: error.message || [] });
            }
            const message =
                error.error === 'INTERACTIONS_PUBLISH_FAILED'
                    ? `${this.props.getTranslation('Bot interactions publish failed')}: ${error.message?.map(
                          (item) => item.name
                      )}`
                    : error.message === 'BOT_PUBLISH_DISABLED'
                    ? `${this.props.getTranslation('Post disabled by:')} ${error.user.name}`
                    : this.props.getTranslation('Error');

            if (error.message === 'BOT_PUBLISH_DISABLED') {
                this.setState({
                    ...this.state,
                    bot: { ...this.state.bot, publishDisabled: { disabled: true, user: error.user } } as Bot,
                });
            }

            addNotification({
                message: message,
                title: '',
                type: 'danger',
                container: 'top-center',
                insert: 'top',
                duration: 12000,
            });
        }
    };

    destroyAll = () => {
        ModalAntd.destroyAll();
    };

    showConfirmPublication = () => {
        confirm({
            title: this.props.getTranslation('Publicação do bot'),
            content: (
                <div>
                    {this.props.getTranslation('Tem certeza que deseja fazer a publicação deste bot?')}
                    <Row style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end', marginTop: '15px' }}>
                        {!!this.state.interactionsPendingPublication?.length && (
                            <Button
                                onClick={() => {
                                    this.destroyAll();
                                    this.setPendingInteractionListState();
                                    this.setState({ viewPending: true });
                                }}
                                style={{ marginLeft: '-10px' }}
                                className='antd-span-default-color'
                                type='default'
                            >
                                Visualizar alterações
                            </Button>
                        )}
                        <Button className='antd-span-default-color' type='default' onClick={() => this.destroyAll()}>
                            Cancelar
                        </Button>
                        <Button
                            className='antd-span-default-color'
                            type='primary'
                            onClick={() => {
                                this.handlePublishButtonClick();
                                this.destroyAll();
                            }}
                        >
                            OK
                        </Button>
                    </Row>
                </div>
            ),
            bodyStyle: { padding: '32px 24px 10px 24px' },
            cancelButtonProps: {
                style: { display: 'none' },
            },
            okButtonProps: {
                style: { display: 'none' },
            },
        });
    };

    handleRevertButtonClick = async () => {
        let error;
        const { workspaceId, botId } = this.props.match.params as any;

        await BotService.revertChanges(workspaceId, botId, (responseError) => (error = responseError));

        if (!error) {
            this.getInteractionList();
            this.setState({ publishErrors: [] });
            addNotification({
                message: this.props.getTranslation('Action performed successfully'),
                title: '',
                type: 'success',
                container: 'top-center',
                insert: 'top',
                duration: 3000,
            });
        } else {
            addNotification({
                message: this.props.getTranslation('Error'),
                title: '',
                type: 'danger',
                container: 'top-center',
                insert: 'top',
                duration: 3000,
            });
        }
    };

    renderModalChange = () => {
        const { getTranslation } = this.props;

        return (
            <Modal height='150px' width='390px' isOpened={this.state.modalRevert} position={ModalPosition.center}>
                <div className='modal-change-close'>
                    <h5>{getTranslation('Reverter alterações feitas')}</h5>
                    <p>{getTranslation('Esta ação não podera ser desfeita. Você tem certeza de que quer reverter')}?</p>
                    <div className='modal-change'>
                        <DiscardBtn onClick={() => this.setState({ modalRevert: false })} className='modal-confirm-no'>
                            {getTranslation('No')}
                        </DiscardBtn>
                        <DoneBtn
                            onClick={() => {
                                this.handleRevertButtonClick();
                                this.setState({ modalRevert: false });
                            }}
                            className='modal-confirm-yes'
                        >
                            {getTranslation('Yes')}
                        </DoneBtn>
                    </div>
                </div>
            </Modal>
        );
    };

    componentDidMount() {
        this.handleEvents();
    }

    checkParamsInteractionId = () => {
        const params: any = this.props.match.params;

        if (params.interactionId) {
            this.setState(
                {
                    ...this.state,
                    currentExternalInteractionId: params.interactionId,
                },
                () => this.openExternalInteraction(params.interactionId)
            );
        }
    };

    handleEvents() {
        const { interactionList } = this.props;

        window.onmessage = (e) => {
            if (e.type === 'message' && e.data.type === 'message' && e.data.value && e.data.value.interactionId) {
                const executingId = e.data.value.interactionId;
                const executingInteraction: Interaction | undefined = interactionList?.find(
                    (interaction) => interaction._id === executingId
                );

                if (!executingInteraction) {
                    return;
                }

                let path: any[] = [];
                if (executingInteraction.completePath) {
                    path = [...executingInteraction.completePath];
                }
                path.push(executingId);
                this.props.setCurrentExecutingInteraction(path);
            } else if (e.type === 'message' && e.data.type === 'show_info_activity') {
                this.setState({
                    ...this.state,
                    showActivityInfo: true,
                    activity: e.data.activity,
                });
            } else if (e.type === 'message' && e.data.type === 'show_info_interaction') {
                this.setState(
                    {
                        ...this.state,
                        currentExternalInteractionId: e.data.interactionId,
                    },
                    () => this.openExternalInteraction(e.data.interactionId)
                );
            }
        };
    }

    renderModalActivity = (json) => {
        return (
            <Modal
                position={ModalPosition.center}
                width={'auto'}
                height={'auto'}
                isOpened={true}
                onClickOutside={() =>
                    this.setState({
                        ...this.state,
                        showActivityInfo: false,
                    })
                }
                className='json-viewer'
            >
                <div className='data'>
                    <div className='d-flex justify-content-end'>
                        <span
                            style={{ cursor: 'pointer' }}
                            className='mdi mdi-24px mdi-close'
                            title=''
                            onClick={() => {
                                this.setState({
                                    ...this.state,
                                    showActivityInfo: false,
                                });
                            }}
                        />
                    </div>
                    {json.value && (
                        <>
                            <div className='label-ident'>Score:</div>
                            <div style={{ padding: '10px 20px' }}>
                                recognized with a score of
                                <b>{json.value && ` ${json.value.score}.`}</b>
                            </div>
                        </>
                    )}

                    <div className='label-ident'>Activity:</div>
                    <React.Suspense
                        fallback={
                            <Wrapper width='100%' height='100%'>
                                {`${this.props.getTranslation('Loading')}..`}
                            </Wrapper>
                        }
                    >
                        <LazyJsonModalPreview json={json} />
                    </React.Suspense>
                </div>
            </Modal>
        );
    };

    openExternalInteraction(interactionId: string) {
        const { interactionList } = this.props;

        const interaction = interactionList?.find((interaction) => interaction._id === interactionId);

        if (!interaction) {
            return;
        }

        const interactionElement = document.getElementById(interaction?._id);

        if (interactionElement) {
            interactionElement.scrollIntoView({ block: 'center', behavior: 'smooth', inline: 'nearest' });
        } else if (interaction?.completePath.length) {
            const path = document.getElementById(interaction?.completePath[0]);

            if (path) {
                path.scrollIntoView({ block: 'center', behavior: 'smooth', inline: 'nearest' });
            }
        }

        const { setCurrentInteraction, setValidateInteraction } = this.props;
        setCurrentInteraction(cloneDeep(interaction));
        return setValidateInteraction(cloneDeep(interaction));
    }

    renderModal = () => {
        if (!this.props.currentInteraction && !this.props.validateInteraction) {
            return null;
        }

        return this.props.currentInteraction && this.props.currentInteraction.type !== InteractionType.container ? (
            <Modal
                position={ModalPosition.right}
                width={this.props.unchangedInteraction ? '100%' : '700px'}
                height={'100%'}
                style={{ background: 'transparent' }}
                isOpened={!!this.props.currentInteraction && !!this.props.validateInteraction}
            >
                {!!this.props.currentInteraction && !!this.props.validateInteraction ? (
                    <ModalInteraction
                        setPendingPublication={(int: Interaction[]) => {
                            this.setState({ interactionsPendingPublication: int });
                        }}
                        setInteractionsPendingPublication={() => this.setPendingInteractionListState()}
                        onResetCollapseType={() => {
                            this.setState((prevState) => ({
                                ...prevState,
                                collapseType: 'collapsed',
                            }));
                        }}
                    />
                ) : null}
            </Modal>
        ) : (
            <Modal
                position={ModalPosition.center}
                width={'400px'}
                height={'170px'}
                isOpened={!!this.props.currentInteraction && !!this.props.validateInteraction}
            >
                {!!this.props.currentInteraction && !!this.props.validateInteraction ? <ModalContainer /> : null}
            </Modal>
        );
    };

    renderTree = () => {
        const { publishErrors } = this.state;

        if (
            UserPermission.can([
                {
                    role: UserRoles.SYSTEM_ADMIN,
                    resource: PermissionResources.ANY,
                    resourceId: undefined,
                },
                {
                    role: UserRoles.SYSTEM_UX_ADMIN,
                    resource: PermissionResources.ANY,
                },
                {
                    role: UserRoles.SYSTEM_CS_ADMIN,
                    resource: PermissionResources.ANY,
                },
            ])
        ) {
            return <Tree failedResponseIds={publishErrors} />;
        }
        return "User can't view the tree of this bot";
    };

    render() {
        const { bot } = this.state;
        const { pendingFlows, pendingEntities } = this.state.pendingPublication || {};
        const treeZoomClass = 'tree-zoom-' + this.state.treeZoom;
        const params: any = this.props.match.params;
        const now = bot?.publishDisabled?.disabledAt || undefined;
        const hrs = moment(now).format('DD/MM/YYYY ');
        const min = moment(now).format(' HH:mm ');
        const message =
            this.props.getTranslation('deactivated publishing this Bot on') +
            ` ${hrs} ` +
            this.props.getTranslation('at') +
            `${min}`;
        const items: MenuProps['items'] = [
            {
                key: '1',
                label: !!bot?.publishDisabled?.disabled
                    ? this.props.getTranslation('Enable Publication')
                    : this.props.getTranslation('Disable publish'),
                onClick: () => this.updateBot(!bot?.publishDisabled?.disabled),
            },
        ];

        return (
            <InteractionsPendingPublicationContextProvider value={this.state.interactionsPendingPublication}>
                <Page className='BotDetail'>
                    {this.renderModalChange()}
                    <MountWebchat />
                    {this.state.showActivityInfo &&
                        !!this.state.activity &&
                        this.renderModalActivity(this.state.activity)}
                    {bot ? (
                        <>
                            <FixedHeader>
                                <div className='row bot-name'>
                                    <div className='col-lg-5'>
                                        <h4>
                                            Bot {bot.name}
                                            <Link to={`/workspace/${bot.workspaceId}/bot/${bot._id}/settings/channels`}>
                                                <span className='link-settings mdi mdi-24px mdi-cog' />
                                            </Link>
                                        </h4>
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                        className='col-lg-7 got-back-list-bot'
                                    >
                                        <Link to={`/workspace/${params.workspaceId}/`}>
                                            <Button style={{ margin: '0 10px 0 0' }}>
                                                {this.props.getTranslation('Back')}
                                            </Button>
                                        </Link>

                                        <Badge
                                            count={
                                                !bot?.publishDisabled?.disabled ? null : (
                                                    <Tooltip
                                                        placement='right'
                                                        title={
                                                            bot?.publishDisabled?.disabled
                                                                ? `${bot.publishDisabled?.user?.name} ${message}`
                                                                : ''
                                                        }
                                                    >
                                                        <BiLock color='#f5222d' style={{ fontSize: 20, zIndex: 99 }} />
                                                    </Tooltip>
                                                )
                                            }
                                        >
                                            <ButtonSelect
                                                onClick={this.showConfirmPublication}
                                                disabled={
                                                    !this.loggedUserCanPublishInteractions() ||
                                                    this.disabledPublishInteractions()
                                                }
                                                type={'primary'}
                                                menu={{ items }}
                                            >
                                                <Tooltip
                                                    placement='leftBottom'
                                                    title={
                                                        bot?.publishDisabled?.disabled
                                                            ? `${bot.publishDisabled?.user?.name} ${message}`
                                                            : ''
                                                    }
                                                >
                                                    <span
                                                        style={{
                                                            color: !this.disabledPublishInteractions() ? '#fff' : '',
                                                        }}
                                                    >
                                                        {this.props.getTranslation('Publish')}
                                                    </span>
                                                </Tooltip>
                                            </ButtonSelect>
                                        </Badge>
                                        <MarginIcons>
                                            <InteractionErrors workspaceId={bot.workspaceId} botId={bot._id} />
                                            <InteractionPending
                                                workspaceId={bot.workspaceId}
                                                botId={bot._id}
                                                viewPending={this.state.viewPending}
                                                closeView={() => this.setState({ viewPending: false })}
                                            />
                                        </MarginIcons>
                                        <MarginIcons>
                                            {pendingFlows || pendingEntities ? (
                                                <IconPendingPublicationEntitiesFlow
                                                    title={this.props.getTranslation(
                                                        'There is data pending publication in the flow or entities'
                                                    )}
                                                />
                                            ) : null}
                                        </MarginIcons>
                                    </div>
                                </div>
                                <div className='row'>
                                    <div className='col-lg-12 tree-container'>
                                        <ZoomBar
                                            onCollapse={this.onCollapseAll}
                                            workspaceId={bot.workspaceId}
                                            onZoom={this.onZoom}
                                            collapseType={this.state.collapseType}
                                            getTreeCollapsedLocal={getTreeCollapsedLocal}
                                        />
                                    </div>
                                </div>
                            </FixedHeader>
                            <div className={'col-lg-12 tree-container ' + treeZoomClass}>{this.renderTree()}</div>
                            {this.renderModal()}
                        </>
                    ) : (
                        <Wrapper>
                            <Loader />
                        </Wrapper>
                    )}
                </Page>
            </InteractionsPendingPublicationContextProvider>
        );
    }
}

const mapStateToProps = (state: any) => ({
    loggedUser: state.loginReducer.loggedUser,
    unchangedInteraction: state.botReducer.unchangedInteraction,
    currentInteraction: state.botReducer.currentInteraction,
    validateInteraction: state.botReducer.validateInteraction,
    interactionList: state.botReducer.interactionList,
    botList: state.workspaceReducer.botList,
});

export const BotDetail = I18n(
    withRouter(
        connect(mapStateToProps, {
            setCurrentBot: BotActions.setCurrentBot,
            setBotAttributes: BotActions.setBotAttributes,
            setInteractionList: BotActions.setInteractionList,
            setBotList: BotActions.setBotList,
            setChannelList: BotActions.setChannelList,
            setWorkspaceBots: WorkspaceActions.setBotList,
            setEntities: EntityActions.setCurrentEntities,
            setCurrentInteraction: BotActions.setCurrentInteraction,
            setValidateInteraction: BotActions.setValidateInteraction,
            setCurrentExecutingInteraction: BotActions.setCurrentExecutingInteraction,
        })(BotDetailClass)
    )
);
