import React, { Component } from 'react';
import "./TreeBottom.scss"
import { connect } from 'react-redux';
import { v4 } from 'uuid';
import { BotActions } from '../../../redux/actions';
import { withRouter } from 'react-router';
import { TreeBottomProps, TreeBottomState } from './TreeBottomProps';
import { Interaction, InteractionType } from '../../../../../model/Interaction';
import { NewInteractionPopover } from '../NewInteractionPopOver/NewInteractionPopOver';
import { DropAsLastChildWithContext } from '../DropAsLastChild/DropAsLastChildWithContext';
import { RoundedBtn } from '../../../../../shared/StyledForms/RoundedBtn/RoundedBtn';
import cloneDeep from "lodash/cloneDeep";
import { DeleteBtn } from '../../../../../shared/StyledForms/DeleteBtn/DeleteBtn';
import { BotService } from '../../../services/BotService';
import { ModalConfirm } from '../../../../../shared/ModalConfirm/ModalConfirm';
import I18n from '../../../../i18n/components/i18n';

class TreeBottomClass extends Component<TreeBottomProps, TreeBottomState>{

    constructor(props: TreeBottomProps) {
        super(props);
        this.state = {
            isOpenedNewInteractioPopover: false,
            hasFallback: false,
            isOpenedModalDelete: false,
        }
    }

    componentDidMount() {
        this.setHasFallback();
    }
    private getFallback = () => {
        return this.props.interactionList.find((interactionFromList: Interaction) => {
            if (this.props.interaction.type == InteractionType.welcome) {
                return interactionFromList.type == InteractionType.fallback
            }
            return interactionFromList.type == InteractionType.contextFallback && interactionFromList.parentId == this.props.interaction._id;
        });
    }

    private setHasFallback = () => {
        const fallback = this.getFallback();
        this.setState({  hasFallback: !!fallback });
    }

    private openPopover = () => {
        this.setState({  isOpenedNewInteractioPopover: true });
    }

    /**
     * Função para renderizar a parte do nó qeu representa o botão de adicionar nova interaction
     */
    private renderAddNode = () => {
        let addNodeClass = "add-node";
        return <div className={addNodeClass} key={v4()}>
            <div className="add-btn-container">
                <div className="add-btn pointer" onClick={this.openPopover}>
                    <span className="mdi mdi-24px mdi-plus"></span>
                </div>
                <NewInteractionPopover hasFallback={this.state.hasFallback} interaction={this.props.interaction} isOpened={this.state.isOpenedNewInteractioPopover} />
                <DropAsLastChildWithContext interaction={this.props.interaction} />
            </div>
        </div>
    }

    /**
     * Função responsavel por renderizar cada fallback e context-fallback da árvore
     */
    private renderFallback = (interaction: Interaction) => {
        if (!this.state.hasFallback) return null;
        let classFallback = 'fallback-node';

        const fallbackInteraction = this.getFallback();
        const isExecuting = !!this.props.currentExecutingInteraction.find(executing => !!fallbackInteraction && fallbackInteraction._id == executing);
        if (isExecuting) {
            classFallback += " dotted executing"
        }

        return <div className={classFallback} key={v4()}>
            <RoundedBtn btnClass={`btn-rounded fallback ${isExecuting ? 'executing' : ''}`}>
                <span className="clickable-btn-area" onClick={() => this.openInteractionModal()}>
                    ELSE
                </span>
                {this.renderDeleteBtn()}
            </RoundedBtn>
            {this.state.isOpenedModalDelete ? this.renderModalDelete() : null}
        </div>
    }

    private renderDeleteBtn = () => {
        return <DeleteBtn className="delete-fallback" onClick={() => this.openModalDelete(true)} />
    }

    toggleModaldelete = () => {
        this.setState({  isOpenedModalDelete: !this.state.isOpenedModalDelete })
    };

    openModalDelete = (status: boolean) => {
        this.setState({  isOpenedModalDelete: status })
    };

    renderModalDelete = () => {
        const { getTranslation } = this.props;

        return <ModalConfirm
            isOpened={true}
            onAction={(action) => {
                this.toggleModaldelete();
                if (!action) return null;
                const fallback: Interaction | undefined = this.getFallback();
                if (!fallback || fallback.type == InteractionType.fallback) return null;
                this.deleteInteraction(fallback);
            }}
        >
            <h5>{getTranslation('Confirm delete')}</h5>
            <p>{`${getTranslation('Are you sure you want to delete the fallback')}?`}</p>
        </ModalConfirm>
    }

    /**
     * Função para deletar uma interaction, faz a request para deletar mas não espera terminar, para atualizar o DOM.
     */
    private deleteInteraction = (interaction: Interaction) => {
        const params: any = this.props.match.params;

        const interactionList = this.props.interactionList.filter((interactionFromList: Interaction) => {
            return interactionFromList._id != interaction._id
        });
        this.props.setInteractionList(interactionList);
        BotService.deleteInteraction(params.workspaceId, params.botId, interaction._id);
    }

    openInteractionModal = () => {
        const fallback = this.getFallback();
        this.props.setCurrentInteraction(fallback);
        this.props.setValidateInteraction(cloneDeep(fallback));
    }

    render() {
        if (this.props.interaction.reference || this.props.interaction.isCollapsed) return null;
        return [
            this.renderAddNode(),
            this.renderFallback(this.props.interaction)
        ]
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    interactionList: state.botReducer.interactionList,
    currentExecutingInteraction: state.botReducer.currentExecutingInteraction,
})

export const TreeBottom = I18n(withRouter(connect(
    mapStateToProps,
    {
        setInteractionList: BotActions.setInteractionList,
        setCurrentInteraction: BotActions.setCurrentInteraction,
        setValidateInteraction: BotActions.setValidateInteraction,
    }
)(TreeBottomClass)) as any);
