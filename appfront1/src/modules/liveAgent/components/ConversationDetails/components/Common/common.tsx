import { Tooltip, Typography } from 'antd';
import { FC } from 'react';
import styled from 'styled-components';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { getTitleDefaultTags } from '../../../../../../utils/getTitleDefaultTags';
const { Text } = Typography;

const Label = ({ children, title }) => {
    return (
        <Text ellipsis title={title} style={{ color: '#444444' }}>
            {children}
        </Text>
    );
};

const Avatar = styled.img`
    width: 38px;
    height: 38px;
    border-radius: 50%;
    padding: 4px;
`;

const CustomBadge: FC<{ style?: any; tag: { name: string; color: string }; notTagName?: boolean }> = ({
    tag,
    notTagName,
    style,
}) => {
    if (notTagName) {
        return (
            <Tooltip title={getTitleDefaultTags(tag.name).tag}>
                <Wrapper bgcolor={tag.color} width='29px' height='6px' margin='4px 8px 0 0' borderRadius='4px' />
            </Tooltip>
        );
    }

    return (
        <Tooltip
            color='rgba(0,0,0,.88)'
            title={
                getTitleDefaultTags(tag.name).message ? (
                    <>
                        <b>{getTitleDefaultTags(tag.name).tag}</b>
                        <br />
                        {getTitleDefaultTags(tag.name).message}
                    </>
                ) : (
                    getTitleDefaultTags(tag.name).tag
                )
            }
        >
            <Wrapper
                bgcolor={tag.color || 'rgb(255, 82, 82)'}
                cursor='default'
                padding='1px 7px'
                flexBox
                style={style}
                alignItems='center'
                borderRadius='18px'
                maxWidth='95%'
                margin='2px'
            >
                <Wrapper color='#FFF' truncate>
                    {tag.name}
                </Wrapper>
            </Wrapper>
        </Tooltip>
    );
};

export { Avatar, CustomBadge, Label };
