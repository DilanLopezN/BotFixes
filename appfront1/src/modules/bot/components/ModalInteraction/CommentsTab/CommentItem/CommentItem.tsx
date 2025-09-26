import { Component } from 'react';
import './CommentItem.scss';
import { CommentItemProps } from './CommentItemProps';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { IComment, PermissionResources, UserRoles } from 'kissbot-core/lib';
import isEmpty from 'lodash/isEmpty';
import pullAt from 'lodash/pullAt';
import { v4 } from 'uuid';
import moment from 'moment';
import { UserPermission } from '../../../../../../utils/UserPermission';
import I18n from '../../../../../i18n/components/i18n';
import { DisabledTypeContext } from '../../../../contexts/disabledFieldsContext';
import { interactionSelector } from '../../../../../../utils/InteractionSelector';

class CommentItemClass extends Component<CommentItemProps> {
    deleteItem = (comment: IComment, index: number) => {
        const { comments } = this.props.currentInteraction;
        pullAt(comments, index);
        this.props.onChange(comments);
        this.forceUpdate();
    };

    renderComment = (disabledFields) => {
        const {unchangedInteraction, currentInteraction } = this.props;
        const { comments } = interactionSelector(!!disabledFields, unchangedInteraction, currentInteraction);
        return (
            <div className='row CommentItem'>
                {comments && !isEmpty(comments) ? (
                    comments.map((comment: IComment, index) => {
                        return (
                            <div className='col-12 items-list' key={v4()}>
                                <div className='comments-list'>
                                    <div className='media'>
                                        <div className='media-body'>
                                            <b className='media-heading user_name'>{this.props.loggedUser.name}</b>
                                            <p>{comment.comment}</p>
                                            <small>{moment(comment.createdAt).fromNow()}</small>
                                        </div>
                                        {UserPermission.can([
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
                                        ]) || comment.userId === this.props.loggedUser._id ? (
                                            disabledFields ? null :
                                                <span
                                                    className='mdi icon-mdi-comment pointer mdi-delete-outline'
                                                    onClick={() => this.deleteItem(comment, index)}
                                                />
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className='not-implemented-yet'>
                        <div className='item-empty'>
                            <i className='mdi mdi-48px mdi-forum' />
                            <span>
                                <h3>{this.props.getTranslation('No comments')}</h3>
                                <p>{this.props.getTranslation('Add a new comment below.')}</p>
                            </span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    render() {
        return <DisabledTypeContext.Consumer>
            {({ disabledFields }) => {
                return this.renderComment(disabledFields);
            }}
        </DisabledTypeContext.Consumer>
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    currentInteraction: state.botReducer.currentInteraction,
    unchangedInteraction: state.botReducer.unchangedInteraction,
    loggedUser: state.loginReducer.loggedUser,
});

export const CommentItem = I18n(withRouter(connect(mapStateToProps, {})(CommentItemClass))) as any;
