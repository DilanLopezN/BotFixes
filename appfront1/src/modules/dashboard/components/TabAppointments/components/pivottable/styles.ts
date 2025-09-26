import styled from 'styled-components';

export const Container = styled.div`
    height: 600px;
    overflow: auto;

    .pvtRenderers,
    .pvtVals,
    .pvtAxisContainer.pvtHorizList.pvtCols {
        position: sticky !important;
        top: 0;
        background: #fff;
        z-index: 1005;
    }

    .pvtRenderers {
        z-index: 1006;
    }

    td {
        background: #fff;
    }
`;
