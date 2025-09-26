import React, { FC, useCallback, useState } from 'react'
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import styled from 'styled-components';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import Popover from 'react-popover';
import ClickOutside from 'react-click-outside';

interface DownloadButtonProps {
    url: string;
    fileName: string;
    showPdfPopover?: boolean;
    onClosePdfPopover?: () => void;
    isPdfFile?: boolean;
}

const IconTag = styled.span <{ margin?: string }>`
  ${props => props.margin && `
    ::before {
      margin: ${props.margin}
    }
  `}
  font-size: 27px;
  cursor: pointer;
`;

const PopoverContent = styled.div`
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    padding: 12px;
    min-width: 210px;
`;

const PopoverItem = styled.div`
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #333;
    
    &:hover {
        background-color: #f5f5f5;
    }
    
    i {
        font-size: 16px;
    }
`;

const PdfNotificationPopover = styled.div`
    background: #007bff;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 13px;
    width: 280px;
    line-height: 1.4;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    position: relative;
    
    .close-btn {
        background: none;
        border: none;
        color: white;
        float: right;
        font-size: 16px;
        cursor: pointer;
        margin-left: 8px;
        margin-top: -2px;
        
        &:hover {
            opacity: 0.8;
        }
    }
`;

const DownloadButton: FC<DownloadButtonProps & I18nProps> = ({
    url: fileUrl,
    fileName,
    getTranslation,
    showPdfPopover,
    onClosePdfPopover,
    isPdfFile,
}) => {
    const [downloading, setDownloading] = useState(false);
    const [showPopover, setShowPopover] = useState(false);

    const download = useCallback(() => {
        setDownloading(true);
        setShowPopover(false);
        const url = `${fileUrl}?download=true`

        fetch(url)
            .then(resp => resp.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                setDownloading(false)
            })
            .catch((e) => console.log(e, 'download error'));

    }, [fileUrl])

    const openInNewTab = useCallback(() => {
        setShowPopover(false);
        window.open(fileUrl, '_blank');
    }, [fileUrl]);

    return (
        <Wrapper
            alignItems='center'
            margin='0 0 0 18px'
            flexBox>
            {downloading ? (
                <img
                    src='assets/img/loading-2.gif'
                    width='26px'
                    height='26px'
                    title={getTranslation('Downloading')}
                />
            ) : (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    {/* Alerta do PDF - div absoluto sem seta */}
                    {showPdfPopover && (
                        <ClickOutside onClickOutside={onClosePdfPopover || (() => {})}>
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '8px',
                                zIndex: 1000
                            }}>
                                <PdfNotificationPopover>
                                    <button 
                                        className="close-btn"
                                        onClick={onClosePdfPopover}
                                    >
                                        ×
                                    </button>
                                    <strong>💡 Dica:</strong><br />
                                    Agora o download de arquivos PDF está no menu. Clique no ícone de download para ver as opções.
                                </PdfNotificationPopover>
                            </div>
                        </ClickOutside>
                    )}
                        {/* Menu de download para PDFs */}
                        {isPdfFile ? (
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <IconTag
                                    className="mdi mdi-download"
                                    onClick={() => setShowPopover(!showPopover)}
                                    title={getTranslation('Download')}
                                />
                                {showPopover && (
                                    <ClickOutside onClickOutside={() => setShowPopover(false)}>
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            right: 0,
                                            marginTop: '8px',
                                            zIndex: 1001
                                        }}>
                                            <PopoverContent>
                                                <PopoverItem onClick={download}>
                                                    <i className="mdi mdi-download" />
                                                    Baixar
                                                </PopoverItem>
                                                <PopoverItem onClick={openInNewTab}>
                                                    <i className="mdi mdi-open-in-new" />
                                                    Abrir em nova aba
                                                </PopoverItem>
                                            </PopoverContent>
                                        </div>
                                    </ClickOutside>
                                )}
                            </div>
                        ) : (
                            <IconTag
                                className="mdi mdi-download"
                                onClick={download}
                                title={getTranslation('Download')}
                            />
                        )}
                </div>
            )}
        </Wrapper>
    )
}

export default i18n(DownloadButton) as FC<DownloadButtonProps>;
