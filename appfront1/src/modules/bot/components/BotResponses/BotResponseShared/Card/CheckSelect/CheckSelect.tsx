import React, {Component} from "react";
import {CheckSelectProps} from "./CheckSelectProps";
import './CheckSelect.scss'
import {StyledFormikField} from "../../../../../../../shared/StyledForms/StyledFormikField/StyledFormikField";
import styled from 'styled-components';

const StyledForm = styled(StyledFormikField)`
    min-height: auto;
    width: auto;
`;

export default class CheckSelect extends Component<CheckSelectProps> {

    render(): React.ReactNode {
        return <div className="CheckSelect" style={{width: "60%"}}>
            <div className="form-check">
                <StyledForm type="checkbox"
                            name={"autoPlay"}
                            onClick={() => this.props.onChange("autoPlay", !this.props.values.autoPlay)}
                            className="form-check-input"
                            checked={this.props.values.autoPlay}
                />
                <label className="form-check-label" htmlFor="exampleCheck1">autoPlay</label>
            </div>
            <div className="form-check">
                <StyledForm type="checkbox"
                            name={"autoLoop"}
                            className="form-check-input"
                            checked={this.props.values.autoLoop}
                            onClick={() => this.props.onChange("autoLoop", !this.props.values.autoLoop)}
                />
                <label className="form-check-label">autoLoop</label>
            </div>
        </div>
    }
}