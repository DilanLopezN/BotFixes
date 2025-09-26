import React, { Component } from 'react';
import './BotResponseWrapper.scss';
import { TypingDelay } from '../TypingDelay/TypingDelay';
import { BotResponseWrapperProps, BotResponseWrapperState } from './BotResponseWrapperProps';
import { ICondition, FilterOperator } from '../../../../../model/Interaction';
import { ResponseControl } from '../ResponseControl/ResponseControl';
import { ContentTransparentCollapse } from '../../../../../shared/ContentTransparentCollapse/ContentTransparentCollapse';
import { Filter } from '../Filter/Filter';
import { FactoryTitleResponse } from '../../FactoryTitleResponse/FactoryTitleResponse';
import { DisabledTypeContext } from '../../../contexts/disabledFieldsContext';

export class BotResponseWrapper extends Component<BotResponseWrapperProps, BotResponseWrapperState> {
    onChange = (response) => {
        this.props.onChange(response);
    };

    onConditionsChange = (conditions: Array<ICondition>) => {
        const response = this.props.response;
        response.filter.conditions = conditions;
        this.onChange(response);
    };

    onFiltersOperatorChange = (operator: FilterOperator) => {
        const response = this.props.response;
        response.filter = {
            ...response.filter,
            operator,
        };
        this.onChange(response);
    };

    onTypingDelay = (typingDelay) => {
        const response = this.props.response;
        response.delay = typingDelay;
        this.onChange(response);
    };

    onSendTyppingChange = (sendTypping) => {
        const response = this.props.response;
        response.sendTypping = sendTypping;
        this.onChange(response);
    };

    getErrorClass = () => {
        if (this.props.response.isResponseValid == false && this.props.submitted) return 'alert-danger';
        return;
    };

    render() {
        return (
            <div className='BotResponseWrapper'>
                <div className='header-container'>
                    <FactoryTitleResponse response={this.props.response} />
                    <TypingDelay
                        typingDelay={this.props.response.delay}
                        sendTyping={!!this.props.response.sendTypping}
                        onChange={this.onTypingDelay}
                        onSendTyppingChange={this.onSendTyppingChange}
                    />
                </div>
                <div className='card-container'>
                    <DisabledTypeContext.Consumer>
                        {({ disabledFields }) => {
                            return (
                                <>
                                    {!disabledFields ? (
                                        <ResponseControl
                                            isShowUpArrow={!this.props.isFirstResponse}
                                            isShowDownArrow={!this.props.isLastResponse}
                                            onClone={this.props.onClone}
                                            response={this.props.response}
                                            onDelete={this.props.onDelete}
                                            onMoveInteraction={this.props.onMoveInteraction}
                                            checked={this.props.checked}
                                            idResponseList={this.props.idResponseList}
                                        />
                                    ) : (
                                        <div />
                                    )}
                                </>
                            );
                        }}
                    </DisabledTypeContext.Consumer>

                    <div className='card bot-response-card no-padding'>
                        <div className='card-header'>
                            <Filter
                                submitted={this.props.submitted}
                                onConditionsChange={this.onConditionsChange}
                                onOperatorChange={this.onFiltersOperatorChange}
                                filter={this.props.response.filter}
                            />
                        </div>
                        <div className={'card-body ' + this.getErrorClass()}>
                            <ContentTransparentCollapse className='response-content'>
                                {this.props.children as unknown as React.ReactNode}
                            </ContentTransparentCollapse>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
