import React, { Component } from "react";
import { StyledFormikField } from "../StyledFormikField/StyledFormikField";
import { BotAttributeSelectProps } from "./BotAttributeSelectProps";
import { BotAttribute } from "../../../model/BotAttribute";
import { connect } from "react-redux";
import uniqBy from 'lodash/uniqBy';
import I18n from "../../../modules/i18n/components/i18n";

class BotAttributeSelectClass extends Component<BotAttributeSelectProps>{

    private getDefaultAttr = (): BotAttribute[] => {
        return this.props.botAttributes.filter(attr => attr.name.startsWith("default")) || [];
    }

    private isEntityNameValid = (arrayAttribute) => {
        return uniqBy(arrayAttribute, 'name') as any;
    };

    private getBotAttr = (): BotAttribute[] => {
        const resultBotAttribute = this.props.botAttributes.filter(attr => attr.name && !attr.name.startsWith("default") && !attr.fromEntity) || [];
        return this.isEntityNameValid(resultBotAttribute);
    };

    private getEntityAttr = (): BotAttribute[] => {
        return this.props.botAttributes.filter(attr => attr.fromEntity) || [];
    };

    private renderOpt = (attr: BotAttribute, key) => <option
        key={key}
        value={attr.name}
    >
        {attr.name}
    </option>

    render() {
        const { getTranslation } = this.props;

        if (!this.props.botAttributes) return;
        return <StyledFormikField component="select"
            name={this.props.fieldName}
            onChange={(ev) => {
                this.props.handleChange(ev);
                if (this.props.onOptionSelected) {
                    this.props.onOptionSelected(
                        this.props.botAttributes.find(attr => attr.name == ev.target.value)
                    );
                }
            }}
            onBlur={(ev) => {
                this.props.handleBlur(ev);
                if (this.props.onBlur) {
                    this.props.onBlur();
                }
            }}
        >
            <option value="" disabled>{getTranslation('Select option')}</option>
            <optgroup label={getTranslation('Bot attributes')}>
                {this.getBotAttr().map((attr, index) => this.renderOpt(attr, index))}
            </optgroup>
            <optgroup label={getTranslation('Entity attributes')}>
                {this.getEntityAttr().map((attr, index) => this.renderOpt(attr, index))}
            </optgroup>
            <optgroup label={getTranslation('Default attributes')}>
                {this.getDefaultAttr().map((attr, index) => this.renderOpt(attr, index))}
            </optgroup>
        </StyledFormikField>
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    botAttributes: state.botReducer.botAttributes
})
export const BotAttributeSelect = I18n(connect(
    mapStateToProps,
    {}
)(BotAttributeSelectClass));
