import React, { Component } from 'react';
import "./DropAsLastChild.scss"
import { DropTarget } from 'react-dnd';
import { Interaction, InteractionType } from '../../../../../model/Interaction';
import { connect } from 'react-redux';
import { BotActions } from '../../../redux/actions';
import { withRouter } from 'react-router';
import { BotService } from '../../../services/BotService';
import { DropAsLastChildProps } from './DropAsLastChildProps';
import orderBy from 'lodash/orderBy';
import I18n from '../../../../i18n/components/i18n';

class DropAsLastChildClass extends Component<DropAsLastChildProps>{
    renderDropContainer = () => {
        const { canDrop, isOver, interaction } = this.props
        let className = " DropAsLastChild ";
        if (isOver) className += " hover ";
        if (canDrop) className += " show ";
        return <div className={className}>
            {`${this.props.getTranslation('Drop as last child')} ${interaction.name}`} 
        </div>
    }

    render() {
        const { connectDropTarget } = this.props
        return connectDropTarget(this.renderDropContainer())
    }
}

const interactionTarget = {
    canDrop(props: DropAsLastChildProps, monitor) {
        const draggingInteraction = monitor.getItem();

        //Verifica se a interaction a que está em dragging pode ser dropada 
        // nesse componente, caso a interaction dragada esteja no path da 
        //interaction desse componente 
        //ou a interaction desse componente seja do tipo welcome 
        //ou seja a mesma interaction, então o drop não pode ocorrer
        if (props.interaction._id == draggingInteraction._id) return false;
        if (props.interaction.path && !!props.interaction.path.find((pathId) => {
            return draggingInteraction._id == pathId
        })) return false;
        if (props.interaction.completePath && !!props.interaction.completePath.find((pathId) => {
            return draggingInteraction._id == pathId
        })) return false;
        if (
            props.interaction.parentId === draggingInteraction._id ||
            (props.interaction.type == InteractionType.container &&
                !!props.interaction.parentId &&
                props.interactionList
                    .find((interaction) => interaction._id === props.interaction.parentId)
                    ?.completePath?.find((pathId) => {
                        return draggingInteraction._id == pathId;
                    }))
        ) return false;

        //Verifica se já não é o ultimo filho daquele nível
        let interactionListLevel: Array<Interaction> = props.interactionList.filter(interaction => {
            return interaction.parentId == props.interaction._id
        });
        interactionListLevel = orderBy(interactionListLevel, ['position'], ['asc']);
        if (
            interactionListLevel[interactionListLevel.length - 1] &&
            interactionListLevel[interactionListLevel.length - 1]._id == draggingInteraction._id) {
            return false;
        }

        return true;
    },
    hover(props, monitor, component) {
        return null;
    },
    drop(props: DropAsLastChildProps, monitor, component) {
        if (monitor.didDrop()) {
            return;
        }
        const droppedInteraction: Interaction = monitor.getItem();
        const targetInteraction: Interaction = props.interaction;

        const targetInteractionLevel: Array<Interaction> = props.interactionList.filter(interaction => {
            return interaction.parentId == targetInteraction._id
        });

        const lastElement: Interaction = targetInteractionLevel[targetInteractionLevel.length - 1]
            ? targetInteractionLevel[targetInteractionLevel.length - 1] : {} as Interaction;

        const lasElementPosition = lastElement.position && lastElement.position * 2;

        droppedInteraction.position = lasElementPosition;
        if (targetInteraction.type != 'welcome') {
            droppedInteraction.parentId = targetInteraction._id;
        } else {
            droppedInteraction.parentId = '';
        }

        const newInteractionList = props.interactionList.map(interaction => {
            if (interaction._id == droppedInteraction._id) {
                return droppedInteraction;
            }
            return interaction;
        });

        const welcomeInteractions = props.interactionList.filter(interaction =>
            interaction.type === 'interaction' || interaction.type === 'container' && !interaction.parentId
        ).sort((a, b) => a.position - b.position);

        if (welcomeInteractions.length > 0) {
            const lastInteraction = welcomeInteractions[welcomeInteractions.length - 1];

            if (lastInteraction) {
                const newPosition = Math.round((lastInteraction.position * 2) - 3);
                droppedInteraction.position = newPosition;
            }
        }

        props.setInteractionList(newInteractionList);
        BotService.updateInteraction(props.match.params.workspaceId, props.match.params.botId, droppedInteraction)
            .then(() => {
                BotService.getInteractions(props.match.params.workspaceId, props.match.params.botId)
                    .then((interactionsFromBackend) => {
                        props.setInteractionList(interactionsFromBackend.data);
                    })
                    .then(() =>
                        BotService.getInteractionsPendingPublication(
                            props.match.params.workspaceId,
                            props.match.params.botId,
                            (responseError) => responseError
                        ).then((response) => {
                            if (response?.error === 'INTERACTIONS_PENDING_PUBLICATION') {
                                props.setInteractionsPendingPublication?.(response.message);
                            }
                        })
                    );
            })

        return { moved: true }
    }
};

const DropAsLastChildDropTarget = DropTarget("INTERACTION", interactionTarget, (connect, monitor) => {
    return {
        connectDropTarget: connect.dropTarget(),
        isOver: monitor.isOver(),
        isOverCurrent: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
        itemType: monitor.getItemType(),
    };
}
)(DropAsLastChildClass);

const mapStateToProps = (state: any, ownProps: any) => ({
    interactionList: state.botReducer.interactionList
})

export const DropAsLastChild = I18n(withRouter(connect(
    mapStateToProps,
    {
        setInteractionList: BotActions.setInteractionList
    }
)(DropAsLastChildDropTarget)) as any);