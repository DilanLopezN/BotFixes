import React, {Component} from 'react';
import { IResponse} from '../../../../../model/Interaction';
import { IResponseElementImage } from 'kissbot-core';
import styled from 'styled-components';
import {CardImage} from '../BotResponseShared/Card/CardImage/CardImage';
import {BotResponseVideoProps} from "../BotResponseVideo/BotResponseVideoProps";

const Container = styled("div")`
    width: 60%;
    margin: auto;
`;

export class BotResponseImage extends  Component<BotResponseVideoProps>{

    onChange = (values: IResponseElementImage, isValid: boolean) => {
        const response: IResponse = this.props.response;
        response.elements[0] = values;
        response.isResponseValid = isValid;
        this.props.onChange(response);
    };

    render(){
        const element: IResponseElementImage = this.props.response.elements[0] as IResponseElementImage;
        return <Container>
            <CardImage onChange={this.onChange} isSubmitted={this.props.submitted} imageUrl={element.imageUrl}/>
        </Container>
    }
}
