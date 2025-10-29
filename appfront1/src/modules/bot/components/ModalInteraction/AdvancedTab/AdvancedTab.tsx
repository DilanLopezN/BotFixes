import { Component } from 'react';
import { connect } from 'react-redux';
import { interactionSelector } from '../../../../../utils/InteractionSelector';
import { DisabledTypeContext } from '../../../contexts/disabledFieldsContext';
import { BotActions } from '../../../redux/actions';
import { Action } from '../action/action';
import { Triggers } from '../triggers-v2';
import './AdvancedTab.scss';
import { AdvancedTabProps } from './AdvancedTabProps';

class AdvancedTabClass extends Component<AdvancedTabProps> {
    onChangeTrigger = (triggers: Array<any>, isValid: boolean) => {
        const currentInteraction = { ...this.props.currentInteraction };
        currentInteraction.triggers = triggers;
        this.props.setCurrentInteraction(currentInteraction);
    };

    onChangeAciton = (action) => {
        const currentInteraction = { ...this.props.currentInteraction };
        currentInteraction.action = action;
        this.props.setCurrentInteraction(currentInteraction);
    };

    render() {
        const { unchangedInteraction, currentInteraction } = this.props;
        return (
            <DisabledTypeContext.Consumer>
                {({ disabledFields }) => {
                    return (
                        <div className='modal-interaction-content AdvancedTab card'>
                            <div className='wrapper'>
                                <Triggers
                                    currentInteraction={interactionSelector(
                                        !!disabledFields,
                                        unchangedInteraction,
                                        currentInteraction
                                    )}
                                    onChange={this.onChangeTrigger}
                                />
                            </div>
                            <div className='wrapper'>
                                <Action
                                    currentInteraction={interactionSelector(
                                        !!disabledFields,
                                        unchangedInteraction,
                                        currentInteraction
                                    )}
                                    onChange={this.onChangeAciton}
                                />
                            </div>
                        </div>
                    );
                }}
            </DisabledTypeContext.Consumer>
        );
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    currentInteraction: state.botReducer.currentInteraction,
    unchangedInteraction: state.botReducer.unchangedInteraction,
    modalInteractionSubmitted: state.botReducer.modalInteractionSubmitted,
});

export const AdvancedTab = connect(mapStateToProps, {
    setCurrentInteraction: BotActions.setCurrentInteraction,
})(AdvancedTabClass);
