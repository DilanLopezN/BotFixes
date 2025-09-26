import React, { FC, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Wrapper } from '../../../../../ui-kissbot-v2/common';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = '/assets/js/pdfWorker/pdf.worker.js';

interface PdfPreviewModalProps {
    fileUrl: string;
}

const PdfPreviewModal: FC<PdfPreviewModalProps> = ({ fileUrl }) => {
    const [numPages, setNumPages] = useState<number>(0);

    const removeTextLayerOffset = () => {
        const textLayers = document.querySelectorAll('.react-pdf__Page__textContent');
        textLayers.forEach((layer) => {
            const { style } = layer as any;
            style.top = '0';
            style.left = '0';
            style.transform = '';
            style.display = 'none';
        });
        const textLayersAnnotations = document.querySelectorAll('.react-pdf__Page__annotations.annotationLayer');
        textLayersAnnotations.forEach((layer) => {
            const { style } = layer as any;
            style.display = 'none';
        });
    };

    const onDocumentLoadSuccess = ({ numPages: totalPages }) => {
        setNumPages(totalPages);
    };

    return (
        <Wrapper
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                maxHeight: '100%',
                overflow: 'hidden',
                width: '100%'
            }}
        >
            <Document 
                file={fileUrl} 
                onLoadSuccess={onDocumentLoadSuccess}
            >
                <div
                    style={{
                        maxHeight: 'calc(100vh - 200px)',
                        overflow: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: '20px',
                        padding: '20px 0',
                        width: '100%'
                    }}
                >
                    {Array.from(new Array(numPages), (el, index) => (
                        <div key={`page_${index + 1}`} style={{ 
                            marginBottom: '20px',
                            display: 'flex',
                            justifyContent: 'center'
                        }}>
                            <Page 
                                pageNumber={index + 1} 
                                onLoadSuccess={removeTextLayerOffset}
                                width={Math.min(800, window.innerWidth - 100)}
                            />
                        </div>
                    ))}
                </div>
            </Document>
            
        </Wrapper>
    );
};

export default PdfPreviewModal;