import { Button } from 'antd';
import { MdOutlinePhotoCamera } from 'react-icons/md';
import styled from 'styled-components';

const Content = styled('div')`
    display: flex;
    justify-content: center;
    position: relative;
`;

const ContentBody = styled('div')`
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    height: 170px;
    margin: 30px 0 20px 0;
`;

const ContentChangePassword = styled('div')`
    color: #1890ff;
    text-decoration: none;
    cursor: pointer;
    font-weight: bold;
    margin-top: 5px;
`;

const ContentServiceSettings = styled('div')`
    height: 150px;
    padding-top: 20px;
`;

const LabelServiceSettings = styled('div')`
    color: #444444;
    font-size: 16px;
    line-height: 22px;
    font-weight: 700;
    margin-bottom: 15px;
`;

const ButtonStyled = styled(Button)`
    span {
        color: #ffffff;
    }
`;
const ButtonExitStyled = styled(Button)`
    margin-top: 15px;
    span {
        color: #ffffff;
    }
`;

const WidgetPhoto = styled('div')`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 50px;
    height: 50px;
    background-color: #1890ff;
    border-radius: 50%;
    position: absolute;
    cursor: pointer;
    left: 225px;
    top: 105px;

    :hover {
        background-color: #40a9ff;
    }
`;

const IconPhoto = styled(MdOutlinePhotoCamera)`
    width: 24px;
    height: 24px;
    color: #ffffff;
`;

export {
    Content,
    ContentBody,
    ContentChangePassword,
    ContentServiceSettings,
    LabelServiceSettings,
    ButtonStyled,
    ButtonExitStyled,
    WidgetPhoto,
    IconPhoto,
};
