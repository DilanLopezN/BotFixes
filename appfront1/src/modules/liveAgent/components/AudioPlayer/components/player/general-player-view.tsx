import { FC } from 'react';
import { Col, Row, Slider } from 'antd';
import styled from 'styled-components';
import { FaPause, FaPlay } from 'react-icons/fa';
import { PlayerViewProps } from './props';
import { AiOutlineClose } from 'react-icons/ai';
import { UserAvatar } from '../../../../../../ui-kissbot-v2/common';

const PlayerContainer = styled.div`
    background: #f2f6f9;
    height: 3.2rem;
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;

    span {
        color: #fff;
        font-size: 12px;
        margin: 0 5px;
    }
`;

const PauseIcon = styled(FaPause)`
    font-size: 1.3rem;
    color: #128c7e;
    cursor: pointer;
`;

const PlayIcon = styled(FaPlay)`
    font-size: 1.3rem;
    color: #128c7e;
    cursor: pointer;
`;

const CloseIcon = styled(AiOutlineClose)`
    font-size: 1.3rem;
    color: #000000;
    cursor: pointer;
    margin-left: 10px;
`;

const NameByAudio = styled.span`
    color: #444444 !important;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 120px;
`;

const SliderDiv = styled.div`
    width: 100%;

    .ant-slider {
        margin: 0px;
        height: 7px;
    }
`;

const CustomSlider = styled(Slider)`
    .ant-slider-handle {
        padding: 0;
        margin: 0;
        display: none;
    }
    .ant-slider-track {
        background-color: #128c7e;
        transition: background-color 0.3s ease;
        height: 6px !important ;
    }
    .ant-slider-track:hover {
        background-color: #40c4b7;
    }
`;
const GeneralPlayerView: FC<PlayerViewProps> = (props) => {
    const { audioControls, handlePlay, onOpenClick, onChangeProgress, userNameByAudio, onClose } = props;

    return (
        <>
            <PlayerContainer>
                <Row
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '0 15px',
                    }}
                >
                    <Col style={{ padding: '0 6px' }}>
                        {audioControls?.playing ? (
                            <PauseIcon onClick={handlePlay} />
                        ) : (
                            <PlayIcon onClick={handlePlay} />
                        )}
                    </Col>
                    <Col>
                        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={onOpenClick}>
                            <UserAvatar
                                size={22}
                                user={{
                                    name: userNameByAudio,
                                }}
                                style={{ margin: '0 5px 0 0' }}
                            />

                            <NameByAudio>{userNameByAudio}</NameByAudio>
                        </div>
                    </Col>
                    <Col>
                        <CloseIcon onClick={onClose} />
                    </Col>
                </Row>
            </PlayerContainer>
            <SliderDiv>
                <CustomSlider
                    tooltip={{
                        formatter: null,
                    }}
                    value={audioControls?.percentage}
                    onChange={onChangeProgress}
                />
            </SliderDiv>
        </>
    );
};

export default GeneralPlayerView;
