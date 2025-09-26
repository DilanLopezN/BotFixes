import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import styled from 'styled-components';

const Spin = styled(AiOutlineLoading3Quarters)`
    @keyframes rotation {
        from {
            -webkit-transform: rotate(0deg);
        }
        to {
            -webkit-transform: rotate(359deg);
        }
    }

    font-size: 40px;
    animation: rotation 800ms infinite linear;
    color: #666;
`;

const LoadingArea = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 60px;
`;

export { Spin, LoadingArea };
