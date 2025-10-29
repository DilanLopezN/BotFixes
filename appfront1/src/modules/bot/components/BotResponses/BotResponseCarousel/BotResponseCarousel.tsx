import React, { Component } from 'react';
import { Card } from '../BotResponseShared/Card/Card/Card';
import { IResponseElementCard } from '../../../../../model/ResponseElement';
import { IResponse } from '../../../../../model/Interaction';
import styled from 'styled-components';
import { AddBtn } from '../../../../../shared/StyledForms/AddBtn/AddBtn';
import { DeleteBtn } from '../../../../../shared/StyledForms/DeleteBtn/DeleteBtn';
import { Carousel } from 'antd';
import { BotResponseCarouselProps, BotResponseCarouselState } from "./BotResponseCarouselProps";
import { ICardMediaType } from "kissbot-core/lib";
import { timeout } from '../../../../../utils/Timer';

const Container = styled("div")`
    min-height: 350px;
`

const CardActions = styled("div")`
    width: 350px;
    height: 36px;
    display: flex;
    justify-content: space-between;
`

const AddNewCarouselItemBtn = styled(AddBtn)`
    &:before{
        content: " ";
            position: absolute;
            width: 21px;
            border-bottom: 2px dashed #ccc;
            left: -21px;
    }
`

const CardAndActionsContainer = styled.div`
    flex-direction: column;
    justify-content: center;
    align-items: center;
    display: flex;
    margin: 0 auto;
    width: 350px;
    padding: 0 0 35px 0;
`;

export class BotResponseCarousel extends Component<BotResponseCarouselProps, BotResponseCarouselState> {
    constructor(props: any) {
        super(props);
        this.state = {
            currentIndex: 0
        };
    }

    onChange = (card: IResponseElementCard, isValid: boolean, index: number) => {
        card.isElementCardValid = isValid;
        const response: IResponse = this.props.response;
        response.elements[index] = card;
        const isAllCardValid: boolean = !response.elements.find((card) => {
            const cardElement: IResponseElementCard = card as IResponseElementCard
            return cardElement.isElementCardValid == false;
        })
        response.isResponseValid = isAllCardValid;
        this.props.onChange(response);
    }

    handleSelect = (nextIndex: number) => {
        this.setState({
            currentIndex: nextIndex,
        })
    }

    emptyCard = () => {
        return {
            title: "",
            subtitle: "",
            text: "",
            media: {
                type: ICardMediaType.IMAGE,
                url: "",
                autoPlay: false,
                autoLoop: false
            },
            buttons: [],
            isElementCardValid: false
        } as IResponseElementCard
    }

    addCard = () => {
        const card = this.emptyCard()
        const response: IResponse = this.props.response;
        response.elements.push(card);
        response.isResponseValid = false;
        this.props.onChange(response);

        timeout(() => this.handleSelect(response.elements.length - 1), 50);
    }

    delete = (index: number) => {
        const { response } = this.props;
        const { currentIndex } = this.state;

        response.elements.splice(index, 1);

        const responsesLength = response.elements.length - 1;
        const nextIndex = currentIndex > responsesLength ? currentIndex - 1 : responsesLength === currentIndex ? 0 : currentIndex + 1;

        this.props.onChange(response);
        this.handleSelect(nextIndex)
    }

    hashCode(str) {
        return str.split('').reduce((prevHash, currVal) =>
            (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0);
    }

    render() {
        const { currentIndex } = this.state;
        const { response } = this.props;
        return <Container>
            <Carousel
                arrows
                initialSlide={currentIndex}
                infinite
                afterChange={this.handleSelect}
                >
                {response.elements.map((card: IResponseElementCard, index: number) => {
                    const key = this.hashCode(card.title + '' + card.imageUrl + '' + card.text + '')
                    return <div key={key}>
                        <CardAndActionsContainer>
                            <CardActions>
                                {response.elements.length > 1 && <DeleteBtn onClick={() => this.delete(index)} />}
                                <AddNewCarouselItemBtn onClick={this.addCard} />
                            </CardActions>
                            <Card
                                isSubmitted={this.props.submitted}
                                onChange={(card: any, isValid: boolean) => this.onChange(card, isValid, index)}
                                card={card as IResponseElementCard} />
                        </CardAndActionsContainer>
                    </div>
                })}
            </Carousel >
        </Container>
    }
}
