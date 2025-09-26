import React, { Component } from 'react';
import { CommentsTabProps } from './CommentsTabProps';
import './CommentsTab.scss';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { CommentCreate } from '../CommentCreate/CommentCreate';
import { CommentItem } from '../CommentItem/CommentItem';
import { BotActions } from '../../../../redux/actions';
import { v4 } from 'uuid';
import { DisabledTypeContext } from '../../../../contexts/disabledFieldsContext';

class CommentsTabClass extends Component<CommentsTabProps> {
    updateComment = (comments: any) => {
        const { currentInteraction } = this.props;
        currentInteraction.comments = comments;
        this.props.setCurrentInteraction(currentInteraction);
        this.forceUpdate();
    };
    render() {
        return (
            <div className='modal-interaction-content CommentsTab card'>
                <div className='wrapper comment-container'>
                    <CommentItem onChange={this.updateComment} key={v4()} />
                </div>
                <DisabledTypeContext.Consumer>
                    {({ disabledFields }) => {
                        if (disabledFields) {
                            return <div />;
                        }
                        return (
                            <div className='wrapper comment-create-container'>
                                <CommentCreate onChange={this.updateComment} />
                            </div>
                        );
                    }}
                </DisabledTypeContext.Consumer>
            </div>
        );
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    currentInteraction: state.botReducer.currentInteraction,
});
export const CommentsTab = withRouter(
    connect(mapStateToProps, {
        setCurrentInteraction: BotActions.setCurrentInteraction,
    })(CommentsTabClass)
);
