import styled from 'styled-components';

const GridContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
    padding: 16px;
    max-height: 300px;
    overflow-y: auto;
`;

const ThumbnailWrapper = styled.div<{ selected?: boolean }>`
    position: relative;
    width: 120px;
    height: 120px;
    border-radius: 8px;
    overflow: hidden;
    background: #f5f5f5;
    border: 2px solid ${(props) => (props.selected ? '#59a3d6' : '#e0e0e0')};
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        border-color: #59a3d6;
        transform: scale(1.02);
    }
`;

const RemoveButton = styled.button`
    position: absolute;
    top: 4px;
    right: 4px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.7);
    border: none;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    transition: background 0.2s;

    &:hover {
        background: rgba(255, 0, 0, 0.8);
    }
`;

const ThumbnailImage = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;
`;

const FileIconWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 8px;
`;

const FileName = styled.div`
    font-size: 10px;
    text-align: center;
    margin-top: 8px;
    word-break: break-all;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    color: #666;
`;

const MessageBadge = styled.div`
    position: absolute;
    bottom: 4px;
    left: 4px;
    background: rgba(89, 163, 214, 0.9);
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 2px;
`;

export { GridContainer, MessageBadge, FileIconWrapper, FileName, ThumbnailImage, ThumbnailWrapper, RemoveButton };
