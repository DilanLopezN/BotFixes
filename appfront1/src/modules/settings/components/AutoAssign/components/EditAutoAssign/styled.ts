import styled from 'styled-components';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { Section } from '../../../Section';

const CustomSection = styled(Section)`
    margin: 20px 0 0 0;

    .input-phone-dropdown{
        top: -120px;
    }
`;
const BoxLabelsGrid = styled(Wrapper)`
    display: grid;
    grid-template-columns: 0.7fr 1fr;
    column-gap: 16px;
`;
const BoxLabelsFlex = styled(Wrapper)`
    display: flex;
    justify-content: flex-end;
    padding: 0 8px;
`;

const Content = styled.div`
    .ant-btn-link {
        color: #696969;
    }

    .ant-btn-link:hover {
        color: #409aff;
    }
`;
const Rows = styled.div`
    align-items: center;
    justify-content: space-between;
    display: flex;
    height: 25px;
`;

const iconStyle = {
    fontSize: '18px',
    marginRight: '8px',
};

export { CustomSection, Content, BoxLabelsGrid, BoxLabelsFlex, Rows, iconStyle };
