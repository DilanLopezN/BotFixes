import { Component } from 'react';
import './TypingDelay.scss';
import { TypingDelayState, TypingDelayProps } from './TypingDelayProps';
import ClickOutside from 'react-click-outside';
import { DoneBtn } from '../../../../../shared/StyledForms/DoneBtn/DoneBtn';
import { RoundedBtn } from '../../../../../shared/StyledForms/RoundedBtn/RoundedBtn';
import { LabelWrapper } from '../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import I18n from '../../../../i18n/components/i18n';
import { Slider } from 'antd';
import { DisabledTypeContext } from '../../../contexts/disabledFieldsContext';

class TypingDelayClass extends Component<TypingDelayProps, TypingDelayState> {
    constructor(props: TypingDelayProps) {
        super(props);
        this.state = {
            isModalOpened: false,
        };
    }

    toggleModal = () => {
        this.setState({ isModalOpened: !this.state.isModalOpened });
    };

    onChange = (typingDelay) => {
        typingDelay = typingDelay * 1000;
        this.props.onChange(typingDelay);
    };

    done = (typingDelay) => {
        this.props.onChange(typingDelay);
        this.toggleModal();
    };

    renderModal = () => {
        const { getTranslation } = this.props;

        if (!this.state.isModalOpened) return null;
        return (
            <ClickOutside
                className='typing-delay-modal'
                onClickOutside={(event) => {
                    if (
                        (' ' + event.target.className + ' ').replace(/[\n\t]/g, ' ').indexOf(' delay-modal-close ') > -1
                    )
                        return null;
                    this.toggleModal();
                }}
            >
                <Slider
                    defaultValue={this.props.typingDelay / 1000}
                    min={0}
                    max={10}
                    style={{ width: '100%' }}
                    tooltip={{ open: true }}
                    value={this.props.typingDelay / 1000}
                    onChange={this.onChange}
                />
                {/* <InputRange
                formatLabel={value => `${value}s`}
                maxValue={10}
                minValue={0}
                step={1}
                value={this.props.typingDelay / 1000}
                onChange={this.onChange}
            /> */}
                <div className='typing-send'>
                    <LabelWrapper
                        tooltip={getTranslation('Send an activity simulating bot typing')}
                        label={getTranslation('Send typing')}
                    >
                        <input
                            checked={this.props.sendTyping}
                            type='checkbox'
                            onChange={(ev) => this.props.onSendTyppingChange(ev.target.checked)}
                        />
                    </LabelWrapper>
                    <DoneBtn onClick={() => this.done(this.props.typingDelay)}>{getTranslation('Save')}</DoneBtn>
                </div>
            </ClickOutside>
        );
    };

    render() {
        return (
            <div className='TypingDelay'>
                <DisabledTypeContext.Consumer>
                    {({ disabledFields }) => {
                        return (
                            <RoundedBtn
                                onClick={() => {
                                    if (!disabledFields) {
                                        this.toggleModal();
                                    }
                                }}
                                btnClass='delay-modal-close'
                            >
                                {(this.props.typingDelay || 0) / 1000}s
                            </RoundedBtn>
                        );
                    }}
                </DisabledTypeContext.Consumer>
                {this.renderModal()}
            </div>
        );
    }
}

export const TypingDelay = I18n(TypingDelayClass);
