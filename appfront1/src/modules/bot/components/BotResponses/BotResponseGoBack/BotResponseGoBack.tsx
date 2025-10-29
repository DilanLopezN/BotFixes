import React, { Component } from "react";
import { connect } from "react-redux";
import { BotResponseProps } from "../interfaces";
import styled from 'styled-components';
import I18n from "../../../../i18n/components/i18n";
import { I18nProps } from "../../../../i18n/interface/i18n.interface";

const DescriptionContainer = styled("p")`
    text-align: center;
    display: flex;
    font-size: 18px;
    flex-direction: column;
`
interface BotResponseGoBackProps extends BotResponseProps, I18nProps { }

export class BotResponseGoBackClass extends Component<BotResponseGoBackProps>{
    render() {
        const { getTranslation } = this.props;

        return <div>
            <DescriptionContainer>
                {`${getTranslation('Goback responses are used to return to interaction that called it')}.`}
                <small>
                    {getTranslation('When go back response is executed, the subsequent responses will be ignored')}
                </small>
                <span className="mdi mdi-48px mdi-restore"></span>
            </DescriptionContainer>
        </div>
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({})

export const BotResponseGoBack = I18n(connect(
    mapStateToProps,
    {}
)(BotResponseGoBackClass));