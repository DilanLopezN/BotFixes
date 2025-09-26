import styled from 'styled-components';

const Content = styled.div`
    background: #fff;
    box-shadow: 4px 5px 5px -6px rgba(0, 0, 0, 0.4);
    border-radius: 6px;
    padding: 12px 15px;
    margin: 0 0 10px 0;
    position: relative;
`;

const ContainerMessage = styled('div')<{ disabled?: boolean }>`
    overflow: hidden !important;
    ${({ disabled }) =>
        disabled &&
        `
    pointer-events: none;
    opacity: 0.5;
  `};
`;

export { Content, ContainerMessage };
