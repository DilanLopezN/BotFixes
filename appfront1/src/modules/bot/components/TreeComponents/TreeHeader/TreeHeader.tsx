import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Modal, Tooltip } from 'antd';
import { Formik } from 'formik-latest';
import cloneDeep from 'lodash/cloneDeep';
import isEmpty from 'lodash/isEmpty';
import moment from 'moment-timezone';
import { Component } from 'react';
import { BiCaretDown, BiCaretRight } from 'react-icons/bi';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { v4 } from 'uuid';
import { BotLabel } from '../../../../../model/Bot';
import { Interaction, InteractionType } from '../../../../../model/Interaction';
import { ModalConfirm } from '../../../../../shared/ModalConfirm/ModalConfirm';
import { RoundedBtn } from '../../../../../shared/StyledForms/RoundedBtn/RoundedBtn';
import { addNotification } from '../../../../../utils/AddNotification';
import { dispatchSentryError } from '../../../../../utils/Sentry';
import { isSystemAdmin } from '../../../../../utils/UserPermission';
import I18n from '../../../../i18n/components/i18n';
import { InteractionsPendingPublicationContext } from '../../../contexts/interactionsPendingPublication';
import { CopyInteractionInterface } from '../../../Interfaces/InterfacesInteraction';
import { BotActions } from '../../../redux/actions';
import { BotService } from '../../../services/BotService';
import CopyInteraction from '../../CopyInteraction/CopyInteraction';
import { DropAboveWithContext } from '../DropAbove/DropAboveWithContext';
import './TreeHeader.scss';
import { TreeHeaderProps, TreeHeaderState } from './TreeHeaderProps';

class TreeHeaderClass extends Component<TreeHeaderProps, TreeHeaderState> {
    constructor(props: TreeHeaderProps) {
        super(props);
        this.state = {
            isHoveringNameContainer: false,
            isOpenedModalDelete: false,
            isOpenedModalCopy: false,
        };
    }

    private hasFailedCards = (): boolean => {
        const { interaction, failedResponseIds } = this.props;

        if (!failedResponseIds || failedResponseIds.length === 0) {
            return false;
        }

        return failedResponseIds.some((error) => error._id === interaction._id);
    };

    /**
     * função para atualizar a propriedade collapse e collapsar o nó
     */
    private collapse = async (interaction: Interaction) => {
        const params: any = this.props.match.params;
        const interactionList = this.props.interactionList.map((interactionFromList: Interaction) => {
            if (interactionFromList._id == interaction._id) {
                interactionFromList.isCollapsed = !interactionFromList.isCollapsed;
                BotService.updateInteraction(params.workspaceId, params.botId, interaction);
            }
            return interactionFromList;
        });
        this.props.setInteractionList(interactionList);
    };

    /**
     * Função para deletar uma interaction, faz a request para deletar mas não espera terminar, para atualizar o DOM.
     */
    private deleteInteraction = (interaction: Interaction) => {
        const params: any = this.props.match.params;

        const interactionList = this.props.interactionList.filter((interactionFromList: Interaction) => {
            return interactionFromList._id != interaction._id;
        });
        this.props.setInteractionList(interactionList);
        BotService.deleteInteraction(params.workspaceId, params.botId, interaction._id);
    };

    /**
     * Função para renderizar a parte do nó da árvore que representa o botão collapse
     */
    private renderCollapseButton = (interaction: Interaction) => {
        if (interaction.type === InteractionType.welcome) return null;
        return (
            <div className='collapse-btn pointer' key={v4()} onClick={() => this.collapse(interaction)}>
                {interaction.isCollapsed ? <BiCaretRight /> : <BiCaretDown />}
            </div>
        );
    };

    /**
     * Função prar gerar o conteudo do botão redondo da interaction.
     * Caso seja uma interaction normal o conteúdo será um icone, caso seja uma interaction welcome ou fallback
     * o conteúdo será a string 'START' e "ELSE" respectivamente.
     * Caso o conteudo seja um icone, o icone a ser mostrado está definido via css send icone tipo 'send' ou 'edit'
     */
    private getBtnRoundedContent = (interaction: Interaction) => {
        if (interaction.type == InteractionType.fallback || interaction.type == InteractionType.contextFallback)
            return 'ELSE';
        if (interaction.type == InteractionType.welcome) return 'START';
        return [
            <span className='mdi mdi-send send-icon' key={1} />,
            <span className='mdi mdi-pencil edit-icon' key={2} />,
        ];
    };

    /**
     * Função para renderizar a parte do nó da árvore que representa o botão de delete
     */
    private renderTrashBtn = (interaction: Interaction) => {
        if (interaction.type == InteractionType.welcome) return null;
        return (
            <div className='trash-btn pointer' onClick={() => this.openModalDelete(true)}>
                <span className='mdi mdi mdi-24px mdi-delete-outline' />
            </div>
        );
    };

