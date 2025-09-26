import React, {Component} from 'react';
import {IResponse} from '../../../../../model/Interaction';
import { IResponseElementVideo} from 'kissbot-core';
import styled from 'styled-components';
import {CardVideo} from "../BotResponseShared/Card/CardVideo/CardVideo";
import {BotResponseVideoProps, BotResponseVideoState} from './BotResponseVideoProps';


const Container = styled("div")`
    width: 60%;
    margin: auto;
`;

export class BotResponseVideo extends  Component<BotResponseVideoProps, BotResponseVideoState>{
    constructor(props){
        super(props);
    }

    onChange = (values: IResponseElementVideo, isValid: boolean) => {
        const response: IResponse = this.props.response;
        response.elements[0] = values;
        response.isResponseValid = isValid;
        this.props.onChange(response);
    };

    render(){
        const element: IResponseElementVideo = this.props.response.elements[0] as IResponseElementVideo;
        return <Container>
            <CardVideo onChange={this.onChange} isSubmitted={this.props.submitted} videoUrl={element.videoUrl}/>
        </Container>
    }
}
