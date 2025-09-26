import React, { Component } from "react";
import styled from 'styled-components';
import { FormPopup } from "../../../../../../../shared/FormPopup/FormPopup";
import { LabelWrapper } from "../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper";
import { DoneBtn } from "../../../../../../../shared/StyledForms/DoneBtn/DoneBtn";
import { DiscardBtn } from "../../../../../../../shared/StyledForms/DiscardBtn/DiscardBtn";
import { Formik } from "formik";
import * as Yup from "yup";
import { CardImageProps, CardImageState } from "./CardImageProps";
import { StyledFormikField } from "../../../../../../../shared/StyledForms/StyledFormikField/StyledFormikField";
import I18n from "../../../../../../i18n/components/i18n";
import { dispatchSentryError } from "../../../../../../../utils/Sentry";

const ImageContainer = styled("div")`
    width: 100%;
    height: 150px;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const ComponentContainer = styled("div")`
    width: 100%;
    height: 150px;
    background: #e2e9f0;
    position: relative;
`;

const StyledImage = styled("img")`
    max-width: 100%;
    max-height: 150px;
    min-width: 312px;
`;

const DoneBtnContainer = styled("div")`
    display: flex;
    justify-content: flex-end;
    margin: 5px;
`;

class CardImageClass extends Component<CardImageProps, CardImageState> {
    constructor(props: CardImageProps) {
        super(props);
        this.state = {
            isOpenedModal: false
        }
    }
    onChange = (values, isValid) => {
        if (this.props.onChange) {
            this.props.onChange(values, isValid);
        }
    };

    toggleModal = () => {
        this.setState({  isOpenedModal: !this.state.isOpenedModal });
    };


    getValidationSchema = () => {
        const { getTranslation } = this.props;

        return Yup.object().shape({
            imageUrl: Yup.string().required(getTranslation('This field is required'))
                .url(getTranslation('This field must be a valid URL'))
        })
    };

    render() {
        const { getTranslation } = this.props;

        return <ComponentContainer>
            <Formik
                initialValues={{ imageUrl: this.props.imageUrl }}
                onSubmit={() => {
                }}
                validationSchema={this.getValidationSchema()}
                render={({ submitForm, values, validateForm, errors, touched, submitCount }) => {
                    const submit = () => {
                        validateForm().then((validatedValues: any) => {
                            if (Object.keys(validatedValues).length != 0) {
                                this.onChange(values, false);
                            } else {
                                this.onChange(values, true);
                                this.toggleModal();
                            }
                            submitForm();
                        }).catch(e => dispatchSentryError(e))
                    };

                    return <FormPopup
                        isOpenedPopover={this.state.isOpenedModal}
                        onClose={this.toggleModal}
                        trigger=" pointer "
                        popupBody={[
                            <LabelWrapper label={getTranslation('Image url')} key={1} validate={{
                                errors, touched, fieldName: 'imageUrl',
                                isSubmitted: submitCount > 0
                            }}>
                                <StyledFormikField name="imageUrl" placeholder={getTranslation('Image url')} />
                            </LabelWrapper>,
                            <DoneBtnContainer key={2}>
                                <DiscardBtn onClick={this.toggleModal}>
                                    {getTranslation('Cancel')}
                                </DiscardBtn>
                                <DoneBtn onClick={submit}>
                                {getTranslation('Save')}
                                </DoneBtn>
                            </DoneBtnContainer>
                        ]}>
                        <ImageContainer className="pointer" onClick={this.toggleModal}>
                            {
                                this.props.imageUrl
                                    ? <StyledImage src={this.props.imageUrl} />
                                    : <span className="mdi mdi-48px mdi-image-outline pointer"
                                        onClick={this.toggleModal} />
                            }
                        </ImageContainer>
                    </FormPopup>
                }}
            />
        </ComponentContainer>
    }
}

export const CardImage = I18n(CardImageClass);
