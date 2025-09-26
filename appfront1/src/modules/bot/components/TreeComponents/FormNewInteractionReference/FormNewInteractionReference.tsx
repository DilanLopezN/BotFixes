import React, { Component } from "react";
import { Formik, Form } from 'formik';
import { Interaction, InteractionType } from "../../../../../model/Interaction";
import { FormNewInteractionReferenceProps } from "./FormNewInteractionReferenceProps";
import { LabelWrapper } from "../../../../../shared/StyledForms/LabelWrapper/LabelWrapper";
import { StyledFormikField } from "../../../../../shared/StyledForms/StyledFormikField/StyledFormikField";
import I18n from "../../../../i18n/components/i18n";

class FormNewInteractionReferenceClass extends Component<FormNewInteractionReferenceProps, any>{

    private getFilteredInteractionList = (): Array<Interaction> => {
        return this.props.interactionList.filter((interaction: Interaction) => {
            return interaction._id != this.props.interaction._id
                && interaction.type != InteractionType.welcome
                && interaction.type != InteractionType.fallback
                && interaction.type != InteractionType.container
                && interaction.type != InteractionType.contextFallback
        })
    }

    render() {
        const { getTranslation } = this.props;

        const filteredInteraction = this.getFilteredInteractionList();
        return <Formik
            initialValues={{ reference: filteredInteraction.length > 0 ? filteredInteraction[0]._id : "" }}
            onSubmit={this.props.onSubmit}
            render={() => (
                <Form>
                    <LabelWrapper label={getTranslation('Select a interaction to reference')}>
                        <div className="input-group input-group-sm my-3">
                            <StyledFormikField className="form-control form-control-sm" component="select" name="reference">
                                {
                                    filteredInteraction.map((interaction: Interaction, index: number) => {
                                        return <option value={interaction._id} key={index}>{interaction.name}</option>
                                    })
                                }
                            </StyledFormikField>
                            <div className="input-group-append">
                                <button className="input-group-text pointer" type="submit">
                                    <span className="mdi mdi-chevron-right" />
                                </button>
                            </div>
                        </div>
                    </LabelWrapper>
                </Form>
            )} />
    }
}

export const FormNewInteractionReference = I18n(FormNewInteractionReferenceClass);