import { Component } from 'react';
import { connect } from 'react-redux';
import { ModalInteractionHeaderForm } from '../ModalInteractionHeaderForm/ModalInteractionHeaderForm';
import './ModalInteractionHeader.scss';
import { ModalInteractionHeaderProps } from './ModalInteractionHeaderProps';
import { Interaction } from '../../../../../model/Interaction';

class ModalInteractionHeaderClass extends Component<ModalInteractionHeaderProps> {
    render() {
        if (!this.props.currentInteraction) return null;

        return (
            <div className='modal-header ModalInteractionHeader interaction-header no-padding'>
                <div className='row no-margin'>
                    <div className='col-sm-1 close-btn pointer' onClick={this.props.onCloseModal}>
                        <span className='mdi mdi-24px mdi-close' />
                    </div>
                    <div className='col-sm-11 no-padding'>
                        <ModalInteractionHeaderForm
                            onPublish={this.props.onPublish}
                            preview={this.props.preview}
                            name={this.props.currentInteraction.name}
                            onSubmit={this.props.onSubmit}
                            onInteractionsPending={(int: Interaction[]) => {
                                this.props.setPendingPublication(int);
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    currentInteraction: state.botReducer.currentInteraction,
});
export const ModalInteractionHeader = connect(mapStateToProps, {})(ModalInteractionHeaderClass);
