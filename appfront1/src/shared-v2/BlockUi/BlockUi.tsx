import { FC } from 'react';
import styled from 'styled-components';

const Div = styled.div`
.loading-indicator {
    text-align: center;
}
.loading-bullet {
    display: inline-block;
    opacity: 0;
    font-size: 2em;
    color: #02a17c;
}
.block-ui {
    position: relative;
    min-height: 3em;
}
.block-ui-container {
    position: absolute;
    z-index: 1010;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    height: 100%;
    min-height: 2em;
    cursor: wait;
    overflow: hidden;
}
.block-ui-container:focus {
    outline: none;
}
.block-ui-overlay {
    width: 100%;
    height: 100%;
    opacity: 0.5;
    filter: alpha(opacity=50);
    background-color: white;
}
.block-ui-message-container {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    text-align: center;
    transform: translateY(-50%);
    z-index: 10001;
}
.block-ui-message {
    color: #333;
    background: none;
    z-index: 1011;
}

/* CSS Animations */
@-webkit-keyframes fadeInRTL1 {
    0% {
        opacity: 0;
        -webkit-transform: translateX(20px);
        transform: translateX(20px);
    }
    30% {
        opacity: 1;
        -webkit-transform: translateX(0px);
        transform: translateX(0px);
    }
    60% {
        opacity: 1;
    }
    80% {
        opacity: 0;
    }
}
@keyframes fadeInRTL1 {
    0% {
        opacity: 0;
        -webkit-transform: translateX(20px);
        transform: translateX(20px);
    }
    30% {
        opacity: 1;
        -webkit-transform: translateX(0px);
        transform: translateX(0px);
    }
    60% {
        opacity: 1;
    }
    80% {
        opacity: 0;
    }
}
@-webkit-keyframes fadeInRTL2 {
    0% {
        opacity: 0;
    }
    10% {
        opacity: 0;
        -webkit-transform: translateX(20px);
        transform: translateX(20px);
    }
    40% {
        opacity: 1;
        -webkit-transform: translateX(0px);
        transform: translateX(0px);
    }
    60% {
        opacity: 1;
    }
    80% {
        opacity: 0;
    }
}
@keyframes fadeInRTL2 {
    0% {
        opacity: 0;
    }
    10% {
        opacity: 0;
        -webkit-transform: translateX(20px);
        transform: translateX(20px);
    }
    40% {
        opacity: 1;
        -webkit-transform: translateX(0px);
        transform: translateX(0px);
    }
    60% {
        opacity: 1;
    }
    80% {
        opacity: 0;
    }
}
@-webkit-keyframes fadeInRTL3 {
    0% {
        opacity: 0;
    }
    20% {
        opacity: 0;
        -webkit-transform: translateX(20px);
        transform: translateX(20px);
    }
    50% {
        opacity: 1;
        -webkit-transform: translateX(0px);
        transform: translateX(0px);
    }
    60% {
        opacity: 1;
    }
    80% {
        opacity: 0;
    }
}
@keyframes fadeInRTL3 {
    0% {
        opacity: 0;
    }
    20% {
        opacity: 0;
        -webkit-transform: translateX(20px);
        transform: translateX(20px);
    }
    50% {
        opacity: 1;
        -webkit-transform: translateX(0px);
        transform: translateX(0px);
    }
    60% {
        opacity: 1;
    }
    80% {
        opacity: 0;
    }
}
.loading-bullet {
    display: inline-block;
    opacity: 0;
    -webkit-animation: 3s ease .5s infinite fadeInRTL1;
    animation: 3s ease .5s infinite fadeInRTL1;
}
.loading-bullet + .loading-bullet {
    -webkit-animation-name: fadeInRTL2;
    animation-name: fadeInRTL2;
}
.loading-bullet + .loading-bullet + .loading-bullet {
    -webkit-animation-name: fadeInRTL3;
    animation-name: fadeInRTL3;
}
`;

interface BlockUiProps {
    blocking?: boolean;
    children?: React.ReactNode;
    className?: string; 
}

const BlockUi: FC<BlockUiProps> = (props) => {
    const {
        blocking,
        className,
        children,
    } = props;

    return (
        <Div className={className}>
            <div className='block-ui'>
                {blocking &&
                    <div tabIndex={0} onKeyUp={(e) => e.preventDefault()} onKeyDown={(e) => e.preventDefault()} />}
                {children}
                {blocking &&
                    <div className="block-ui-container"
                        tabIndex={0}
                        onKeyUp={(e) => e.preventDefault()}
                        onKeyDown={(e) => e.preventDefault()}
                    >
                        <div className="block-ui-overlay" />
                        <div className="block-ui-message-container">
                            <div className="block-ui-message">
                                <div className="loading-indicator">
                                    <span className="loading-bullet">&bull;</span>{' '}
                                    <span className="loading-bullet">&bull;</span>{' '}
                                    <span className="loading-bullet">&bull;</span>
                                </div>
                            </div>
                        </div>

                    </div>
                }
            </div>
        </Div>
    );
};

export default BlockUi as FC<BlockUiProps>;