    /**
     * Função para renderizar o botão de copiar para outro bot
     */
    private renderCopyBtn = (interaction: Interaction) => {
        if (interaction.type == InteractionType.welcome) return null;
        return (
            <div
                className='copy-btn pointer'
                title={this.props.getTranslation('Copy interaction to another bot')}
                onClick={() => this.setState({ ...this.state, isOpenedModalCopy: true })}
            >
                <span className='mdi mdi mdi-24px mdi-export' />
            </div>
        );
    };

    toggleModaldelete = () => {
        this.setState({ isOpenedModalDelete: !this.state.isOpenedModalDelete });
    };

    openModalDelete = (status: boolean) => {
        this.setState({ isOpenedModalDelete: status });
    };

    renderModalDelete = (interaction: Interaction) => {
        const { getTranslation } = this.props;

        return (
            <ModalConfirm
                isOpened={true}
                onAction={(action) => {
                    this.toggleModaldelete();
                    if (!action) return null;
                    this.deleteInteraction(interaction);
                }}
            >
                <h5>{getTranslation('Confirm delete')}</h5>
                <p>
                    {getTranslation('Are you sure you want to delete interaction')} <span>{interaction.name}</span>?
                </p>
            </ModalConfirm>
        );
    };

    onCopyInteraction = async (fromInteractionId, data: CopyInteractionInterface) => {
        const isAdmin = isSystemAdmin(this.props.loggedUser);
        const params: any = this.props.match.params;
        const { getTranslation } = this.props;

        if (!isAdmin) {
            return;
        }

        await BotService.copyInteraction(params.workspaceId, params.botId, fromInteractionId, data)
            .then((value) => {
                if (value.ok) {
                    addNotification({
                        type: 'success',
                        insert: 'top',
                        container: 'top-center',
                        duration: 3000,
                        title: getTranslation('Success'),
                        message: getTranslation('Interaction successfully copied!'),
                    });
                    this.setState({ ...this.state, isOpenedModalCopy: false });
                    return;
                }
                addNotification({
                    type: 'warning',
                    insert: 'top',
                    container: 'top-center',
                    duration: 3000,
                    title: getTranslation('Error'),
                    message: getTranslation('There was an error copying this interaction, please try again!'),
                });
            })
            .catch((erro) => {
                addNotification({
                    type: 'warning',
                    insert: 'top',
                    container: 'top-center',
                    duration: 3000,
                    title: getTranslation('Error'),
                    message: getTranslation('There was an error copying this interaction, please try again!'),
                });
                dispatchSentryError(erro);
            });
    };

    renderModalCopy = (interaction: Interaction) => {
        const { getTranslation, currentBot, botList, interactionList } = this.props;
        const { isOpenedModalCopy } = this.state;

        return (
            <Formik
                initialValues={{
                    botId: currentBot._id,
                    workspaceId: currentBot.workspaceId,
                    selectedInteraction: interaction._id,
                    interactions: interactionList,
                    bots: botList,
                    nested: false,
                }}
                onSubmit={() => {}}
            >
                {(formikProps) => (
                    <form>
                        <Modal
                            open={isOpenedModalCopy}
                            onCancel={() => this.setState({ ...this.state, isOpenedModalCopy: false })}
                            onOk={() => {
                                this.onCopyInteraction(interaction._id, {
                                    toWorkspaceId: formikProps.values.workspaceId,
                                    toBotId: formikProps.values.botId,
                                    toInteractionId: formikProps.values.selectedInteraction,
                                    nested: formikProps.values.nested,
                                });
                            }}
                            closable={false}
                            cancelText='Cancelar'
                            okText='Copiar'
                            okButtonProps={{
                                className: 'antd-span-default-color',
                                disabled: !formikProps.values.selectedInteraction,
                            }}
                            cancelButtonProps={{ className: 'antd-span-default-color' }}
                        >
                            <h5>{getTranslation('Copy interaction to another bot')}</h5>
                            <CopyInteraction formik={formikProps} />
                        </Modal>
                    </form>
                )}
            </Formik>
        );
    };

    openInteractionModal = (interaction: Interaction) => {
        this.props.setCurrentInteraction(interaction);
        this.props.setValidateInteraction(cloneDeep(interaction));
    };

    /**
     * Função para renderizar a parte do nó da árvore que representa
     * o botão de edição e balão de nome da interaction
     */

