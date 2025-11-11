import { FC, useState, useEffect } from 'react';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { DropZoneContent, DropZoneIcon, DropZoneOverlay, DropZoneSubText, DropZoneText } from './style';

interface DragDropZoneProps {
    onDrop: (files: FileList) => void;
    disabled?: boolean;
    maxFiles?: number;
}

const DragDropZoneComponent: FC<DragDropZoneProps & I18nProps> = ({
    getTranslation,
    onDrop,
    disabled = false,
    maxFiles = 5,
}) => {
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (disabled) return;

        let dragCounter = 0;

        const handleDragEnter = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();

            dragCounter++;

            // Verifica se tem arquivos sendo arrastados
            if (e.dataTransfer?.types?.includes('Files')) {
                setIsDragging(true);
            }
        };

        const handleDragLeave = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();

            dragCounter--;

            if (dragCounter === 0) {
                setIsDragging(false);
            }
        };

        const handleDragOver = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();

            if (e.dataTransfer) {
                e.dataTransfer.dropEffect = 'copy';
            }
        };

        const handleDrop = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();

            dragCounter = 0;
            setIsDragging(false);

            const files = e.dataTransfer?.files;
            if (files && files.length > 0) {
                console.log('Arquivos arrastados:', files.length);
                onDrop(files);
            }
        };

        // Adicionar listeners no documento para capturar todos os eventos
        document.addEventListener('dragenter', handleDragEnter as any);
        document.addEventListener('dragleave', handleDragLeave as any);
        document.addEventListener('dragover', handleDragOver as any);
        document.addEventListener('drop', handleDrop as any);

        return () => {
            document.removeEventListener('dragenter', handleDragEnter as any);
            document.removeEventListener('dragleave', handleDragLeave as any);
            document.removeEventListener('dragover', handleDragOver as any);
            document.removeEventListener('drop', handleDrop as any);
        };
    }, [disabled, onDrop]);

    if (disabled) return null;

    return (
        <DropZoneOverlay isActive={isDragging}>
            <DropZoneContent>
                <DropZoneIcon>📎</DropZoneIcon>
                <DropZoneText>{getTranslation('Drop files here')}</DropZoneText>
                <DropZoneSubText>
                    {getTranslation('Up to {{max}} files at once').replace('{{max}}', String(maxFiles))}
                </DropZoneSubText>
            </DropZoneContent>
        </DropZoneOverlay>
    );
};

export const DragDropZone = i18n(DragDropZoneComponent);
