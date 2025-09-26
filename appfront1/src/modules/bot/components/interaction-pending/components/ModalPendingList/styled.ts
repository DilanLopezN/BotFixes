import { Modal, Row } from 'antd';
import styled from 'styled-components';
import { HiMagnifyingGlass } from 'react-icons/hi2';

const ModalStyled = styled(Modal)`
    .ant-modal-content {
        border-radius: 5px;
    }

    .ant-modal-header {
        border-radius: 5px 5px 0 0;
    }
`;

const ViewIcon = styled(HiMagnifyingGlass)`
    margin-right: 8px;
`;

const Content = styled(Row)`
    display: flex;
    align-items: center;
    margin-bottom: 8px;
`;

export { ModalStyled, ViewIcon, Content };
