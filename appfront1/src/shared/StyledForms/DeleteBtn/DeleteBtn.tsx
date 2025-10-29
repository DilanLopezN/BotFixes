import React, { Component } from 'react';
import styled from 'styled-components';

const ContainerDeleteBtn = styled("div")`
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
`

export class DeleteBtn extends Component<any>{
    render() {
        return <ContainerDeleteBtn {...this.props}>
            <span className="mdi mdi-24px mdi-delete-outline"/>
        </ContainerDeleteBtn>
    }
}
