import { FC } from 'react';
import { Icon } from '../../../../../../ui-kissbot-v2/common';
import { FilePreviewItem } from '../../props';
import {
    GridContainer,
    FileIconWrapper,
    FileName,
    MessageBadge,
    RemoveButton,
    ThumbnailImage,
    ThumbnailWrapper,
} from './style';

interface FilePreviewGridProps {
    files: FilePreviewItem[];
    onRemove: (id: string) => void;
    onSelect?: (id: string) => void;
    selectedId?: string;
}

export const FilePreviewGrid: FC<FilePreviewGridProps> = ({ files, onRemove, onSelect, selectedId }) => {
    return (
        <GridContainer>
            {files.map((fileItem) => (
                <ThumbnailWrapper
                    key={fileItem.id}
                    selected={selectedId === fileItem.id}
                    onClick={() => onSelect?.(fileItem.id)}
                >
                    <RemoveButton
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(fileItem.id);
                        }}
                        title='Remover arquivo'
                    >
                        ×
                    </RemoveButton>

                    {fileItem.isImage ? (
                        <ThumbnailImage src={fileItem.preview as string} alt={fileItem.file.name} />
                    ) : fileItem.isPdf ? (
                        <FileIconWrapper>
                            <Icon name='file-pdf' size='48px' color='#d32f2f' />
                            <FileName>{fileItem.file.name}</FileName>
                        </FileIconWrapper>
                    ) : fileItem.isVideo ? (
                        <FileIconWrapper>
                            <Icon name='file-video' size='48px' color='#1976d2' />
                            <FileName>{fileItem.file.name}</FileName>
                        </FileIconWrapper>
                    ) : (
                        <FileIconWrapper>
                            <Icon name='file-document' size='48px' color='#616161' />
                            <FileName>{fileItem.file.name}</FileName>
                        </FileIconWrapper>
                    )}

                    {fileItem.message && (
                        <MessageBadge title={fileItem.message}>
                            💬{' '}
                            {fileItem.message.length > 15
                                ? fileItem.message.substring(0, 15) + '...'
                                : fileItem.message}
                        </MessageBadge>
                    )}
                </ThumbnailWrapper>
            ))}
        </GridContainer>
    );
};
