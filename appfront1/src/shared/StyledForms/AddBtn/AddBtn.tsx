import React, { Component } from 'react';
import styled from 'styled-components';

const ContainerAddBtn = styled("div")`
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.19);
    background: var(--color8);
    cursor: pointer;
`

export class AddBtn extends Component<any>{
    render() {
        return <ContainerAddBtn {...this.props}>
            <span className="mdi mdi-plus"></span>
        </ContainerAddBtn>
    }
}
