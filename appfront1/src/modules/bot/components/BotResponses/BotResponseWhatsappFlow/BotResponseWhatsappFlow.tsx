import { BotResponse } from "../interfaces";
import { FlowCard } from './FlowCard/FlowCard';
import { IResponseElementWhatsappFlow } from 'kissbot-core';
import { IResponse } from '../../../../../model/Interaction';
import styled from 'styled-components';
const Container = styled("div")`
    width: 98%;
    margin: auto;
`
export class BotResponseWhatsappFlow extends BotResponse{

    onChange = (flowCard: IResponseElementWhatsappFlow, isValid: boolean) => {
        const response: IResponse = this.props.response;
        response.elements[0] = flowCard;
        response.isResponseValid = isValid;
        this.props.onChange(response);
    }
    render(){
        return <Container>
            <FlowCard isSubmitted={this.props.submitted} onChange={this.onChange} flowCard={this.props.response.elements[0] as IResponseElementWhatsappFlow} botAttributes={this.props.botAttributes}/>
        </Container>
    }
}
