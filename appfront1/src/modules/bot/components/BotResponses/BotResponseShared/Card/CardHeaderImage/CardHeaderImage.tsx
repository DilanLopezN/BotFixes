import React, { Component } from "react";
import styled from 'styled-components';
import { CardHeaderImageState, CardHeaderImageProps } from "./CardHeaderImageProps";
import { FormPopup } from "../../../../../../../shared/FormPopup/FormPopup";
import { LabelWrapper } from "../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper";
import { DoneBtn } from "../../../../../../../shared/StyledForms/DoneBtn/DoneBtn";
import { DiscardBtn } from "../../../../../../../shared/StyledForms/DiscardBtn/DiscardBtn";
import ButtonSelect from "../../../../../../../shared/StyledForms/ButtonSelect/ButtonSelect";
import ReactPlayer from "react-player";
import CheckSelect from "../CheckSelect/CheckSelect";
import { Formik } from "formik";
import { StyledFormikField } from "../../../../../../../shared/StyledForms/StyledFormikField/StyledFormikField";
import I18n from "../../../../../../i18n/components/i18n";

const ImageContainer = styled("div")`
    width: 100%;
    height: 150px;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const VideoContainer = styled("div")`
    width: 100%;
    height: 150px;
    display: flex;
    max-width: 342px;
    justify-content: center;
    align-items: center;
`;

const ComponentContainer = styled("div")`
    width: 100%;
    height: 150px;
    background: #e2e9f0;
    position: relative;
`;

const ReactPlayerDiv = styled(ReactPlayer)`
    min-height: 150px;
    min-width: 312px;
`;

const StyledImage = styled("img")`
    max-width: 100%;
    max-height: 150px;
    min-width: 312px;
`;

const DoneBtnContainer = styled("div")`
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
`;
const IconSettings = styled("i")`
    z-index: 1000;
    position: absolute;
    right: -31px;
    top: -6px;
`;

class CardHeaderImageClass extends Component<CardHeaderImageProps, CardHeaderImageState>{
    constructor(props: CardHeaderImageProps) {
        super(props);
        this.state = {
            isOpenedModal: false
        }
    }

    toggleModal = () => {
        this.setState({  isOpenedModal: !this.state.isOpenedModal });
    };

    discard = () => {
        this.toggleModal();
    };

    render() {
        const { getTranslation } = this.props;

        return <ComponentContainer>
            <Formik
                initialValues={{ ...this.props.media }}
                onSubmit={(values) => {
                    this.props.onChange(values)
                    this.toggleModal();
                }}
                render={({ values, submitForm, setFieldValue }) => {
                    return <div>
                        <FormPopup
                            isOpenedPopover={this.state.isOpenedModal}
                            onClose={this.toggleModal}
                            trigger=" pointer "
                            popupBody={[
                                <LabelWrapper key={1}>
                                    <ButtonSelect
                                        options={[{ label: getTranslation('Image'), value: "image" },
                                        { label: getTranslation('Video'), value: "video" }]}
                                        onChange={(type) => {
                                            setFieldValue(`type`, type);
                                        }}
                                        value={values.type}
                                    />
                                    <StyledFormikField name="url" onBlur={() => this.props.onChange(values)} />
                                    {values.type === "video" ? <CheckSelect
                                        width={"52%"}
                                        onChange={(type, value) => (
                                            type === "autoPlay" ? setFieldValue(`autoPlay`, value) : null,
                                            type === "autoLoop" ? setFieldValue(`autoLoop`, value) : null
                                        )}
                                        values={values}
                                    /> : null}
                                </LabelWrapper>,
                                <DoneBtnContainer key={2}>
                                    <DiscardBtn onClick={this.discard}>
                                        {getTranslation('Cancel')}
                                    </DiscardBtn>
                                    <DoneBtn onClick={submitForm}>
                                        {getTranslation('Save')}
                                    </DoneBtn>
                                </DoneBtnContainer>
                            ]}>
                            <div>
                                {values.type === "video" ? <VideoContainer className="pointer" onClick={this.toggleModal}>
                                    {
                                        values.url
                                            ?
                                            <ReactPlayerDiv
                                                height={'100%'}
                                                url={values.url}
                                                controls
                                            /> : <span className="mdi mdi-48px mdi-image-outline pointer" onClick={this.toggleModal} />
                                    }
                                </VideoContainer> :

                                    <ImageContainer className="pointer" onClick={this.toggleModal}>
                                        {
                                            values.url
                                                ? <StyledImage src={values.url} />
                                                : <span className="mdi mdi-48px mdi-image-outline pointer" onClick={this.toggleModal} />
                                        }
                                    </ImageContainer>}
                                {values.type === "video"
                                    ? <IconSettings className="mdi mdi-24px mdi-cog pointer" onClick={this.toggleModal} />
                                    : null}
                            </div>
                        </FormPopup>
                    </div>
                }
                } />
        </ComponentContainer>
    }
}

export const CardHeaderImage = I18n(CardHeaderImageClass);
