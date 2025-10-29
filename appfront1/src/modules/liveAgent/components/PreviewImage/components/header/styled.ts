import styled from 'styled-components';

const Content = styled.div`
    display: flex;
    height: 70px;
    background: #FFF;
    border-bottom: 1px #e0e0e0 solid;
    padding: 10px;
    position: absolute;
    right: 0;
    left: 0;
    top: 0;
`;

const IconTag = styled.span <{ margin?: string }>`
  ${props => props.margin && `
    ::before {
      margin: ${props.margin}
    }
  `}
  font-size: 27px;
  cursor: pointer;
`;


export { Content, IconTag }