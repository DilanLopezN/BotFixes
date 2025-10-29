import styled from 'styled-components';

const Miniature = styled.img <{ selected: boolean }>`
    cursor: pointer;
    max-width: 100%;
    height: 90px;
    margin: auto;
    object-fit: cover;
    min-width: 90px;
    border-radius: 3px;
    border: 4px solid #e0e0e0;
    transition: all 0.2s;
    :hover {
        outline: 5px solid #e0e0e0;
    }
    ${props => props.selected && `
        transform: scale(0.80);
          ` }
`;

const Content = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    background: #f5f5f5;
    position: relative;
`;

const ContentView = styled.div`
    display: flex;
    position: absolute;
    bottom: 120px;
    top: 70px;
    right: 0;
    left: 0;
`;

const PreviewAttachments = styled.div`
    &::-webkit-scrollbar {
        height: 7px;
    }

    &::-webkit-scrollbar-track {
        border-radius: 0px;
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background :rgba(17, 17, 17, 0.3);
        border-radius: 0px;
        box-shadow: none;
    }

    padding: 10px 10px 5px 10px;
    height: 120px;
    display: flex;
    border-top: 1px #e0e0e0 solid;
    overflow-x: auto;
    background: #FFF;
    position: fixed;
    bottom: 0;
    right: 0;
    left: 0;
`;

interface CropAreaProps {
    showDocumentUpload?: boolean;
}

const CropArea = styled.div<CropAreaProps>`
    display: flex;
    overflow: hidden;
    height: 100%;
    padding: 20px;
    position: relative;
    background: #f5f5f5;
    opacity: 1;
    flex: 1;
    align-items: center;
    margin: 0 0 0 3px;
    width: ${props => props.showDocumentUpload ? 'calc(100% - 300px)' : '100%'};
    transition: width 0.3s ease;
`;

export {
    PreviewAttachments,
    Miniature,
    CropArea,
    ContentView,
    Content
}