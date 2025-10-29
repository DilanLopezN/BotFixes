import { CSSProperties, FC } from 'react';
import styled from 'styled-components';
import HelpCenterLink from '../../shared/HelpCenterLink';
import { Row, Spin } from 'antd';

const Div = styled.div`
    display: flex;
    flex-direction: column;
    background-color: #fff;
    border: 1px solid #d9d9d9;
    border-radius: 2px;
    min-width: 900px;
    margin: 16px 24px;
    overflow: hidden;
`;

const ContentHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 56px;
    padding: 16px;
    border-bottom: 1px solid #d9d9d9;
`;

const ContentBody = styled.div`
    padding: 16px;
`;

const Title = styled.span`
    font-size: 16px;
    font-weight: 700;
`;

const ActionsWrapper = styled.div``;

interface CardWrapperFormProps {
    title?: string | React.ReactNode;
    children?: React.ReactNode;
    childrenHeader?: React.ReactNode;
    loading?: boolean;
    textLinkHelpCenter?: string;
    linkHelpCenter?: string;
    style?: CSSProperties;
}

const CardWrapperForm: FC<CardWrapperFormProps> = (props) => {
    const { title, style, linkHelpCenter, textLinkHelpCenter, children, loading = false, childrenHeader } = props;

    return (
        <Div style={style}>
            <ContentHeader>
                <Title>{title}</Title>
                <ActionsWrapper>
                    {childrenHeader ? (
                        <Row>{childrenHeader}</Row>
                    ) : (
                        <HelpCenterLink
                            textStyle={{ color: '#1890ff' }}
                            article={linkHelpCenter}
                            text={textLinkHelpCenter}
                            iconPosition='left'
                        />
                    )}
                </ActionsWrapper>
            </ContentHeader>
            <Spin spinning={loading}>
                <ContentBody>{children}</ContentBody>
            </Spin>
        </Div>
    );
};

export default CardWrapperForm as FC<CardWrapperFormProps>;
