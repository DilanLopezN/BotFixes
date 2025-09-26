import React, { Component } from "react";
import styled from 'styled-components';
import { FormPopup } from "../../../../../../../shared/FormPopup/FormPopup";
import { LabelWrapper } from "../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper";
import { DoneBtn } from "../../../../../../../shared/StyledForms/DoneBtn/DoneBtn";
import { DiscardBtn } from "../../../../../../../shared/StyledForms/DiscardBtn/DiscardBtn";
import { Formik } from "formik";
import * as Yup from "yup";
import { CardVideoProps, CardVideoState } from "./CardVideoProps";
import { StyledFormikField } from "../../../../../../../shared/StyledForms/StyledFormikField/StyledFormikField";
import ReactPlayer from 'react-player';
import { v4 } from 'uuid';
import I18n from "../../../../../../i18n/components/i18n";
import { dispatchSentryError } from "../../../../../../../utils/Sentry";

const VideoContainer = styled("div")`
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const ComponentContainer = styled("div")`
    width: 100%;
    background: #e2e9f0;
    position: relative;
    :hover{
        i{
            display: block;
        }
    }
`;

const DoneBtnContainer = styled("div")`
    display: flex;
    justify-content: flex-end;
    margin: 5px;
`;

const ReactPlayerDiv = styled(ReactPlayer)`
    min-height: 150px;
    min-width: 312px;
`;

const IconSettings = styled("i")`
    position: absolute;
    right: 7px;
    top: 0px;
    display: none;
`;

class CardVideoClass extends Component<CardVideoProps, CardVideoState> {
    constructor(props: CardVideoProps) {
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
            videoUrl: Yup.string().required(getTranslation('This field is required'))
                .url(getTranslation('This field must be a valid URL'))
        })
    };

    render() {
        const { getTranslation } = this.props;

        return <ComponentContainer>
            <Formik
                initialValues={{ videoUrl: this.props.videoUrl }}
                onSubmit={() => { }}
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
                            <LabelWrapper label={getTranslation('Video url')} key={v4()} validate={{
                                errors, touched, fieldName: 'videoUrl',
                                isSubmitted: submitCount > 0
                            }}>
                                <StyledFormikField name="videoUrl" placeholder={getTranslation('Video url')} />
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
                        <VideoContainer className="pointer" onClick={this.toggleModal}>
                            {this.props.videoUrl
                                ?
                                <ReactPlayerDiv
                                    height={'100%'}
                                    url={this.props.videoUrl}
                                    controls
                                />
                                : <span
                                    className="mdi mdi-48px mdi-file-video pointer"
                                    onClick={this.toggleModal}
                                />}
                            <IconSettings className="mdi mdi-24px mdi-cog" onClick={this.toggleModal} />
                        </VideoContainer>
                    </FormPopup>
                }}
            />
        </ComponentContainer>
    }
}

export const CardVideo = I18n(CardVideoClass);