    renderLabels = (interaction: Interaction) => {
        const arrayColors = this.props.currentBot ? this.props.currentBot.labels : [];
        if (interaction && !isEmpty(interaction.labels)) {
            return interaction.labels.map((labelId) => {
                return arrayColors.map((label: BotLabel, index: number) => {
                    if (!label) return null;
                    if (label._id === labelId) {
                        return (
                            <div className='item-label' style={{ background: `${label.color.hexColor}` }} key={index} />
                        );
                    }
                });
            });
        }
        return null;
    };

    getInteractionHasChanges = (interactionsPending?: any[]): boolean => {
        return !!interactionsPending?.find(
            (currInteractionPending) => currInteractionPending?._id === this.props.interaction._id
        );
    };

    getInteractionIsNew = (): boolean => {
        return (
            moment.utc(this.props.interaction.createdAt || 0).valueOf() >
            (moment.utc(this.props.interaction?.publishedAt).valueOf() ||
                moment.utc(this.props.currentBot.publishedAt).valueOf())
        );
    };

    getCustomColorInteraction = (interactionsPending?: any[]) => {
        const isNewInteraction = this.getInteractionIsNew();

        if (isNewInteraction) {
            return 'created';
        }

        const hasChangesInteraction = this.getInteractionHasChanges(interactionsPending);

        if (hasChangesInteraction) {
            return 'changed';
        }

        return '';
    };

    renderRoundedBtn = (interaction: Interaction, btnClass: string) => {
        const { currentInteraction } = this.props;
        const classSelectContainer =
            currentInteraction && currentInteraction._id == interaction._id
                ? 'btn-container selected-container'
                : 'btn-container';
        if (interaction.type == ('container' as any))
            return (
                <span className={classSelectContainer} onClick={() => this.openInteractionModal(interaction)}>
                    <span className='mdi mdi-send icon-send-edit' />
                    <span className='mdi mdi mdi-pencil icon-pencil-edit' />
                </span>
            );
        return (
            <InteractionsPendingPublicationContext.Consumer>
                {({ interactionsPendingPublication }) => {
                    return (
                        <RoundedBtn
                            btnClass={
                                'btn-rounded pointer ' +
                                btnClass +
                                ` ${this.getCustomColorInteraction(interactionsPendingPublication)}`
                            }
                            onClick={() => this.openInteractionModal(interaction)}
                        >
                            {this.getBtnRoundedContent(interaction)}
                        </RoundedBtn>
                    );
                }}
            </InteractionsPendingPublicationContext.Consumer>
        );
    };

    private renderNameContainer = (interaction: Interaction) => {
        let btnClass: any;
        const { isOpenedModalDelete } = this.state;

        if (interaction.type == InteractionType.welcome) btnClass = ' welcome ';
        if (this.props.currentInteraction && this.props.currentInteraction._id === interaction._id)
            btnClass += ` selected-interaction `;
        else if (interaction.reference) btnClass = ' reference ';
        if (this.props.isExecuting) btnClass += ' executing ';
        const hasError = this.hasFailedCards();
        return (
            <div
                key={v4()}
                className='name-container'
                title={`${interaction.comments && interaction.comments.length ? interaction.comments[0].comment : ''}`}
            >
                <div className='name' onClick={() => this.openInteractionModal(interaction)}>
                    {hasError && (
                        <Tooltip
                            title={this.props.getTranslation('Esta interação contém cards com erros de publicação.')}
                        >
                            <ExclamationCircleOutlined style={{ color: 'red', fontSize: '16px', marginRight: '8px' }} />
                        </Tooltip>
                    )}
                    <p className='title-interaction'>{interaction.name}</p>
                    <div className='list-labels'>{this.renderLabels(interaction)}</div>
                </div>
                {this.renderRoundedBtn(interaction, btnClass)}
                {this.renderTrashBtn(interaction)}
                {/* {isAdmin ? this.renderCopyBtn(interaction) : null} */}
                {isOpenedModalDelete ? this.renderModalDelete(interaction) : null}
                {/* {isAdmin ? this.renderModalCopy(interaction) : null} */}
            </div>
        );
    };

    render() {
        return [
            <DropAboveWithContext interaction={this.props.interaction} key={1} />,
            this.renderCollapseButton(this.props.interaction),
            this.renderNameContainer(this.props.interaction),
        ];
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    interactionList: state.botReducer.interactionList,
    currentBot: state.botReducer.currentBot,
    currentInteraction: state.botReducer.currentInteraction,
    workspaceList: state.workspaceReducer.workspaceList,
    botList: state.workspaceReducer.botList,
    loggedUser: state.loginReducer.loggedUser,
});

export const TreeHeader = I18n(
    withRouter(
        connect(mapStateToProps, {
            setInteractionList: BotActions.setInteractionList,
            setCurrentInteraction: BotActions.setCurrentInteraction,
            setValidateInteraction: BotActions.setValidateInteraction,
        })(TreeHeaderClass)
    ) as any
);
