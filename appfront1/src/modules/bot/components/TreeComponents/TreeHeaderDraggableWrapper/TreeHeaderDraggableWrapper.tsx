import { Component } from 'react';
import './TreeHeaderDraggableWrapper.scss';
import { connect } from 'react-redux';
import { DragSource } from 'react-dnd';
import { TreeHeaderDraggableWrapperProps } from './TreeHeaderDraggableWrapperProps';
import { TreeHeader } from '../TreeHeader/TreeHeader';
import { InteractionType } from '../../../../../model/Interaction';

class TreeHeaderDraggableWrapperClass extends Component<TreeHeaderDraggableWrapperProps, any> {
    render() {
        const { connectDragSource, failedResponseIds } = this.props;
        return connectDragSource(
            <div className='DraggableWrapper' id={this.props.interaction?._id}>
                <TreeHeader
                    isExecuting={this.props.isExecuting}
                    interaction={this.props.interaction}
                    failedResponseIds={failedResponseIds}
                />
            </div>
        );
    }
}

const TreeHeaderDraggableWrapperDraggable = DragSource(
    'INTERACTION',
    {
        canDrag(props: TreeHeaderDraggableWrapperProps) {
            if (props.interaction.type == InteractionType.welcome) return false;
            return true;
        },
        isDragging(props, monitor) {
            return true;
        },
        beginDrag(props: TreeHeaderDraggableWrapperProps, monitor, component) {
            return { ...props.interaction };
        },
        endDrag(props, monitor, component) {
            if (!monitor.didDrop()) {
                return;
            }
        },
    },
    (connect, monitor) => {
        return {
            connectDragSource: connect.dragSource(),
            isDragging: monitor.isDragging(),
        };
    }
)(TreeHeaderDraggableWrapperClass);

const mapStateToProps = (state: any, ownProps: any) => ({});

export const TreeHeaderDraggableWrapper = connect(mapStateToProps, {})(TreeHeaderDraggableWrapperDraggable);
