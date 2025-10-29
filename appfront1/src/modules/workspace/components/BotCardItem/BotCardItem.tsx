import { FC } from 'react';
import { BotCardItemProps } from './BotCardItemProps';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import { IoChatbubbleEllipsesOutline } from 'react-icons/io5';
import { Content, ContentRow } from './styles';
import { LoadingOutlined } from '@ant-design/icons';
import { Col, Popover, Row, Spin } from 'antd';

const Name = styled.span`
    font-size: 14px;
    color: #444;
    word-break: break-all;
`;

const Icon = styled(IoChatbubbleEllipsesOutline)`
    font-size: 30px;
    color: #777;
`;

const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

const BotCardItem: FC<BotCardItemProps> = (props) => {
    const { bot } = props;

    return (
        <Row>
            <Col span={22}>
                <div style={{ pointerEvents: bot?.cloning ? 'none' : 'auto' }}>
                    <NavLink to={`/workspace/${props.bot?.workspaceId}/bot/${props.bot?._id}`}>
                        <Content>
                            <ContentRow>
                                <h4>{<Icon />}</h4>
                                <Name>{bot?.name}</Name>
                            </ContentRow>
                        </Content>
                    </NavLink>
                </div>
            </Col>
            <Col>
                {bot?.cloning ? (
                    <Popover title={`O clone do bot está em andamento`}>
                        <Spin style={{ position: 'relative', top: 20, right: 30 }} indicator={antIcon} />
                    </Popover>
                ) : null}
            </Col>
        </Row>
    );
};

export { BotCardItem };
