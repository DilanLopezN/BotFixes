import styled from 'styled-components';

interface TextLinkProps extends React.HTMLAttributes<HTMLSpanElement> {
    href?: any;
    target?: string;
}

const TextLink = styled.a<TextLinkProps>`
    color: #1890ff !important;
    cursor: pointer;
    &:hover {
        text-decoration: underline;
    }
`;
export { TextLink };
