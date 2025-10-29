import React, { Component } from 'react';
import "./DropAbove.scss"
import { DropTarget } from 'react-dnd';
import { DropAboveProps } from './DropAboveProps';
import { Interaction, InteractionType } from '../../../../../model/Interaction';
import { connect } from 'react-redux';
import { BotActions } from '../../../redux/actions';
import { withRouter } from 'react-router';
import { BotService } from '../../../services/BotService';
import I18n from '../../../../i18n/components/i18n';

class DropAboveClass extends Component<DropAboveProps>{
    renderDropContainer = () => {
        const { canDrop, isOver, interaction } = this.props
        let className = " DropAbove ";
        if (isOver) className += " hover ";
        if (canDrop) className += " show ";
        return <div className={className}>
            {`${this.props.getTranslation('Drop above')} ${interaction.name}`}
        </div>
    }
    render() {
        const { connectDropTarget } = this.props
        return connectDropTarget(this.renderDropContainer())
    }
}

const interactionTarget = {
    canDrop(props: DropAboveProps, monitor) {
        const draggingInteraction: Interaction = monitor.getItem();

        //Verifica se a interaction a que está em dragging pode ser dropada 
        // nesse componente, caso a interaction dragada esteja no path da 
        //interaction desse componente 
        //ou a interaction desse componente seja do tipo welcome 
        //ou seja a mesma interaction, então o drop não pode ocorrer
        if (props.interaction.type == InteractionType.welcome) return false;
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

        return true;
    },
    hover(props: DropAboveProps, monitor, component) {
        return null;
    },
    drop(props: DropAboveProps, monitor, component) {
        if (monitor.didDrop()) {
            return;
        }
        const droppedInteraction: Interaction = monitor.getItem();
        const targetInteraction = props.interaction;
        let interactionList = [...props.interactionList] as Array<Interaction>;

        interactionList = interactionList.filter(interaction => {
            return interaction.parentId == targetInteraction.parentId;
        }).sort((a, b) => a.position - b.position)

        interactionList.forEach((interaction, index, targetLevelArr) => {
            if (interaction._id != targetInteraction._id) return;
            let nextPosition: number = interaction.position;
            let prevPosition: number;

            if (index - 1 >= 0) {
                prevPosition = targetLevelArr[index - 1].position;
            } else {
                prevPosition = 0;
            }

            if(prevPosition == nextPosition && droppedInteraction.parentId == targetInteraction.parentId){
                nextPosition = nextPosition * 2;
            }

            droppedInteraction.position = Math.round(((prevPosition || 0) + (nextPosition || 0)) / 2);
            droppedInteraction.parentId = targetInteraction.parentId;
        });
        const newInteractionList = props.interactionList.map(interaction => {
            if (interaction._id == droppedInteraction._id) {
                return droppedInteraction;
            }
            return interaction;
        });
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

const DropAboveDropTarget = DropTarget("INTERACTION", interactionTarget, (connect, monitor) => {
    return {
        connectDropTarget: connect.dropTarget(),
        isOver: monitor.isOver(),
        isOverCurrent: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
        itemType: monitor.getItemType(),
        // droppedInteraction : monitor.
    };
}
)(DropAboveClass);

const mapStateToProps = (state: any, ownProps: any) => ({
    interactionList: state.botReducer.interactionList
})

export const DropAbove = I18n(withRouter(connect(
    mapStateToProps,
    {
        setInteractionList: BotActions.setInteractionList
    }
)(DropAboveDropTarget)) as any);