import { Col, Row } from 'antd';
import { FiFile } from 'react-icons/fi';
import ReactPlayer from 'react-player';
import styled from 'styled-components';

export const Div = styled.div`
  height: max-content;
  border-radius: 5px;
  padding: 20px;
  z-index: 0;
  background-image: url('/v2/assets/img/background-whats.png');
  background-repeat: repeat;
`;

export const Balloon = styled('div')<any>`
  position: relative;
  flex-direction: column;
  border-radius: 0px 5px 0px 0px;
  font-size: 13px;
  padding: 8px 10px 10px 11px;
  color: #696969;
  word-wrap: break-word;
  background: #fff;

  &:after {
    content: '';
    position: absolute;
    top: -9px;
    left: -9px;
    border: 18px solid transparent;
    border-right-color: #fff;
    border-left: 0;
    border-radius: 5px;
    rotate: -90deg;
  }
`;

export const ActivityTimestamp = styled.div`
  display: flex;
  justify-content: flex-end;
  margin: 0 0 -7px 0;
  font-size: 11px;
  color: #696969e0;
`;

export const ButtonWhats = styled(Col)`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 35px;
  color: #1890ff;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  background: #fff;

  :hover {
    color: #188fffcb;
  }
`;

export const ContentFile = styled(Row)`
  min-height: 40px;
  max-height: 110px;
  margin-bottom: 5px;

  video {
    border-radius: 8px;
  }

  .text {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    width: 150px;

    @supports (-webkit-line-clamp: 2) {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: initial;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }
`;

export const ContentButtons = styled(Row)`
  padding-bottom: 3px;
  border-top: 1px solid #e5e5eaeb;
  z-index: 1;
  border-radius: 0 0 5px 5px;
  background: #fff;
  justify-content: center;
`;

export const IconFile = styled(FiFile)`
  font-size: 20px;
  color: #696969;
  margin-right: 10px;
`;

export const ReactPlayerDiv = styled(ReactPlayer)``;
