import React, { Component } from 'react'
import isEmpty from 'lodash/isEmpty';
import orderBy from 'lodash/orderBy';
import { CustomCreatableSelect } from '../CustomCreatableSelect/CustomCreatableSelect';
import { connect } from 'react-redux';
import { BotAttribute } from '../../../model/BotAttribute';
import { CustomSelect } from '../CustomSelect/CustomSelect';

export interface BotAttrs {
    value: {
        name: string,
        label: string,
    }
    onCreateOption: (...params) => any;
    onChange: (...params) => any;
    botAttributes: BotAttribute[];
    showOnly: string[];
    creatable?: boolean;
    botAttributesFlow?: BotAttribute[];
}

export default class BotAttrsClass extends Component<BotAttrs> {
    exist = (option: string) => this.props.showOnly && this.props.showOnly.find(item => item == option);

    renderOptions = () => {
        const options = [] as any;

        if (this.exist('entity'))
            options.push({
                label: "Entity",
                options: [
                    ...orderBy(this.props.botAttributesFlow ? this.props.botAttributesFlow : this.props.botAttributes
                        .filter(botAttr => botAttr.name && !botAttr.name.startsWith("default_") && botAttr.fromEntity), ['name'])
                        .map((botAttr) => ({ value: botAttr.name, label: botAttr.name }))
                ]
            });
        if (this.exist('others'))
            options.push({
                label: "Others",
                options: [
                    ...orderBy(this.props.botAttributesFlow ? this.props.botAttributesFlow : this.props.botAttributes
                        .filter(botAttr => botAttr.name && !botAttr.name.startsWith("default_") && !botAttr.fromEntity), ['name'])
                        .map((botAttr) => ({ value: botAttr.name, label: botAttr.name }))
                ]
            });

        if (this.exist('defaults'))
            options.push({
                label: "Defaults",
                options: [
                    ...orderBy(this.props.botAttributesFlow ? this.props.botAttributesFlow : this.props.botAttributes
                        .filter(botAttr => botAttr.name && botAttr.name.startsWith("default_")), ['name'])
                        .map((botAttr) => ({ value: botAttr.name, label: botAttr.name }))
                ]
            });
        return options;
    }
    render() {
        return this.props.creatable
            ? <CustomCreatableSelect
                options={
                    [...this.renderOptions()]
                }
                value={{
                    value: this.props.value.name,
                    label: this.props.value.label
                }}
                placeholder="Select or type an complex attribute name"
                onCreateOption={ev => {
                    this.props.onCreateOption(ev);
                }}
                onChange={ev => {
                    if (ev === null || isEmpty(ev)) {
                        return this.props.onChange({ value: '' });
                    }
                    return this.props.onChange(ev);
                }}
            />
            : <CustomSelect
                options={
                    [...this.renderOptions()]
                }
                value={{
                    value: this.props.value.name,
                    label: this.props.value.label
                }}
                placeholder="Select or type an complex attribute name"
                onChange={ev => {
                    if (ev === null || isEmpty(ev)) {
                        return this.props.onChange({ value: '' });
                    }
                    return this.props.onChange(ev);
                }}
            />
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    botAttributes: state.botReducer.botAttributes
})

export const BotAttrs = connect(
    mapStateToProps,
    {}
)(BotAttrsClass);
