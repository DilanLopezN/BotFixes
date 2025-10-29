import { Dropdown } from 'antd';
import styled from 'styled-components';

import { Wrapper } from '../../../../../../ui-kissbot-v2/common';

export const Container = styled(Wrapper)`
    input[type='search'] {
        padding-left: 0px !important;
        padding-right: 0px !important;
    }
`;

export const FieldWrapper = styled.div`
    margin: 10px 0;

    .react-select__menu {
        z-index: 5;
    }
    span {
        z-index: 0;
    }
`;

export const ButtonSelect = styled(Dropdown.Button)`
    span {
        color: #fff !important;
    }
`;
