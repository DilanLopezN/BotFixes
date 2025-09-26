import React, { Component } from 'react';
import { Interaction, InteractionType } from '../../../../../../../model/Interaction';
import { TypeInputProps, TypeInputState } from './TypeInputProps';
import { connect } from 'react-redux';
import { StyledFormikField } from '../../../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import orderBy from 'lodash/orderBy';
import { ResponseButtonType } from 'kissbot-core';
import I18n from '../../../../../../i18n/components/i18n';
import { InteractionSelect } from '../../../../../../../shared/StyledForms/InteractionsSelect/InteractionSelect';
import { CustomCreatableSelect } from '../../../../../../../shared/StyledForms/CustomCreatableSelect/CustomCreatableSelect';
import { FormItemInteraction } from '../../../../../../../shared-v2/FormItemInteraction';

class TypeInputClass extends Component<TypeInputProps, TypeInputState> {
    constructor(props: TypeInputProps) {
        super(props);
        this.state = {
            type: props.type,
        };
    }

    getPlaceHolder = (type: ResponseButtonType): string => {
        const { getTranslation } = this.props;

        if (type == ResponseButtonType.phone) return 'Phone';
        if (type == ResponseButtonType.postback) return 'Postback';
        if (type == ResponseButtonType.url) return 'URL';
        if (type == ResponseButtonType.goto) return getTranslation('Goto interaction');
        return '';
    };

    getFilteredInteraction = (): Array<Interaction> => {
        return orderBy(
            this.props.interactionList.filter((interation: Interaction) => {
                return (
                    interation.type != InteractionType.contextFallback &&
                    interation.type != InteractionType.fallback &&
                    interation.type != InteractionType.container &&
                    this.props.currentInteraction._id !== interation._id
                );
            }),
            ['name']
        );
    };

    options = () => {
        let array: any = [];
        this.props.interactionList.map((e) => {
            e.triggers.map((e) => {
                e !== '' && array.push(e);
            });
        });

        return array.map((e) => {
            return { label: e, value: e };
        });
    };

    render() {
        const { type } = this.props;
        const inputPlaceHolder = this.getPlaceHolder(type);

        const { getTranslation, setFieldValue, value } = this.props;
        const tooltipName = this.props.interactionList.find((int) => int._id === value)?.name;

        return (
            <FormItemInteraction
                interaction={value}
                label={inputPlaceHolder}
                validate={{
                    touched: this.props.touched,
                    errors: this.props.errors,
                    isSubmitted: this.props.isSubmitted,
                    fieldName: 'value',
                }}
            >
                {type === ResponseButtonType.goto ? (
                    <span title={tooltipName}>
                        <InteractionSelect
                            name='value'
                            options={this.props.interactionList}
                            interactionTypeToShow={['welcome', 'interaction', 'fallback']}
                            defaultValue={value}
                            placeholder={getTranslation('Select a interaction')}
                            style={{ width: '100%' }}
                            onChange={(ev) => {
                                setFieldValue('value', ev.value);
                            }}
                        />
                    </span>
                ) : type === ResponseButtonType.postback ? (
                    <CustomCreatableSelect
                        value={{ label: value, value: value }}
                        options={this.options()}
                        placeholder={getTranslation('Choose an trigger')}
                        onCreateOption={(ev) => {
                            if (!ev) return;

                            setFieldValue('value', ev);
                        }}
                        onChange={(event) => {
                            if (!event) return;

                            setFieldValue(`value`, event.value);
                        }}
                    />
                ) : (
                    <StyledFormikField placeholder={inputPlaceHolder} name='value' />
                )}
            </FormItemInteraction>
        );
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    interactionList: state.botReducer.interactionList,
    currentInteraction: state.botReducer.currentInteraction,
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
    currentBot: state.botReducer.currentBot,
});

export const TypeInput = I18n(connect(mapStateToProps, {})(TypeInputClass));
