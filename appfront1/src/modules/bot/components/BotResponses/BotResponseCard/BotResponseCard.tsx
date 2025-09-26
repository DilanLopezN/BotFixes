import { BotResponse } from "../interfaces";
import { Card } from '../BotResponseShared/Card/Card/Card';
import { IResponseElementCard } from '../../../../../model/ResponseElement';
import { IResponse } from '../../../../../model/Interaction';
import styled from 'styled-components';
const Container = styled("div")`
    width: 70%;
    margin: auto;
`
export class BotResponseCard extends BotResponse{

    onChange = (card: IResponseElementCard, isValid: boolean) => {
        const response: IResponse = this.props.response;
        response.elements[0] = card;
        response.isResponseValid = isValid;
        this.props.onChange(response);
    }
    render(){
        return <Container>
            <Card isSubmitted={this.props.submitted} onChange={this.onChange} card={this.props.response.elements[0] as IResponseElementCard}/>
        </Container>
    }
}
