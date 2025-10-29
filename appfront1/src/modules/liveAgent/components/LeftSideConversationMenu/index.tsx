import React, { useState, FC } from 'react';
import styled from 'styled-components';
import './styles.scss';
import { getColor, ColorType, ColorVariation } from '../../../../ui-kissbot-v2/theme';
import { timeout } from '../../../../utils/Timer';

const Container = styled('div')`
    /* Safari 4.0 - 8.0 */
    @-webkit-keyframes openSide {
        from {
            width: 0;
        }
        to {
            width: 100%;
        }
    }

    /* Standard syntax */
    @keyframes openSide {
        from {
            width: 0;
        }
        to {
            width: 100%;
        }
    }

    /* Safari 4.0 - 8.0 */
    @-webkit-keyframes closeSide {
        to {
            width: 0;
        }
        from {
            width: 100%;
        }
    }

    /* Standard syntax */
    @keyframes closeSide {
        to {
            width: 0;
        }
        from {
            width: 100%;
        }
    }
    &:not(.closing) {
        -webkit-animation-name: openSide; /* Safari 4.0 - 8.0 */
        -webkit-animation-duration: 0.3s; /* Safari 4.0 - 8.0 */
        animation-name: openSide;
        animation-duration: 0.3s;
    }
    &.closing {
        -webkit-animation-name: closeSide; /* Safari 4.0 - 8.0 */
        -webkit-animation-duration: 0.3s; /* Safari 4.0 - 8.0 */
        animation-name: closeSide;
        animation-duration: 0.3s;
    }
    position: absolute;
    background: rgba(0, 0, 0, 0.3);
    width: 100%;
    height: 100%;
    z-index: 1;
    overflow: hidden;
    border-right: 1px #f0f0f0 solid;
`;

const Header = styled('div')`
    width: 100%;
    height: 65px;
    display: flex;
    justify-content: space-between;
    background: #fff;
    align-items: center;
    padding: 10px 15px;
    border-right: 1px;
    border-bottom: 1px #f0f0f0 solid;
`;

interface Props {
    onClose: () => any;
    title: string;
    verifyStatus: boolean;
    children?: React.ReactNode;
}

const LeftSideConversationMenu: FC<Props> = ({ children, title, onClose, verifyStatus }) => {
    const [isClosing, setIsClosing] = useState(false);

    return (
        <Container
            style={{
                marginTop: `${verifyStatus ? '100px' : '0'}`,
                height: `${verifyStatus ? 'calc(100% - 100px)' : '100%'}`,
            }}
            className={' LeftSideConversationMenu ' + (isClosing ? ' closing ' : '')}
        >
            <Header>
                <span className='left-side-title'>{title}</span>
                <span
                    onClick={() => {
                        setIsClosing(true);
                        timeout(onClose, 300);
                    }}
                    style={{
                        color: getColor(ColorType.text, ColorVariation.dark),
                    }}
                    className='mdi mdi-24px mdi-close pointer left-side-button'
                />
            </Header>
            {children}
        </Container>
    );
};

export default LeftSideConversationMenu;
