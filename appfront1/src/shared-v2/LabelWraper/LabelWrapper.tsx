import { FC } from 'react';
import styled from 'styled-components';

const Div = styled.div`
    width: 100%;
    min-width: 300px;
    display: flex;
    flex-direction: column;
    padding: 10px 20px;
    margin: 10px 0;
`;
const Title = styled.div`
    font-size: 16px;
    font-weight: bold;
`;
const Subtitle = styled.div`
    width: 100%;
`;
const ContentBody = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
`;
const Content = styled.div`
    width: 50%;
    display: flex;
    justify-content: flex-end;
    align-items: center;
`;

interface LabelWrapperProps {
    title: string;
    subtitle: string | JSX.Element;
    children?: React.ReactNode;
}

const LabelWrapper: FC<LabelWrapperProps> = (props) => {
    const {
        children,
        title,
        subtitle,
    } = props;

    return (
        <Div>
            <Title>{title}</Title>
            <ContentBody>
                <Subtitle>{subtitle}</Subtitle>
                <Content>{children}</Content>
            </ContentBody>
        </Div>
    );
};

export default LabelWrapper;
