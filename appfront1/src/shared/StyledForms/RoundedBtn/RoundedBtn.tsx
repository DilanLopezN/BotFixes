import { Component } from 'react';

import styled from 'styled-components'
import { RoundedBtnProps } from './RoundedBtnProps'

const RoundedBtnContainer = styled("div")`
    width: 42px;
    height: 42px;
    display: flex;
    background: var(--color3);
    border-radius: 50%;
    align-items: center;
    justify-content: center;
    color: var(--color8);
    font-weight: 700;
    text-align: center;
    cursor: pointer;
    font-size: 14px;
    span{
        color: var(--color8);
        &:hover{
            color: var(--color8);
        }
    }
`

export class RoundedBtn extends Component<RoundedBtnProps>{
    render() {
        return <RoundedBtnContainer onClick={this.props.onClick} className={this.props.btnClass}>
            {this.props.children || <span className={this.props.iconClass}></span>}
        </RoundedBtnContainer>
    }
}
